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

    // Extract user ID (flexible param names)
    const userId = params.get('userid') || params.get('user_id') || params.get('subid') || params.get('sub_id') || '';

    if (!userId) {
      console.error('[Validation] Missing user ID');
      return new Response('MISSING_USERID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Extract amount (flexible param names)
    const rawAmount = params.get('user_amount') || params.get('amount') || params.get('payout') || params.get('reward') || params.get('points') || '0';
    const amount = parseFloat(rawAmount);

    if (!amount || amount <= 0) {
      console.error('[Validation] Invalid amount:', rawAmount);
      return new Response('INVALID_AMOUNT', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Security: cap max payout
    if (amount > 1000000) {
      console.error('[Security] Amount too high:', amount);
      return new Response('PAYOUT_TOO_HIGH', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const coinAmount = Math.round(amount);

    // Create Supabase client with Service Role Key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate transaction
    const transactionId = params.get('transaction_id') || params.get('tid') || params.get('offer_id') || `tplayad_${Date.now()}`;
    const offerName = params.get('offer_name') || params.get('offer') || 'Tplayad Offer';

    if (transactionId && !transactionId.startsWith('tplayad_')) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction:', transactionId);
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
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('[Validation] User not found:', userId);
      return new Response('USER_NOT_FOUND', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Update balance using RPC
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: coinAmount,
    });

    if (balanceError) {
      console.error('Balance update failed:', balanceError);
      return new Response('BALANCE_ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Record completed offer
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    await supabase.from('completed_offers').insert({
      user_id: userId,
      username: profile.username || userId,
      offer_name: decodeURIComponent(offerName),
      offerwall: 'Tplayad',
      coin: coinAmount,
      transaction_id: transactionId,
      ip: clientIp || null,
      country: params.get('country') || params.get('geo') || 'Unknown',
    });

    console.log(`Success: ${profile.username} credited ${coinAmount} coins via Tplayad`);

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
