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

    // Extract PrimeWall parameters
    const userId = params.get('user_id');
    const payout = params.get('payout');
    const transactionId = params.get('transaction_id') || params.get('txid');
    const offerName = params.get('offer_name') || params.get('offer') || 'PrimeWall Offer';
    const country = params.get('country') || 'Unknown';
    const signature = params.get('signature') || params.get('sig') || params.get('hash');
    const secretKey = params.get('secret_key') || params.get('secret');

    console.log('Parsed params:', { userId, payout, transactionId, offerName, country, signature, secretKey });

    // Validate required parameters
    if (!userId || !payout) {
      console.error('Missing required params: user_id or payout');
      return new Response('Approved', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Secret key validation (if provided in request)
    if (secretKey && secretKey !== PRIMEWALL_SECRET_KEY) {
      console.warn('Secret key mismatch:', { received: secretKey, expected: PRIMEWALL_SECRET_KEY });
    }

    // Parse payout amount
    const payoutAmount = parseFloat(payout);
    if (isNaN(payoutAmount)) {
      console.error('Invalid payout amount:', payout);
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
