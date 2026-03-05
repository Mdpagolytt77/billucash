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

    // PubScale params: sub_id (user_id), revenue (payout), offer_name, click_id (txn), user_ip, country
    const userId = params.get('sub_id') || params.get('user_id') || '';
    const txnId = params.get('click_id') || params.get('transaction_id') || '';
    let offerName = params.get('offer_name') || 'PubScale Offer';
    const payoutStr = params.get('revenue') || params.get('payout') || '0';
    const userIp = params.get('user_ip') || params.get('ip') || '';
    const countryParam = params.get('country') || '';

    // Validate required
    if (!userId) {
      console.error('Missing sub_id/user_id');
      return new Response('0', { status: 200, headers: textHeaders });
    }
    if (!txnId) {
      console.error('Missing click_id/transaction_id');
      return new Response('0', { status: 200, headers: textHeaders });
    }

    // Parse payout - PubScale sends revenue in USD, convert to coins (cents)
    const payoutUsd = parseFloat(payoutStr) || 0;
    let coinAmount = Math.round(payoutUsd * 100);

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
