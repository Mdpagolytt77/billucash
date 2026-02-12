import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA256 hash helper
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

    // Extract user ID
    const userId = params.get('userid') || params.get('user_id') || params.get('subid') || params.get('sub_id') || '';

    if (!userId) {
      console.error('[Validation] Missing user ID');
      return new Response('MISSING_SUBID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Extract revenue/amount
    const rawAmount = params.get('revenue') || params.get('amount') || params.get('payout') || params.get('reward') || params.get('points') || params.get('user_amount') || '0';
    const amount = parseFloat(rawAmount);

    if (!amount || amount <= 0) {
      console.error('[Validation] Invalid amount:', rawAmount);
      return new Response('REWARD_MISSING', {
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

    // Signature verification: hash("sha256", userID . revenue . SecretKey)
    const hash = params.get('hash') || params.get('sig') || params.get('signature') || '';
    const secretKey = Deno.env.get('TIMEWALL_SECRET_KEY') || '';

    if (!secretKey) {
      console.error('[Security] TIMEWALL_SECRET_KEY not configured');
      return new Response('CONFIG_ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Verify: SHA256(userID + revenue + SecretKey)
    const expectedHash = await sha256Hash(userId + rawAmount + secretKey);

    if (!hash || hash.toLowerCase() !== expectedHash.toLowerCase()) {
      console.error('[Security] Signature mismatch');
      console.log('[Security] Expected:', expectedHash);
      console.log('[Security] Received:', hash);
      return new Response('SIGNATURE_MISMATCH', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    console.log('[Security] Signature verified ✓');

    // Points: use amount directly as coins (points-first logic)
    const coinAmount = Math.round(amount);

    // Create Supabase client with Service Role Key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate transaction
    const transactionId = params.get('transaction_id') || params.get('tid') || params.get('offer_id') || params.get('id') || `timewall_${Date.now()}`;
    const offerName = params.get('offer_name') || params.get('offer') || params.get('campaign_name') || 'Timewall Offer';

    if (transactionId && !transactionId.startsWith('timewall_')) {
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
      offerwall: 'Timewall',
      coin: coinAmount,
      transaction_id: transactionId,
      ip: clientIp || null,
      country: params.get('country') || params.get('geo') || params.get('country_code') || 'Unknown',
    });

    console.log(`Success: ${profile.username} credited ${coinAmount} coins via Timewall`);

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
