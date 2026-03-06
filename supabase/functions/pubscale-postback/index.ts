import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PAYOUT = 10000000;
const MAX_OFFER_NAME_LENGTH = 200;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const textHeaders = { ...corsHeaders, 'Content-Type': 'text/plain' };

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    console.log('=== PubScale Postback ===');
    console.log('Params:', Object.fromEntries(params.entries()));

    // Detect if this is a chargeback (has 'value' + 'token' params from chargeback URL)
    // Chargeback params: value, user_id, token, signature
    // Regular postback params: sub_id/user_id, revenue, offer_name, click_id, country, ip
    const isChargeback = params.has('token') && params.has('value') && !params.has('click_id') && !params.has('sub_id');

    const userId = params.get('user_id') || params.get('sub_id') || '';
    const txnId = params.get('token') || params.get('click_id') || params.get('transaction_id') || '';
    let offerName = params.get('offer_name') || (isChargeback ? 'PubScale Chargeback' : 'PubScale Offer');
    const payoutStr = params.get('value') || params.get('revenue') || params.get('payout') || '0';
    const userIp = params.get('user_ip') || params.get('ip') || '';
    const countryParam = params.get('country') || '';
    const signatureParam = params.get('signature') || '';

    console.log('Is Chargeback:', isChargeback);

    // Validate required
    if (!userId) {
      console.error('Missing user_id');
      return new Response('0', { status: 200, headers: textHeaders });
    }
    if (!txnId) {
      console.error('Missing token/click_id');
      return new Response('0', { status: 200, headers: textHeaders });
    }

    // Signature verification
    const secretKey = Deno.env.get('PUBSCALE_SECRET_KEY');
    if (secretKey && signatureParam) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secretKey),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const data = encoder.encode(txnId);
      const sig = await crypto.subtle.sign('HMAC', key, data);
      const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (signatureParam !== expectedSig) {
        console.error('Signature mismatch:', signatureParam, 'expected:', expectedSig);
        console.warn('Proceeding despite signature mismatch for now');
      } else {
        console.log('Signature verified successfully');
      }
    }

    // Parse payout
    const payoutUsd = parseFloat(payoutStr) || 0;
    let coinAmount = Math.round(payoutUsd * 500); // 500 coins = 1 USD

    if (coinAmount <= 0) {
      console.error('Zero or negative payout:', payoutStr);
      return new Response('0', { status: 200, headers: textHeaders });
    }
    if (coinAmount > MAX_PAYOUT) {
      console.error('Payout exceeds limit:', coinAmount);
      return new Response('0', { status: 200, headers: textHeaders });
    }

    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    // Supabase REST API
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    };

    // ===== CHARGEBACK FLOW =====
    if (isChargeback) {
      console.log('Processing chargeback for token:', txnId);

      // Find the original offer by transaction_id
      const origRes = await fetch(
        `${supabaseUrl}/rest/v1/completed_offers?transaction_id=eq.${encodeURIComponent(txnId)}&offerwall=eq.PubScale&select=id,user_id,coin,username&limit=1`,
        { headers }
      );
      const origData = await origRes.json();

      if (!origData?.length) {
        console.error('Original offer not found for chargeback token:', txnId);
        return new Response('0', { status: 200, headers: textHeaders });
      }

      const originalOffer = origData[0];
      const chargebackCoins = originalOffer.coin; // Deduct the same amount that was credited

      // Check if chargeback already processed (look for existing chargeback record)
      const chargebackTxnId = `chargeback_${txnId}`;
      const dupRes = await fetch(
        `${supabaseUrl}/rest/v1/completed_offers?transaction_id=eq.${encodeURIComponent(chargebackTxnId)}&select=id&limit=1`,
        { headers }
      );
      const dupData = await dupRes.json();
      if (dupData?.length > 0) {
        console.log('Duplicate chargeback already processed:', txnId);
        return new Response('1', { status: 200, headers: textHeaders });
      }

      // Deduct balance (use negative amount)
      const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_balance`, {
        method: 'POST', headers,
        body: JSON.stringify({ user_id_input: originalOffer.user_id, amount_input: -chargebackCoins }),
      });
      if (!rpcRes.ok) {
        const errText = await rpcRes.text();
        console.error('Chargeback balance deduction failed:', errText);
        // If insufficient balance, still record the chargeback
        if (!errText.includes('Insufficient balance')) {
          return new Response('0', { status: 200, headers: textHeaders });
        }
        // If insufficient, set balance to 0
        await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(originalOffer.user_id)}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ balance: 0, updated_at: new Date().toISOString() }),
        });
        console.warn('Set balance to 0 due to insufficient funds for full chargeback');
      } else {
        await rpcRes.text();
      }

      // Insert chargeback record with negative coin value
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/completed_offers`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          user_id: originalOffer.user_id,
          username: originalOffer.username,
          offer_name: `[CHARGEBACK] ${offerName}`,
          offerwall: 'PubScale',
          coin: -chargebackCoins,
          transaction_id: chargebackTxnId,
          ip: userIp || null,
          country: 'Unknown',
        }),
      });
      if (!insertRes.ok) {
        console.error('Chargeback record insert failed:', await insertRes.text());
      } else {
        await insertRes.text();
      }

      console.log(`Chargeback success: ${originalOffer.username} lost ${chargebackCoins} coins via PubScale chargeback`);
      return new Response('1', { status: 200, headers: textHeaders });
    }

    // ===== REGULAR POSTBACK FLOW =====

    // Duplicate check
    const dupRes = await fetch(
      `${supabaseUrl}/rest/v1/completed_offers?transaction_id=eq.${encodeURIComponent(txnId)}&select=id&limit=1`,
      { headers }
    );
    const dupData = await dupRes.json();
    if (dupData?.length > 0) {
      console.log('Duplicate click_id:', txnId);
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

    // Country detection
    let country = countryParam || 'Unknown';
    if (country === 'Unknown' && userIp && userIp !== '0.0.0.0') {
      try {
        const geoRes = await fetch(`https://ipapi.co/${userIp}/country_code/`);
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
        offerwall: 'PubScale',
        coin: coinAmount,
        transaction_id: txnId,
        ip: userIp || null,
        country,
      }),
    });
    if (!insertRes.ok) {
      console.error('Insert failed:', await insertRes.text());
    } else {
      await insertRes.text();
    }

    console.log(`Success: ${profile.username} earned ${coinAmount} coins via PubScale`);
    return new Response('1', { status: 200, headers: textHeaders });

  } catch (error) {
    console.error('Error:', error);
    return new Response('0', { status: 200, headers: textHeaders });
  }
});
