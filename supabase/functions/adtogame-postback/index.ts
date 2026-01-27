import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security limits
const MAX_PAYOUT = 1000; // Maximum $1000 per transaction
const MAX_OFFER_NAME_LENGTH = 200;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || '';

    console.log('=== Adtogame Postback Received ===');
    console.log('Full URL:', req.url);
    console.log('Client IP:', clientIp);
    console.log('All params:', Object.fromEntries(params.entries()));

    // Extract Adtogame parameters based on their macro system
    // {user_id} - id of your user
    const userId = params.get('user_id') || '';
    // {payout_usd} - amount of conversion in $, ex. 1.23
    const payoutUsd = params.get('payout_usd') || '0';
    // {points} - amount of points according to conversion rate
    const points = params.get('points') || '0';
    // {offer_id} - id of offer from everflow
    const offerId = params.get('offer_id') || '';
    // {offer_name} - name of offer
    const offerNameRaw = params.get('offer_name') || '';
    // {transaction_id} - transaction id from everflow
    const transactionId = params.get('transaction_id') || '';
    // {conversion_id} - conversion id from everflow
    const conversionId = params.get('conversion_id') || '';
    // {geo} - country code of click
    const geo = params.get('geo') || 'Unknown';
    // {timestamp} - current timestamp
    const timestamp = params.get('timestamp') || '';

    console.log('Parsed params:', { userId, payoutUsd, points, offerId, transactionId, conversionId, geo });

    // Validate required parameters
    if (!userId) {
      console.error('[Validation] Missing user_id parameter');
      return new Response('MISSING_USER_ID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse payout value - prefer payout_usd, fallback to points conversion
    let payoutValue = parseFloat(payoutUsd) || 0;
    
    // If payout_usd is 0 but points exist, convert points (1000 points = $1)
    if (payoutValue <= 0 && points) {
      const pointsValue = parseFloat(points) || 0;
      payoutValue = pointsValue / 1000; // Convert points to USD
    }

    if (payoutValue <= 0) {
      console.error('[Validation] Invalid payout value:', payoutUsd, points);
      return new Response('INVALID_PAYOUT', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Security: Maximum payout validation
    if (payoutValue > MAX_PAYOUT) {
      console.error(`[Security] Payout ${payoutValue} exceeds maximum ${MAX_PAYOUT}`);
      return new Response('PAYOUT_TOO_HIGH', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Handle offer name
    let offerName = offerNameRaw ? decodeURIComponent(offerNameRaw) : '';
    
    // Check for placeholder patterns
    const placeholderPatterns = [
      /^\{.*\}$/, /^\[.*\]$/, /^%.*%$/, /^\$\{.*\}$/, /^{{.*}}$/,
    ];
    
    const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(offerName));
    
    if (!offerName || isPlaceholder) {
      offerName = offerId ? `Adtogame Offer #${offerId.slice(-6)}` : 'Adtogame Offer';
    }

    // Truncate offer name if too long
    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    // Create unique transaction ID using transaction_id or conversion_id
    const uniqueTransactionId = transactionId || conversionId || `adtogame_${Date.now()}`;

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate transaction
    if (uniqueTransactionId) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', uniqueTransactionId)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction detected:', uniqueTransactionId);
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

    console.log('User found:', profile.username, 'Current balance:', profile.balance);

    // Update user balance using increment_balance function
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: payoutValue
    });

    if (balanceError) {
      console.error('Failed to update balance:', balanceError);
      return new Response('BALANCE_ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Get updated balance
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .maybeSingle();

    const newBalance = updatedProfile?.balance || 0;

    // Insert completed offer record
    const { error: insertError } = await supabase
      .from('completed_offers')
      .insert({
        user_id: userId,
        username: profile.username,
        offer_name: offerName,
        offerwall: 'Adtogame',
        coin: payoutValue,
        transaction_id: uniqueTransactionId,
        ip: clientIp || null,
        country: geo,
      });

    if (insertError) {
      console.error('Failed to insert offer record:', insertError);
    }

    console.log('=== Adtogame Postback Processed Successfully ===');
    console.log('User:', profile.username);
    console.log('Payout:', payoutValue);
    console.log('New Balance:', newBalance);

    return new Response('OK', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Processing error:', error);
    return new Response('ERROR', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
