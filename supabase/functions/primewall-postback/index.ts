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

    // Extract PrimeWall parameters - try multiple common parameter names
    const userId = params.get('user_id') || params.get('userid') || params.get('uid') || params.get('subid') || params.get('sub_id');
    
    // Try multiple payout parameter names that offerwalls commonly use
    const payoutRaw = params.get('payout') || params.get('amount') || params.get('reward') || 
                      params.get('points') || params.get('earnings') || params.get('currency') ||
                      params.get('virtual_currency') || params.get('vc_amount');
    
    const transactionId = params.get('transaction_id') || params.get('txid') || params.get('tx_id') || 
                          params.get('offer_id') || params.get('id');
    const offerName = params.get('offer_name') || params.get('offer') || params.get('campaign') || 
                      params.get('campaign_name') || 'PrimeWall Offer';
    const country = params.get('country') || params.get('geo') || 'Unknown';
    const signature = params.get('signature') || params.get('sig') || params.get('hash');
    const status = params.get('status') || params.get('result') || 'completed';

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
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse payout amount
    const payoutAmount = parseFloat(payoutRaw);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      console.error('Invalid payout amount:', payoutRaw, 'parsed:', payoutAmount);
      return new Response('Approved', {
        status: 200,
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
