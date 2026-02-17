import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // TPlayAd official parameters
    const subid = params.get('subid') || '';
    const transid = params.get('transid') || '';
    const reward = params.get('reward') || '0';
    const payout = params.get('payout') || '0';
    const signature = params.get('signature') || '';
    const status = params.get('status') || '1';
    const userip = params.get('userip') || '';
    const campaignId = params.get('campaign_id') || '';
    const country = params.get('country') || 'Unknown';
    const uuid = params.get('uuid') || '';

    // SECURITY: Verify signature
    const TPLAYAD_SECRET_KEY = Deno.env.get('TPLAYAD_SECRET_KEY');
    if (TPLAYAD_SECRET_KEY && signature) {
      // TPlayAd sends MD5 signature for verification
      if (signature !== TPLAYAD_SECRET_KEY) {
        console.error('[Security] Invalid signature');
        return new Response('SIGNATURE_MISMATCH', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
      console.log('[Security] Signature verified');
    } else if (!TPLAYAD_SECRET_KEY) {
      console.warn('[Security] No TPLAYAD_SECRET_KEY configured');
    }

    // Validate subid (user ID)
    if (!subid) {
      console.error('[Validation] Missing subid');
      return new Response('MISSING_SUBID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse reward amount (virtual currency to credit)
    const rewardAmount = parseFloat(reward);
    if (!rewardAmount || rewardAmount <= 0) {
      console.error('[Validation] Invalid reward:', reward);
      return new Response('INVALID_REWARD', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Security: cap max payout
    if (rewardAmount > 1000000) {
      console.error('[Security] Reward too high:', rewardAmount);
      return new Response('PAYOUT_TOO_HIGH', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const coinAmount = Math.round(rewardAmount);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate transaction using transid
    if (transid) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', transid)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction:', transid);
        return new Response('DUP', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, balance')
      .eq('id', subid)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('[Validation] User not found:', subid);
      return new Response('USER_NOT_FOUND', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Handle status: "1" = add reward, "2" = subtract (chargeback/reversal)
    const isChargeback = status === '2';
    const adjustAmount = isChargeback ? -coinAmount : coinAmount;

    console.log(`Status: ${status}, isChargeback: ${isChargeback}, adjustAmount: ${adjustAmount}`);

    // Update balance
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: subid,
      amount_input: adjustAmount,
    });

    if (balanceError) {
      console.error('Balance update failed:', balanceError);
      return new Response('BALANCE_ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Record completed offer
    await supabase.from('completed_offers').insert({
      user_id: subid,
      username: profile.username || subid,
      offer_name: isChargeback ? `[Chargeback] Campaign ${campaignId}` : `Campaign ${campaignId}`,
      offerwall: 'Tplayad',
      coin: adjustAmount,
      transaction_id: transid || `tplayad_${Date.now()}`,
      ip: userip || null,
      country: country,
    });

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
