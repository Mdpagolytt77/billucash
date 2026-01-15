import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vortexwall Configuration - from environment variables
const VORTEXWALL_SECRET_KEY = Deno.env.get('VORTEXWALL_SECRET_KEY');

// Security limits
const MAX_PAYOUT = 1000; // Maximum $1000 per transaction
const MAX_OFFER_NAME_LENGTH = 200;

// Helper to convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
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
    // Check if secret is configured
    if (!VORTEXWALL_SECRET_KEY) {
      console.error('[Security] Missing VORTEXWALL_SECRET_KEY environment variable');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const url = new URL(req.url);
    const params = url.searchParams;

    // Get client IP (kept for logging + storage only)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || '';

    console.log('=== Vortexwall Postback Received ===');
    console.log('Client IP:', clientIp);

    // Extract Vortexwall parameters
    // Support multiple parameter names for flexibility
    const identityId = params.get('identity_id') || params.get('user_id') || params.get('uid');
    const campaignId = params.get('campaign_id') || params.get('cid') || params.get('offer_id') || '';
    const txid = params.get('txid') || params.get('transaction_id') || params.get('tid') || '';
    const incomingHash = params.get('hash') || params.get('sig') || params.get('signature') || '';
    const result = params.get('result') || params.get('status') || 'completed';
    const points = params.get('points') || params.get('payout') || params.get('reward') || params.get('amount') || '0';
    
    // Get offer name - check multiple parameter names and decode URL encoding
    let offerNameRaw = params.get('offer_name') || params.get('offer') || params.get('campaign_name') || 
                       params.get('offername') || params.get('name') || params.get('campaign') || '';
    
    // Decode URL-encoded offer name and check if it's a placeholder
    let offerName = offerNameRaw ? decodeURIComponent(offerNameRaw) : '';
    
    // Check if the value is still a placeholder macro (not replaced by the offerwall)
    const placeholderPatterns = [
      /^\{.*\}$/,           // {OFFER_NAME}, {offer_name}
      /^\[.*\]$/,           // [OFFER_NAME], [offer_name]
      /^%.*%$/,             // %OFFER_NAME%, %offer_name%
      /^\$\{.*\}$/,         // ${OFFER_NAME}
      /^{{.*}}$/,           // {{OFFER_NAME}}
    ];
    
    const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(offerName));
    
    if (!offerName || isPlaceholder) {
      // If no valid offer name, try to use campaign_id as fallback
      offerName = campaignId ? `Offer #${campaignId}` : 'Vortexwall Offer';
      console.log('[Info] Using fallback offer name:', offerName, '(original was placeholder or empty)');
    }
    
    const country = params.get('country') || params.get('geo') || params.get('country_code') || 'Unknown';

    console.log('Parameters received:', { identityId: !!identityId, txid: !!txid, result, points: !!points });

    // Validate required parameters
    if (!identityId) {
      console.error('[Validation] Missing identity_id parameter');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // SECURITY: Hash Verification - SHA256(identity_id + campaign_id + txid + secret_key)
    const hashPayload = `${identityId}${campaignId}${txid}${VORTEXWALL_SECRET_KEY}`;
    const expectedHash = await sha256Hash(hashPayload);

    console.log('[Security] Hash verification in progress');

    // Verify hash - REQUIRED for all requests
    if (!incomingHash) {
      console.error('[Security] Missing hash parameter');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    if (expectedHash.toLowerCase() !== incomingHash.toLowerCase()) {
      console.error('[Security] Hash verification failed');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    console.log('[Security] Hash verification passed');

    // Parse points (can be negative for rejections)
    let pointsValue = parseFloat(points) || 0;

    // SECURITY: Maximum payout validation
    if (Math.abs(pointsValue) > MAX_PAYOUT) {
      console.error(`[Security] Points ${pointsValue} exceeds maximum ${MAX_PAYOUT}`);
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Handle result status
    if (result.toLowerCase() === 'rejected' || result.toLowerCase() === 'chargeback') {
      if (pointsValue > 0) {
        pointsValue = -pointsValue;
      }
      console.log('Processing rejection/chargeback, points:', pointsValue);
    } else if (result.toLowerCase() !== 'completed') {
      console.log('Unknown result status, ignoring');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
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
    if (txid) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', txid)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction, already processed');
        return new Response('Approved', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, balance')
      .eq('id', identityId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('[Validation] User not found');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Use the increment_balance function
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: identityId,
      amount_input: pointsValue
    });

    if (balanceError) {
      console.error('Failed to update balance:', balanceError);
    }

    // Get updated balance
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', identityId)
      .maybeSingle();

    const newBalance = updatedProfile?.balance || 0;

    // Insert completed offer record
    const { error: insertError } = await supabase
      .from('completed_offers')
      .insert({
        user_id: identityId,
        username: profile.username,
        offer_name: offerName,
        offerwall: 'Vortexwall',
        coin: pointsValue,
        transaction_id: txid || `vw_${Date.now()}`,
        ip: clientIp || null,
        country: country,
      });

    if (insertError) {
      console.error('Failed to insert offer:', insertError);
    }

    console.log('=== Vortexwall Postback Processed ===', {
      result,
      points: pointsValue,
      newBalance
    });

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
