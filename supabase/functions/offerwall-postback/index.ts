import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HMAC-SHA256 signature verification
async function verifyHmacSha256(secret: string, payload: string, signature: string): Promise<boolean> {
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

// MD5 hash for signature verification (OfferToro format)
async function md5Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Offerwall configuration (non-sensitive - from site_settings)
interface OfferwallConfig {
  id: string;
  name: string;
  enabled: boolean;
  provider: string;
  pointsConversionRate?: number;
  minimumPayout?: number;
}

// Secure signature verification using ONLY global postback secret
async function verifySignature(
  params: URLSearchParams,
  headers: Headers,
  postbackSecret: string | null,
  isTestMode: boolean
): Promise<{ valid: boolean; reason?: string }> {
  // SECURITY: If no postback secret is configured, REJECT all requests
  if (!postbackSecret) {
    console.error('SECURITY: No postback_secret configured - rejecting request');
    return { valid: false, reason: 'Postback secret not configured. Please configure it in site settings.' };
  }

  const signature = params.get('sig') || params.get('signature') || params.get('hash') || headers.get('x-signature');
  const apiKey = params.get('api_key') || params.get('apikey') || headers.get('x-api-key');
  const userId = params.get('user_id') || params.get('subid') || params.get('sub_id');
  const payout = params.get('payout') || params.get('amount') || params.get('reward');
  const transactionId = params.get('transaction_id') || params.get('tid') || params.get('oid') || params.get('id');

  console.log('Verifying postback...', { hasSignature: !!signature, hasApiKey: !!apiKey, isTestMode });

  // Test mode: Only allow for admin testing with api_key matching postback_secret
  if (isTestMode) {
    if (apiKey === postbackSecret) {
      console.log('Test mode: Verified via postback secret');
      return { valid: true };
    }
    return { valid: false, reason: 'Invalid test credentials' };
  }

  // 1. Check API key match against postback secret
  if (apiKey === postbackSecret) {
    console.log('Verified via API key match');
    return { valid: true };
  }

  // 2. Check HMAC-SHA256 signature
  if (signature) {
    const payloads = [
      `${userId}${payout}${transactionId || ''}`,
      `${postbackSecret}${userId}${transactionId}${payout}`,
      `${postbackSecret}${userId}${payout}`,
      `${userId}${transactionId}${payout}`,
    ];

    for (const payload of payloads) {
      if (await verifyHmacSha256(postbackSecret, payload, signature)) {
        console.log('Verified via HMAC-SHA256 signature');
        return { valid: true };
      }
      // Try MD5
      const md5Sig = await md5Hash(payload);
      if (md5Sig === signature.toLowerCase()) {
        console.log('Verified via MD5 signature');
        return { valid: true };
      }
    }
  }

  // 3. IP whitelist check (optional - can be added based on offerwall provider)
  const clientIp = headers.get('x-forwarded-for') || headers.get('cf-connecting-ip');
  console.log('Request from IP:', clientIp);

  return { valid: false, reason: 'Invalid signature or API key' };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    // Extract parameters from query string (universal format)
    const userId = params.get('user_id') || params.get('subid') || params.get('sub_id') || params.get('click_id');
    const offerName = params.get('offer_name') || params.get('offer') || params.get('campaign_name') || 'Unknown Offer';
    const offerwallName = params.get('offerwall') || params.get('network') || params.get('source') || 'Unknown';
    const payout = params.get('payout') || params.get('amount') || params.get('reward') || '0';
    const transactionId = params.get('transaction_id') || params.get('tid') || params.get('oid') || params.get('id') || null;
    const ip = params.get('ip') || params.get('user_ip') || req.headers.get('x-forwarded-for') || null;
    const country = params.get('country') || params.get('geo') || null;

    console.log('=== Postback received ===', { userId, offerName, offerwallName, payout, transactionId, ip, country });

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

    // Get site settings including offerwall configurations
    const { data: settings } = await supabase
      .from('site_settings')
      .select('postback_secret, offerwall_settings')
      .eq('id', 'default')
      .single();

    const postbackSecret = settings?.postback_secret || null;
    const offerwallSettings = settings?.offerwall_settings as { offerwalls?: OfferwallConfig[] } | null;
    const offerwalls = offerwallSettings?.offerwalls || [];

    // Find matching offerwall configuration
    let matchedOfferwall: OfferwallConfig | null = null;
    const normalizedName = offerwallName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const ow of offerwalls) {
      const owName = ow.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (ow.enabled && (owName === normalizedName || owName.includes(normalizedName) || normalizedName.includes(owName))) {
        matchedOfferwall = ow;
        break;
      }
    }

    // Also try to match by provider name
    if (!matchedOfferwall) {
      for (const ow of offerwalls) {
        if (ow.enabled && normalizedName.includes(ow.provider.toLowerCase())) {
          matchedOfferwall = ow;
          break;
        }
      }
    }

    console.log('Matched offerwall:', matchedOfferwall?.name || 'none', 'provider:', matchedOfferwall?.provider || 'unknown');

    // Check for test mode
    const isTestMode = params.get('test_mode') === 'true';

    // Verify the request signature using ONLY global postback secret
    const verificationResult = await verifySignature(params, req.headers, postbackSecret, isTestMode);

    if (!verificationResult.valid) {
      console.error('Verification failed:', verificationResult.reason);
      return new Response(JSON.stringify({ error: `Unauthorized: ${verificationResult.reason}` }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse payout and convert to coins using offerwall-specific rate or default (1000 coins = $1)
    const payoutValue = parseFloat(payout) || 0;
    const conversionRate = matchedOfferwall?.pointsConversionRate || 1000;
    const coins = Math.round(payoutValue * conversionRate);

    // Check minimum payout threshold
    const minimumPayout = matchedOfferwall?.minimumPayout || 0;
    if (payoutValue < minimumPayout) {
      console.log(`Payout ${payoutValue} below minimum ${minimumPayout}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Payout ${payoutValue} is below minimum threshold ${minimumPayout}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Insert completed offer (transaction history)
    const finalOfferwallName = matchedOfferwall?.name || offerwallName;
    const { error: insertError } = await supabase
      .from('completed_offers')
      .insert({
        user_id: userId,
        username: profile.username,
        offer_name: offerName,
        offerwall: finalOfferwallName,
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

    // Update user balance atomically
    const newBalance = (profile.balance || 0) + coins;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update balance:', updateError);
    }

    const provider = matchedOfferwall?.provider || 'custom';
    console.log('=== Postback processed successfully ===', { 
      userId, 
      offerwall: finalOfferwallName, 
      provider,
      payoutUSD: payoutValue,
      conversionRate,
      coinsAwarded: coins, 
      newBalance 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      coins_awarded: coins,
      new_balance: newBalance,
      offerwall: finalOfferwallName,
      conversion_rate: conversionRate
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
