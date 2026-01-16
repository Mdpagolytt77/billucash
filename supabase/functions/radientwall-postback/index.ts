import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security limits
const MAX_PAYOUT = 1000;
const MAX_OFFER_NAME_LENGTH = 200;

// Helper to convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// MD5 hash function
async function md5Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// SHA256 hash function
async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Get the raw query string and fix encoding issues
    let rawQuery = decodeURIComponent(url.search);
    rawQuery = rawQuery
      .replace(/&amp;/gi, '&')
      .replace(/&amp%3B/gi, '&')
      .replace(/amp;/gi, '');
    
    const fixedUrl = new URL(url.origin + url.pathname + rawQuery);
    const params = fixedUrl.searchParams;

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || '';

    console.log('=== RadientWall Postback Received ===');
    console.log('Client IP:', clientIp);
    console.log('Original query:', url.search);
    console.log('Fixed query:', rawQuery);
    console.log('All params:', Object.fromEntries(params.entries()));

    // Extract RadientWall parameters - specifically use user_id
    const userId = url.searchParams.get('user_id') || '';
    const txid = url.searchParams.get('transaction_id') || '';
    let offerName = url.searchParams.get('offer_name') || 'RadientWall Offer';
    const payout = url.searchParams.get('payout') || '0';
    
    // Additional optional parameters
    const status = url.searchParams.get('status') || 'completed';
    const country = url.searchParams.get('country') || 'Unknown';
    const userIp = url.searchParams.get('ip') || clientIp || '';
    
    console.log('Parsed RadientWall values:', { userId, txid, offerName, payout });

    // Validate required parameters
    if (!userId) {
      console.error('[Validation] Missing user_id parameter');
      return new Response(JSON.stringify({ success: false, error: 'Missing user_id' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse payout
    let payoutValue = parseFloat(payout) || 0;

    // SECURITY: Maximum payout validation
    if (Math.abs(payoutValue) > MAX_PAYOUT) {
      console.error(`[Security] Payout ${payoutValue} exceeds maximum ${MAX_PAYOUT}`);
      return new Response(JSON.stringify({ success: false, error: 'Payout exceeds limit' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle status
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'rejected' || lowerStatus === 'chargeback' || lowerStatus === 'reversed') {
      if (payoutValue > 0) {
        payoutValue = -payoutValue;
      }
      console.log('Processing rejection/chargeback, payout:', payoutValue);
    }

    // Validate string field lengths
    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate transaction
    const transactionId = txid || `radientwall_${Date.now()}_${userId}`;
    if (txid) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', txid)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction, already processed');
        return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, balance')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('[Validation] User not found:', userId);
      return new Response(JSON.stringify({ success: false, error: 'User not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate coins to award
    const coinsToAward = Math.round(payoutValue);

    // Use the increment_balance function
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: coinsToAward
    });

    if (balanceError) {
      console.error('Failed to update balance:', balanceError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to update balance' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get updated balance
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .maybeSingle();

    const newBalance = updatedProfile?.balance || 0;

    // Insert completed offer record
    const { error: insertError } = await supabase
      .from('completed_offers')
      .insert({
        user_id: userId,
        username: profile.username,
        offer_name: offerName,
        offerwall: 'RadientWall',
        coin: coinsToAward,
        transaction_id: transactionId,
        ip: userIp || null,
        country: country,
      });

    if (insertError) {
      console.error('Failed to insert offer:', insertError);
    }

    console.log('=== RadientWall Postback Processed Successfully ===', {
      userId,
      offerName,
      coinsAwarded: coinsToAward,
      newBalance,
      transactionId
    });

    // Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Postback processed',
      coins_awarded: coinsToAward,
      new_balance: newBalance
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Processing error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
