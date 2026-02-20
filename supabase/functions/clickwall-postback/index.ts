const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const respond = (text: string, status = 200) =>
  new Response(text, { status, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });

// Direct Supabase REST API helper
async function supabaseRequest(path: string, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'POST' ? 'return=minimal' : 'return=representation',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (options.method === 'POST' || options.method === 'PATCH') {
    return { ok: res.ok, status: res.status };
  }

  const data = await res.json();
  return { ok: res.ok, data, status: res.status };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    console.log('[clickwall-postback] Incoming:', req.method, req.url);
    console.log('[clickwall-postback] Params:', Object.fromEntries(params.entries()));

    // ClickWall parameters
    const userId = params.get('user_id') ?? '';
    const offerName = params.get('offer_name') ?? 'ClickWall Offer';
    const amountRaw = params.get('amount') ?? '0';   // Virtual currency (coins directly)
    const payoutRaw = params.get('payout') ?? '0';   // USD payout
    const userIp = params.get('user_ip') ?? req.headers.get('x-forwarded-for') ?? null;
    const txid = params.get('txid') ?? params.get('transaction_id') ?? null;
    const offerId = params.get('offer_id') ?? null;

    if (!userId) return respond('MISSING_SUBID');

    // Use amount (virtual currency) if provided, otherwise convert payout (USD) * 1000
    let coins = 0;
    const amount = parseFloat(amountRaw);
    const payout = parseFloat(payoutRaw);

    if (amount > 0) {
      coins = Math.round(amount);
    } else if (payout > 0) {
      coins = Math.round(payout * 1000);
    }

    if (coins <= 0) return respond('REWARD_MISSING');

    const transactionId = txid || offerId || null;

    // Duplicate check
    if (transactionId) {
      const dupRes = await supabaseRequest(
        `completed_offers?transaction_id=eq.${encodeURIComponent(transactionId)}&select=id&limit=1`
      );
      if (dupRes.ok && dupRes.data?.length > 0) {
        return respond('DUP');
      }
    }

    // Get user profile
    const profileRes = await supabaseRequest(`profiles?id=eq.${userId}&select=username,balance`);
    const profile = profileRes.ok && profileRes.data?.[0] ? profileRes.data[0] : null;

    if (!profile) return respond('MISSING_SUBID');

    // Insert completed offer
    const insertRes = await supabaseRequest('completed_offers', {
      method: 'POST',
      body: {
        user_id: userId,
        username: profile.username || userId,
        offer_name: offerName.substring(0, 200),
        offerwall: 'ClickWall',
        coin: coins,
        transaction_id: transactionId,
        ip: userIp,
        country: 'Unknown',
      },
    });

    if (!insertRes.ok) {
      console.error('[clickwall-postback] Insert failed:', insertRes.status);
      return respond('ERROR', 500);
    }

    // Update balance
    const newBalance = (profile.balance || 0) + coins;
    await supabaseRequest(`profiles?id=eq.${userId}`, {
      method: 'PATCH',
      body: { balance: newBalance },
    });

    console.log(`[clickwall-postback] OK: ${profile.username} +${coins} coins`);
    return respond('1');

  } catch (error) {
    console.error('[clickwall-postback] Error:', error);
    return respond('ERROR', 500);
  }
});
