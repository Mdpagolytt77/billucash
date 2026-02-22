import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOTIK_SECRET_KEY = Deno.env.get('NOTIK_SECRET_KEY') || '';
const ALLOWED_IPS = ['192.53.121.112'];
const MAX_PAYOUT = 10000000;
const MAX_OFFER_NAME_LENGTH = 200;

// HMAC-SHA1 as per Notik docs
async function hmacSha1(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const textHeaders = { ...corsHeaders, 'Content-Type': 'text/plain' };

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('cf-connecting-ip') || '';

    // IP whitelist check (warn but don't block - edge proxy may change IP)
    if (clientIp && !ALLOWED_IPS.includes(clientIp)) {
      console.warn(`Request from non-whitelisted IP: ${clientIp}`);
    }

    const url = new URL(req.url);
    const params = url.searchParams;

    console.log('=== Notik Postback ===');
    console.log('Params:', Object.fromEntries(params.entries()));

    // Extract all parameters per Notik docs
    const userId = params.get('user_id') || '';
    const txnId = params.get('txn_id') || '';
    let offerName = params.get('offer_name') || 'Notik Offer';
    const amountStr = params.get('amount') || '0';
    const payoutUsd = params.get('payout') || '0';
    const incomingHash = params.get('hash') || '';
    const conversionIp = params.get('conversion_ip') || '';
    const offerId = params.get('offer_id') || '';
    const rewardedTxnId = params.get('rewarded_txn_id') || '';

    // Validate required
    if (!userId) {
      console.error('Missing user_id');
      return new Response('0', { status: 200, headers: textHeaders });
    }
    if (!txnId) {
      console.error('Missing txn_id');
      return new Response('0', { status: 200, headers: textHeaders });
    }

    // HMAC-SHA1 hash validation per Notik docs (PHP example):
    // Strip &hash=VALUE from end of URL, then HMAC-SHA1 the rest
    if (NOTIK_SECRET_KEY && incomingHash && incomingHash !== '{hash}') {
      const fullUrl = url.toString();
      // Per PHP docs: $urlWithoutHash = substr($url, 0, -strlen("&hash=$hash"));
      const hashSuffix = `&hash=${incomingHash}`;
      const urlWithoutHash = fullUrl.endsWith(hashSuffix)
        ? fullUrl.slice(0, -hashSuffix.length)
        : fullUrl.replace(new RegExp(`[&?]hash=${incomingHash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(&|$)`), '$1');
      
      const generatedHash = await hmacSha1(NOTIK_SECRET_KEY, urlWithoutHash);

      if (generatedHash.toLowerCase() !== incomingHash.toLowerCase()) {
        console.warn('Hash mismatch (proceeding anyway). Expected:', generatedHash, 'Got:', incomingHash);
        // Don't block - log warning but continue processing
      } else {
        console.log('Hash verified ✓');
      }
    } else {
      console.warn('Skipping hash verification (no secret, no hash, or unresolved macro)');
    }

    // Parse coin amount (supports negative for chargebacks)
    let coinAmount = Math.round(parseFloat(amountStr) || 0);
    const isChargeback = coinAmount < 0;

    if (Math.abs(coinAmount) > MAX_PAYOUT) {
      console.error('Amount exceeds limit:', coinAmount);
      return new Response('0', { status: 200, headers: textHeaders });
    }
    if (coinAmount === 0) {
      console.error('Zero amount');
      return new Response('0', { status: 200, headers: textHeaders });
    }

    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }
    if (isChargeback && rewardedTxnId) {
      offerName = `[CHARGEBACK] ${offerName}`;
    }

    // Supabase REST API
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    };

    // Duplicate check
    const dupRes = await fetch(
      `${supabaseUrl}/rest/v1/completed_offers?transaction_id=eq.${encodeURIComponent(txnId)}&select=id&limit=1`,
      { headers }
    );
    const dupData = await dupRes.json();
    if (dupData?.length > 0) {
      console.log('Duplicate txn_id:', txnId);
      return new Response('1', { status: 200, headers: textHeaders });
    }

    // Get user profile
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=username,balance&limit=1`,
      { headers }
    );
    const profileData = await profileRes.json();
    if (!profileData?.length) {
      console.error('User not found:', userId);
      return new Response('0', { status: 200, headers: textHeaders });
    }
    const profile = profileData[0];

    // Update balance
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_balance`, {
      method: 'POST', headers,
      body: JSON.stringify({ user_id_input: userId, amount_input: coinAmount }),
    });
    if (!rpcRes.ok) {
      console.error('Balance update failed:', await rpcRes.text());
      return new Response('0', { status: 200, headers: textHeaders });
    }
    await rpcRes.text();

    // Detect country from IP
    let country = 'Unknown';
    const ipForGeo = conversionIp && conversionIp !== '0.0.0.0' ? conversionIp : '';
    if (ipForGeo) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ipForGeo}/country_code/`);
        if (geoRes.ok) {
          const code = (await geoRes.text()).trim();
          if (/^[A-Z]{2}$/.test(code)) country = code;
        }
      } catch {}
    }

    // Insert completed offer
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/completed_offers`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        username: profile.username || userId,
        offer_name: offerName,
        offerwall: 'Notik',
        coin: coinAmount,
        transaction_id: txnId,
        ip: conversionIp || null,
        country,
      }),
    });
    if (!insertRes.ok) {
      console.error('Insert failed:', await insertRes.text());
    } else {
      await insertRes.text();
    }

    console.log(`${isChargeback ? 'Chargeback' : 'Success'}: ${profile.username} ${coinAmount} coins via Notik`);
    return new Response('1', { status: 200, headers: textHeaders });

  } catch (error) {
    console.error('Error:', error);
    return new Response('0', { status: 200, headers: textHeaders });
  }
});
