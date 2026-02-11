import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_PASSWORD = 'Kutta@#11';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    console.log('=== Upwall Postback Received ===');
    console.log('All params:', Object.fromEntries(params.entries()));

    // 1. Verify password
    const password = params.get('password') || '';
    if (password !== VALID_PASSWORD) {
      console.error('[Security] Password mismatch. Got:', password);
      return new Response('INVALID_PASSWORD', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // 2. Get userid and user_amount
    const userId = params.get('userid') || '';
    const userAmount = parseFloat(params.get('user_amount') || '0');

    if (!userId) {
      return new Response('MISSING_USERID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    if (userAmount <= 0) {
      return new Response('INVALID_AMOUNT', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const coinAmount = Math.round(userAmount);

    // 3. Create Supabase client with Service Role Key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate transaction
    const transactionId = params.get('offer_id') || `upwall_${Date.now()}`;
    const offerName = params.get('offer_name') || 'Upwall Offer';

    if (transactionId && !transactionId.startsWith('upwall_')) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existing) {
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
      console.error('User not found:', userId);
      return new Response('USER_NOT_FOUND', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // 4. Update balance (add user_amount to existing balance)
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: coinAmount
    });

    if (balanceError) {
      console.error('Balance update failed:', balanceError);
      return new Response('BALANCE_ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Record the completed offer
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    await supabase.from('completed_offers').insert({
      user_id: userId,
      username: profile.username || userId,
      offer_name: decodeURIComponent(offerName),
      offerwall: 'Upwall',
      coin: coinAmount,
      transaction_id: transactionId,
      ip: clientIp || null,
      country: params.get('country') || 'Unknown',
    });

    console.log(`Success: ${profile.username} credited ${coinAmount} coins`);

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
