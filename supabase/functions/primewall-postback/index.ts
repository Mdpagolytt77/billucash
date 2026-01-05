import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PrimeWall Configuration
const PRIMEWALL_SECRET_KEY = 'En4DH7Ap5Ua2Ie8';
const PRIMEWALL_PUBLIC_KEY = 'Pz6Cs5';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    // Get client IP for logging
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || '';

    console.log('=== PrimeWall Postback Received ===');
    console.log('Client IP:', clientIp);
    console.log('All params:', Object.fromEntries(params.entries()));

    // Helpers
    const unwrapToken = (value: string | null) => {
      if (!value) return null;
      let v = value.trim();
      // unwrap common wrappers: [value], {value}, (value)
      const wrappers: Array<[string, string]> = [
        ['[', ']'],
        ['{', '}'],
        ['(', ')'],
      ];
      for (const [l, r] of wrappers) {
        if (v.startsWith(l) && v.endsWith(r) && v.length > 2) v = v.slice(1, -1).trim();
      }
      return v;
    };

    const looksLikePlaceholder = (value: string | null) => {
      if (!value) return false;
      const v = value.toLowerCase();
      return (
        v.includes('user_id') ||
        v.includes('userid') ||
        v.includes('subid') ||
        v.includes('payout') ||
        v.includes('reward') ||
        v.includes('amount') ||
        v.includes('{') ||
        v.includes('}')
      );
    };

    // Extract PrimeWall parameters - try multiple common parameter names
    const userId = unwrapToken(
      params.get('user_id') ||
        params.get('USER_ID') ||
        params.get('userid') ||
        params.get('uid') ||
        params.get('subid') ||
        params.get('sub_id') ||
        params.get('subId')
    );

    // Try multiple payout parameter names that offerwalls commonly use
    const payoutRaw = unwrapToken(
      params.get('payout') ||
        params.get('PAYOUT') ||
        params.get('amount') ||
        params.get('reward') ||
        params.get('points') ||
        params.get('earnings') ||
        params.get('currency') ||
        params.get('virtual_currency') ||
        params.get('vc_amount')
    );

    const transactionId = unwrapToken(
      params.get('transaction_id') ||
        params.get('TRANSACTION_ID') ||
        params.get('transId') ||
        params.get('txid') ||
        params.get('tx_id') ||
        params.get('offer_id') ||
        params.get('id')
    );
    const offerName = unwrapToken(
      params.get('offer_name') ||
        params.get('OFFER_NAME') ||
        params.get('offer') ||
        params.get('campaign') ||
        params.get('campaign_name') ||
        params.get('offerName')
    ) || 'PrimeWall Offer';
    const country = unwrapToken(params.get('country') || params.get('COUNTRY') || params.get('geo')) || 'Unknown';
    const signature = unwrapToken(params.get('signature') || params.get('sig') || params.get('hash'));
    const status = unwrapToken(params.get('status') || params.get('result')) || 'completed';

    console.log('=== Parameter Extraction ===');
    console.log('userId:', userId);
    console.log('payoutRaw:', payoutRaw);
    console.log('transactionId:', transactionId);
    console.log('offerName:', offerName);
    console.log('country:', country);
    console.log('status:', status);

    // Validate required parameters
    if (!userId || !payoutRaw) {
      console.error('Missing required params: user_id or payout');
      console.error('userId:', userId, 'payoutRaw:', payoutRaw);
      // Returning non-200 here encourages the offerwall to retry and prevents "false success"
      return new Response('Missing required parameters (user_id, payout)', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Guard against misconfigured macros like [PAYOUT] / {PAYOUT}
    if (looksLikePlaceholder(userId) || looksLikePlaceholder(payoutRaw)) {
      console.error('Detected placeholder token(s) - check PrimeWall macro formatting:', { userId, payoutRaw });
      return new Response('Placeholder token detected - fix PrimeWall callback macros', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse payout amount
    const payoutAmount = parseFloat(payoutRaw);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      console.error('Invalid payout amount:', payoutRaw, 'parsed:', payoutAmount);
      return new Response('Invalid payout amount', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    console.log('Processing payout:', { userId, payoutAmount });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate transaction
    if (transactionId) {
      const { data: existingOffer } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existingOffer) {
        console.log('Duplicate transaction detected:', transactionId);
        return new Response('Approved', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
    }

    // Get username for the user
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();

    const username = profile?.username || 'Unknown';

    // Update user balance using increment_balance function
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: payoutAmount,
    });

    if (balanceError) {
      console.error('Balance update failed:', balanceError);
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    console.log('Balance updated successfully for user:', userId);

    // Record the completed offer
    const { error: offerError } = await supabase
      .from('completed_offers')
      .insert({
        user_id: userId,
        username: username,
        offerwall: 'PrimeWall',
        offer_name: offerName,
        coin: Math.round(payoutAmount),
        transaction_id: transactionId || `primewall_${Date.now()}`,
        ip: clientIp,
        country: country,
      });

    if (offerError) {
      console.error('Failed to record offer:', offerError);
    } else {
      console.log('Offer recorded successfully');
    }

    // Return 200 OK with "Approved"
    return new Response('Approved', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Unexpected issue:', error);
    return new Response('Approved', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
