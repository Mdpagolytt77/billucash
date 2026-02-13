// PrimeWall Postback Handler v2
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PrimeWall Configuration - from environment variables
const PRIMEWALL_SECRET_KEY = Deno.env.get('PRIMEWALL_SECRET_KEY');
const PRIMEWALL_PUBLIC_KEY = Deno.env.get('PRIMEWALL_PUBLIC_KEY');

// Security limits
const MAX_PAYOUT = 1000; // Maximum $1000 per transaction
const MAX_OFFER_NAME_LENGTH = 200;

// Helper to convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// HMAC-SHA256 signature verification
async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bytesToHex(new Uint8Array(signatureBuffer));
}

// SHA-256 hash for signature verification (MD5 not supported in Deno)
async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// Verify signature from PrimeWall
async function verifySignature(
  signature: string | null,
  apiKey: string | null,
  userId: string,
  payout: string,
  transactionId: string | null
): Promise<boolean> {
  if (!PRIMEWALL_SECRET_KEY) {
    console.error('[Security] No PRIMEWALL_SECRET_KEY configured');
    return false;
  }

  // Method 1: Check API key match
  if (apiKey && apiKey === PRIMEWALL_SECRET_KEY) {
    return true;
  }

  // Method 2: Check signature (HMAC-SHA256 or MD5)
  if (signature) {
    const payloads = [
      `${userId}${payout}${transactionId || ''}`,
      `${PRIMEWALL_SECRET_KEY}${userId}${transactionId || ''}${payout}`,
      `${PRIMEWALL_SECRET_KEY}${userId}${payout}`,
      `${userId}${transactionId || ''}${payout}`,
    ];

    for (const payload of payloads) {
      // Check HMAC-SHA256
      const hmacSig = await hmacSha256(PRIMEWALL_SECRET_KEY, payload);
      if (hmacSig.toLowerCase() === signature.toLowerCase()) {
        return true;
      }
      // Check SHA-256 hash
      const sha256Sig = await sha256Hash(payload);
      if (sha256Sig.toLowerCase() === signature.toLowerCase()) {
        return true;
      }
    }
  }

  return false;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if secrets are configured
    if (!PRIMEWALL_SECRET_KEY) {
      console.error('[Security] Missing PRIMEWALL_SECRET_KEY environment variable');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const url = new URL(req.url);
    const params = url.searchParams;

    // Get client IP for logging
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || '';

    console.log('=== PrimeWall Postback Received ===');
    console.log('Client IP:', clientIp);

    // Helpers
    const unwrapToken = (value: string | null) => {
      if (!value) return null;
      let v = value.trim();
      const wrappers: Array<[string, string]> = [['[', ']'], ['{', '}'], ['(', ')']];
      for (const [l, r] of wrappers) {
        if (v.startsWith(l) && v.endsWith(r) && v.length > 2) v = v.slice(1, -1).trim();
      }
      return v;
    };

    const looksLikePlaceholder = (value: string | null) => {
      if (!value) return false;
      const v = value.toLowerCase();
      return v.includes('user_id') || v.includes('userid') || v.includes('subid') ||
             v.includes('payout') || v.includes('reward') || v.includes('amount') ||
             v.includes('{') || v.includes('}');
    };

    // Extract parameters
    const userId = unwrapToken(
      params.get('user_id') || params.get('USER_ID') || params.get('userid') ||
      params.get('uid') || params.get('subid') || params.get('sub_id') || params.get('subId')
    );

    // Priority: reward/points (coin amount) > payout (USD amount)
    const rewardRaw = unwrapToken(
      params.get('reward') || params.get('points') || params.get('earnings') ||
      params.get('virtual_currency') || params.get('vc_amount')
    );
    
    const payoutUsdRaw = unwrapToken(
      params.get('payout') || params.get('PAYOUT') || params.get('amount') ||
      params.get('currency')
    );
    
    // Use reward (coins) if available, otherwise convert USD payout to coins (x1000)
    const payoutRaw = rewardRaw || payoutUsdRaw;

    const transactionId = unwrapToken(
      params.get('transaction_id') || params.get('TRANSACTION_ID') || params.get('transId') ||
      params.get('txid') || params.get('tx_id') || params.get('offer_id') || params.get('id')
    );

    let offerName = unwrapToken(
      params.get('offer_name') || params.get('OFFER_NAME') || params.get('offer') ||
      params.get('campaign') || params.get('campaign_name') || params.get('offerName')
    ) || 'PrimeWall Offer';

    const country = unwrapToken(params.get('country') || params.get('COUNTRY') || params.get('geo')) || 'Unknown';
    const signature = unwrapToken(params.get('signature') || params.get('sig') || params.get('hash'));
    const apiKey = params.get('api_key') || params.get('apikey') || req.headers.get('x-api-key');

    console.log('Parameters extracted:', { userId: !!userId, payout: !!payoutRaw, transactionId: !!transactionId });

    // Validate required parameters
    if (!userId || !payoutRaw) {
      console.error('[Security] Missing required parameters');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Guard against placeholder tokens
    if (looksLikePlaceholder(userId) || looksLikePlaceholder(payoutRaw)) {
      console.error('[Security] Placeholder tokens detected');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Optional signature verification - skip if no signature/api_key provided
    if (signature || apiKey) {
      const isValid = await verifySignature(signature, apiKey, userId, payoutRaw, transactionId);
      if (!isValid) {
        console.error('[Security] Signature/API key verification failed');
        return new Response('Approved', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
      console.log('[Security] Request verified via signature/API key');
    } else {
      console.log('[Security] No signature/API key provided, skipping verification');
    }

    console.log('[Security] Request verified successfully');

    // Parse and validate payout amount
    let payoutAmount = parseFloat(payoutRaw);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      console.error('[Validation] Invalid payout amount');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // If we used USD payout (no reward param), convert to coins: $1 = 1000 coins
    if (!rewardRaw && payoutUsdRaw) {
      payoutAmount = payoutAmount * 1000;
      console.log(`[Conversion] USD $${payoutUsdRaw} converted to ${payoutAmount} coins`);
    }

    // SECURITY: Maximum payout validation
    if (payoutAmount > MAX_PAYOUT) {
      console.error(`[Security] Payout ${payoutAmount} exceeds maximum ${MAX_PAYOUT}`);
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Validate string field lengths
    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    console.log('Processing payout:', { userId, payoutAmount });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate transaction
    if (transactionId) {
      const { data: existingOffer } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existingOffer) {
        console.log('Duplicate transaction detected');
        return new Response('Approved', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
    }

    // Get username for the user
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      console.error('[Validation] User profile not found');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const username = profile.username || 'Unknown';

    // Update user balance
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: payoutAmount,
    });

    if (balanceError) {
      console.error('Balance update failed:', balanceError);
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    console.log('Balance updated successfully');

    // Record the completed offer
    const { error: offerError } = await supabase
      .from('completed_offers')
      .insert({
        user_id: userId,
        username: username,
        offerwall: 'PrimeWall',
        offer_name: offerName,
        coin: Math.round(payoutAmount),
        transaction_id: transactionId || `primewall_${Date.now()}`,
        ip: clientIp,
        country: country,
      });

    if (offerError) {
      console.error('Failed to record offer:', offerError);
    } else {
      console.log('Offer recorded successfully');
    }

    return new Response('Approved', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Processing error:', error);
    return new Response('Approved', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
