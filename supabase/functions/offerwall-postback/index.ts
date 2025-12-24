import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple HMAC-SHA256 implementation for signature verification
async function verifySignature(secret: string, payload: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return expectedSignature === signature.toLowerCase();
  } catch {
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    // Extract parameters from query string (common offerwall format)
    const userId = params.get('user_id') || params.get('subid') || params.get('sub_id');
    const offerName = params.get('offer_name') || params.get('offer') || params.get('campaign_name') || 'Unknown Offer';
    const offerwall = params.get('offerwall') || params.get('network') || params.get('source') || 'Unknown';
    const payout = params.get('payout') || params.get('amount') || params.get('reward') || '0';
    const transactionId = params.get('transaction_id') || params.get('tid') || params.get('id') || null;
    const ip = params.get('ip') || params.get('user_ip') || req.headers.get('x-forwarded-for') || null;
    const country = params.get('country') || params.get('geo') || null;
    
    // Security: Get signature from header or query param
    const signature = req.headers.get('x-signature') || params.get('signature') || params.get('sig');
    const apiKey = req.headers.get('x-api-key') || params.get('api_key');

    console.log('Postback received:', { userId, offerName, offerwall, payout, transactionId, ip, country, hasSignature: !!signature, hasApiKey: !!apiKey });

    // Validate required parameters
    if (!userId) {
      console.error('Missing user_id parameter');
      return new Response(JSON.stringify({ error: 'Missing user_id parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Verify the request using postback_secret or API key
    const { data: settings } = await supabase
      .from('site_settings')
      .select('postback_secret, offerwall_settings')
      .eq('id', 'default')
      .single();

    const postbackSecret = settings?.postback_secret;
    
    // If postback_secret exists, verify the request
    if (postbackSecret) {
      let isAuthenticated = false;

      // Method 1: Check API key
      if (apiKey && apiKey === postbackSecret) {
        isAuthenticated = true;
        console.log('Authenticated via API key');
      }

      // Method 2: Check HMAC signature
      if (!isAuthenticated && signature) {
        // Create payload string for signature verification
        const payloadString = `${userId}${payout}${transactionId || ''}`;
        const isValid = await verifySignature(postbackSecret, payloadString, signature);
        if (isValid) {
          isAuthenticated = true;
          console.log('Authenticated via signature');
        }
      }

      // Method 3: Check offerwall-specific API keys from settings
      if (!isAuthenticated && settings?.offerwall_settings) {
        try {
          const offerwallSettings = settings.offerwall_settings as { offerwalls?: Array<{ name?: string; apiKey?: string }> };
          const offerwalls = offerwallSettings?.offerwalls || [];
          for (const ow of offerwalls) {
            if (ow.apiKey && (apiKey === ow.apiKey || (ow.name && offerwall.toLowerCase().includes(ow.name.toLowerCase())))) {
              // If offerwall name matches and has API key, verify it
              if (apiKey === ow.apiKey) {
                isAuthenticated = true;
                console.log(`Authenticated via offerwall API key: ${ow.name}`);
                break;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing offerwall settings:', e);
        }
      }

      if (!isAuthenticated) {
        console.error('Unauthorized postback attempt - no valid authentication');
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or missing authentication' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.warn('WARNING: No postback_secret configured - accepting request without verification');
    }

    // Parse payout - convert to coins (1 coin = $0.001, so $1 = 1000 coins)
    const payoutValue = parseFloat(payout) || 0;
    const coins = Math.round(payoutValue * 1000); // Convert dollars to coins

    if (coins <= 0) {
      console.error('Invalid payout value:', payout);
      return new Response(JSON.stringify({ error: 'Invalid payout value' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if transaction already exists (prevent duplicates)
    if (transactionId) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction:', transactionId);
        return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get user profile to get username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, balance')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('User not found:', userId, profileError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert completed offer
    const { error: insertError } = await supabase
      .from('completed_offers')
      .insert({
        user_id: userId,
        username: profile.username,
        offer_name: offerName,
        offerwall: offerwall,
        coin: coins,
        transaction_id: transactionId,
        ip: ip,
        country: country || 'Unknown',
      });

    if (insertError) {
      console.error('Failed to insert offer:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to record offer' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user balance
    const newBalance = (profile.balance || 0) + coins;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update balance:', updateError);
      // Offer was recorded, but balance update failed - log for manual fix
    }

    console.log('Postback processed successfully:', { userId, coins, newBalance });

    return new Response(JSON.stringify({ 
      success: true, 
      coins_awarded: coins,
      new_balance: newBalance 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Postback error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
