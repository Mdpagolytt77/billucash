import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vortexwall Configuration
const VORTEXWALL_SECRET_KEY = '6916b40b-a04f-4c67-9981-dd55e2c2db1a';
const VORTEXWALL_WHITELISTED_IP = '157.230.103.196';

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
    const url = new URL(req.url);
    const params = url.searchParams;

    // Get client IP for whitelist check
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || '';

    console.log('=== Vortexwall Postback Received ===');
    console.log('Client IP:', clientIp);
    console.log('All params:', Object.fromEntries(params.entries()));

    // IP Whitelist Check (optional - log warning if not matching)
    if (clientIp && clientIp !== VORTEXWALL_WHITELISTED_IP) {
      console.warn(`IP ${clientIp} is not in whitelist (${VORTEXWALL_WHITELISTED_IP})`);
      // We log but don't reject - signature verification is more important
    }

    // Extract Vortexwall parameters
    const identityId = params.get('identity_id');
    const campaignId = params.get('campaign_id') || params.get('cid') || '';
    const txid = params.get('txid') || params.get('transaction_id') || '';
    const incomingHash = params.get('hash') || params.get('sig') || '';
    const result = params.get('result') || 'completed';
    const points = params.get('points') || params.get('payout') || '0';
    const offerName = params.get('offer_name') || params.get('campaign_name') || 'Vortexwall Offer';
    const country = params.get('country') || params.get('geo') || 'Unknown';

    console.log('Parsed params:', { identityId, campaignId, txid, result, points, offerName, country });

    // Validate required parameters
    if (!identityId) {
      console.error('Missing identity_id parameter');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Hash Verification: SHA256(identity_id + campaign_id + txid + SECRET_KEY)
    const hashPayload = `${identityId}${campaignId}${txid}${VORTEXWALL_SECRET_KEY}`;
    const expectedHash = await sha256Hash(hashPayload);

    console.log('Hash verification:', { 
      payload: hashPayload.substring(0, 50) + '...', 
      expected: expectedHash.substring(0, 16) + '...', 
      received: incomingHash.substring(0, 16) + '...'
    });

    // Verify hash if provided
    if (incomingHash && expectedHash.toLowerCase() !== incomingHash.toLowerCase()) {
      console.error('Hash verification mismatch');
      // Return 200 with "Approved" to avoid Vortexwall retries but log the issue
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse points (can be negative for rejections)
    let pointsValue = parseFloat(points) || 0;

    // Handle result status
    if (result.toLowerCase() === 'rejected' || result.toLowerCase() === 'chargeback') {
      // Points will already be negative from Vortexwall, but ensure it's negative
      if (pointsValue > 0) {
        pointsValue = -pointsValue;
      }
      console.log('Processing rejection/chargeback, points:', pointsValue);
    } else if (result.toLowerCase() !== 'completed') {
      console.log('Unknown result status:', result);
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
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
        console.log('Duplicate transaction, already processed:', txid);
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
      console.error('User not found:', identityId, profileError);
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
      userId: identityId,
      result,
      points: pointsValue,
      newBalance,
      offerName
    });

    // Return 200 OK with "Approved" - no error-like words
    return new Response('Approved', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Vortexwall postback processing issue:', error);
    // Always return 200 with Approved to prevent retries
    return new Response('Approved', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
