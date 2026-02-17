import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    console.log('=== Gemiad Postback Received ===');
    console.log('All params:', Object.fromEntries(params.entries()));

    const userId = params.get('user_id') || params.get('userid') || params.get('subid') || params.get('sub_id') || params.get('subId') || '';
    if (!userId) {
      console.error('Missing user ID');
      return new Response('MISSING_SUBID', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // Coin amount
    const rewardRaw = params.get('amount') || params.get('reward') || params.get('points') || params.get('currencyAmount') || params.get('virtual_currency') || '';
    const payoutRaw = params.get('payout') || params.get('currency') || '';
    const coinStr = rewardRaw || payoutRaw;
    const coinAmount = Math.round(parseFloat(coinStr));

    if (!coinAmount || coinAmount === 0) {
      console.error('Invalid coin amount:', coinStr);
      return new Response('REWARD_MISSING', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    if (Math.abs(coinAmount) > 10000000) {
      console.error('Amount too high:', coinAmount);
      return new Response('PAYOUT_TOO_HIGH', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // Status & chargeback
    const status = params.get('status') || params.get('type') || '';
    const isChargeback = status === '2' || status.toLowerCase() === 'chargeback';

    // Transaction ID
    const transactionId = params.get('transaction_id') || params.get('transactionID') || params.get('transId') || params.get('trx') || params.get('txid') || `gemiad_${Date.now()}`;

    // Offer name
    let offerName = params.get('offer_name') || params.get('offerName') || params.get('offer') || params.get('campaign') || 'Gemiad Offer';
    if (offerName.length > 200) offerName = offerName.substring(0, 200);

    // Security verification
    const secretKey = Deno.env.get('GEMIAD_SECRET_KEY') || '';
    const signature = params.get('signature') || params.get('sig') || params.get('hash') || '';
    const apiKey = params.get('api_key') || params.get('apikey') || req.headers.get('x-api-key') || '';

    let verified = false;

    // Method 1: API key match
    if (secretKey && apiKey && apiKey === secretKey) {
      verified = true;
      console.log('Verified via API key');
    }

    // Method 2: Signature verification
    if (!verified && secretKey && signature) {
      const payloads = [
        `${userId}${coinStr}${transactionId}`,
        `${secretKey}${userId}${transactionId}${coinStr}`,
        `${secretKey}${userId}${coinStr}`,
        `${userId}${transactionId}${coinStr}`,
      ];
      for (const payload of payloads) {
        const hmac = await hmacSha256(secretKey, payload);
        const sha = await sha256Hash(payload);
        if (hmac.toLowerCase() === signature.toLowerCase() || sha.toLowerCase() === signature.toLowerCase()) {
          verified = true;
          console.log('Verified via signature');
          break;
        }
      }
    }

    if (!verified) {
      console.error('Signature/API key verification failed');
      return new Response('UNAUTHORIZED', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // Supabase REST API
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    };

    // Check duplicate
    if (transactionId && !transactionId.startsWith('gemiad_')) {
      const dupRes = await fetch(
        `${supabaseUrl}/rest/v1/completed_offers?transaction_id=eq.${encodeURIComponent(transactionId)}&select=id&limit=1`,
        { headers }
      );
      const dupData = await dupRes.json();
      if (dupData && dupData.length > 0) {
        console.log('Duplicate transaction:', transactionId);
        return new Response('DUP', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
      }
    }

    // Get user profile
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=username,balance&limit=1`,
      { headers }
    );
    const profiles = await profileRes.json();
    if (!profiles || profiles.length === 0) {
      console.error('User not found:', userId);
      return new Response('USER_NOT_FOUND', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }
    const profile = profiles[0];

    // Update balance
    const finalAmount = isChargeback ? -Math.abs(coinAmount) : Math.abs(coinAmount);
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_balance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id_input: userId, amount_input: finalAmount }),
    });

    if (!rpcRes.ok) {
      const err = await rpcRes.text();
      console.error('Balance update failed:', err);
      return new Response('BALANCE_ERROR', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // Record completed offer
    const clientIp = params.get('ip') || params.get('userip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const country = params.get('country') || params.get('geo') || 'Unknown';

    await fetch(`${supabaseUrl}/rest/v1/completed_offers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        username: profile.username || userId,
        offer_name: isChargeback ? `[Chargeback] ${offerName}` : offerName,
        offerwall: 'Gemiad',
        coin: finalAmount,
        transaction_id: transactionId,
        ip: clientIp || null,
        country: country,
      }),
    });

    console.log(`Success: ${profile.username} ${isChargeback ? 'charged back' : 'credited'} ${finalAmount} coins via Gemiad`);

    return new Response('OK', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response('ERROR', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
  }
});
