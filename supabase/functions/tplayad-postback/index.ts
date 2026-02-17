import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    console.log('=== Tplayad Postback Received ===');
    console.log('All params:', Object.fromEntries(params.entries()));

    // TPlayAd sends camelCase params: subId, transId, userIp
    const userId = params.get('subId') || params.get('subid') || '';
    const transId = params.get('transId') || params.get('transid') || '';
    const reward = params.get('reward') || '0';
    const payout = params.get('payout') || '0';
    const signature = params.get('signature') || '';
    const status = params.get('status') || '1';
    const userIp = params.get('userIp') || params.get('userip') || '';
    const campaignId = params.get('campaign_id') || '';
    const country = params.get('country') || 'Unknown';
    const offerName = params.get('offer_name') || `Campaign ${campaignId}`;

    // Validate user ID
    if (!userId) {
      console.error('[Validation] Missing subId');
      return new Response('MISSING_SUBID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse reward amount
    const rewardAmount = parseFloat(reward);
    if (!rewardAmount || rewardAmount <= 0) {
      console.error('[Validation] Invalid reward:', reward);
      return new Response('INVALID_REWARD', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    if (rewardAmount > 10000000) {
      console.error('[Security] Reward too high:', rewardAmount);
      return new Response('PAYOUT_TOO_HIGH', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const coinAmount = Math.round(rewardAmount);

    // Supabase REST API setup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    };

    // Check duplicate transaction
    if (transId) {
      const dupRes = await fetch(
        `${supabaseUrl}/rest/v1/completed_offers?transaction_id=eq.${encodeURIComponent(transId)}&select=id&limit=1`,
        { headers }
      );
      const dupData = await dupRes.json();
      if (dupData && dupData.length > 0) {
        console.log('Duplicate transaction:', transId);
        return new Response('DUP', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
    }

    // Get user profile
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=username,balance&limit=1`,
      { headers }
    );
    const profileData = await profileRes.json();

    if (!profileData || profileData.length === 0) {
      console.error('[Validation] User not found:', userId);
      return new Response('USER_NOT_FOUND', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const profile = profileData[0];

    // Handle status: "1" = add, "2" = subtract (chargeback)
    const isChargeback = status === '2';
    const adjustAmount = isChargeback ? -coinAmount : coinAmount;

    console.log(`Status: ${status}, isChargeback: ${isChargeback}, adjustAmount: ${adjustAmount}`);

    // Update balance via RPC
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_balance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id_input: userId,
        amount_input: adjustAmount,
      }),
    });

    if (!rpcRes.ok) {
      const errText = await rpcRes.text();
      console.error('Balance update failed:', errText);
      return new Response('BALANCE_ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
    await rpcRes.text();

    // Record completed offer
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/completed_offers`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        username: profile.username || userId,
        offer_name: isChargeback ? `[Chargeback] ${offerName}` : offerName,
        offerwall: 'Tplayad',
        coin: adjustAmount,
        transaction_id: transId || `tplayad_${Date.now()}`,
        ip: userIp || null,
        country: country || 'Unknown',
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error('Insert failed:', errText);
    } else {
      await insertRes.text();
    }

    console.log(`Success: ${profile.username} ${isChargeback ? 'debited' : 'credited'} ${Math.abs(adjustAmount)} coins via Tplayad`);

    return new Response('OK', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response('ERROR', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
