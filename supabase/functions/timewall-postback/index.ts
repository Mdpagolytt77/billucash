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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    console.log('=== Timewall Postback Received ===');
    console.log('All params:', Object.fromEntries(params.entries()));

    // {userID} macro
    const userId = params.get('userid') || params.get('userID') || params.get('user_id') || '';
    if (!userId) {
      console.error('Missing user ID');
      return new Response('MISSING_USERID', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // {revenue} macro - USD revenue (used for hash verification)
    const revenue = params.get('revenue') || '0';

    // {currencyAmount} macro - actual coins to credit the user
    const currencyAmount = params.get('currencyAmount') || params.get('offer_name') || params.get('points') || params.get('amount') || revenue;
    const coinAmount = Math.round(parseFloat(currencyAmount));

    if (!coinAmount || coinAmount === 0) {
      console.error('Invalid coin amount:', currencyAmount);
      return new Response('REWARD_MISSING', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // {type} macro - "credit" or "chargeback"
    const type = (params.get('type') || 'credit').toLowerCase();
    const isChargeback = type === 'chargeback';

    // Security cap
    if (Math.abs(coinAmount) > 10000000) {
      console.error('Amount too high:', coinAmount);
      return new Response('PAYOUT_TOO_HIGH', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // {hash} macro - SHA256(userID + revenue + SecretKey)
    const hash = params.get('hash') || '';
    const secretKey = Deno.env.get('TIMEWALL_SECRET_KEY') || '';

    if (secretKey && hash) {
      const expectedHash = await sha256Hash(userId + revenue + secretKey);
      if (hash.toLowerCase() !== expectedHash.toLowerCase()) {
        console.error('Signature mismatch');
        console.log('Expected:', expectedHash);
        console.log('Received:', hash);
        return new Response('SIGNATURE_MISMATCH', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
      }
      console.log('Signature verified ✓');
    } else {
      console.warn('Hash verification skipped (missing hash or secret key)');
    }

    // {transactionID} macro
    const transactionId = params.get('transaction_id') || params.get('transactionID') || `timewall_${Date.now()}`;

    // Supabase REST API setup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    };

    // Check duplicate
    if (transactionId && !transactionId.startsWith('timewall_')) {
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

    // Credit or deduct balance (chargeback = negative)
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
    const clientIp = params.get('ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const country = params.get('country') || 'Unknown';

    await fetch(`${supabaseUrl}/rest/v1/completed_offers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        username: profile.username || userId,
        offer_name: isChargeback ? `[Chargeback] Timewall` : 'Timewall Offer',
        offerwall: 'Timewall',
        coin: finalAmount,
        transaction_id: transactionId,
        ip: clientIp || null,
        country: country,
      }),
    });

    console.log(`Success: ${profile.username} ${isChargeback ? 'charged back' : 'credited'} ${finalAmount} coins via Timewall`);

    return new Response('OK', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response('ERROR', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
  }
});
