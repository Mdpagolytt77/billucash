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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || '';

    console.log('=== Adtogame Postback Received ===');
    console.log('Full URL:', req.url);
    console.log('Client IP:', clientIp);
    console.log('All params:', Object.fromEntries(params.entries()));

    // --- Signature / API Key Verification ---
    const ADTOGAME_API_KEY = Deno.env.get('ADTOGAME_API_KEY');
    const signature = params.get('api_key') || params.get('signature') || params.get('sig') || '';

    if (!ADTOGAME_API_KEY) {
      console.error('[Security] ADTOGAME_API_KEY not configured');
      return new Response('SERVER_ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    if (!signature || signature !== ADTOGAME_API_KEY) {
      console.error('[Security] Invalid API key/signature:', signature);
      return new Response('UNAUTHORIZED', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Extract Adtogame parameters
    const userId = params.get('user_id') || '';
    const payoutUsd = params.get('payout_usd') || '0';
    const points = params.get('points') || '0';
    const offerId = params.get('offer_id') || '';
    const offerNameRaw = params.get('offer_name') || '';
    const transactionId = params.get('transaction_id') || '';
    const conversionId = params.get('conversion_id') || '';
    const geo = params.get('geo') || 'Unknown';

    console.log('Parsed params:', { userId, payoutUsd, points, offerId, transactionId, conversionId, geo });

    if (!userId) {
      console.error('[Validation] Missing user_id parameter');
      return new Response('MISSING_USER_ID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse coin amount - prefer points directly, fallback to payout_usd conversion
    let coinAmount = 0;
    const pointsValue = parseFloat(points) || 0;
    
    if (pointsValue > 0) {
      coinAmount = Math.round(pointsValue);
    } else {
      const payoutValue = parseFloat(payoutUsd) || 0;
      coinAmount = Math.round(payoutValue * 1000);
    }

    if (coinAmount <= 0) {
      console.error('[Validation] Invalid coin amount:', points, payoutUsd);
      return new Response('INVALID_PAYOUT', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Security: Maximum payout validation
    const maxCoinAmount = MAX_PAYOUT * 1000;
    if (coinAmount > maxCoinAmount) {
      console.error(`[Security] Coin amount ${coinAmount} exceeds maximum ${maxCoinAmount}`);
      return new Response('PAYOUT_TOO_HIGH', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Handle offer name
    let offerName = offerNameRaw ? decodeURIComponent(offerNameRaw) : '';
    const placeholderPatterns = [
      /^\{.*\}$/, /^\[.*\]$/, /^%.*%$/, /^\$\{.*\}$/, /^{{.*}}$/,
    ];
    const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(offerName));
    if (!offerName || isPlaceholder) {
      offerName = offerId ? `Adtogame Offer #${offerId.slice(-6)}` : 'Adtogame Offer';
    }
    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

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

    // Update user balance
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: coinAmount
    });

    if (balanceError) {
      console.error('Failed to update balance:', balanceError);
      return new Response('BALANCE_ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Insert completed offer record
    const { error: insertError } = await supabase
      .from('completed_offers')
      .insert({
        user_id: userId,
        username: profile.username || userId,
        offer_name: offerName,
        offerwall: 'Adtogame',
        coin: coinAmount,
        transaction_id: uniqueTransactionId,
        ip: clientIp || null,
        country: geo,
      });

    if (insertError) {
      console.error('Failed to insert offer record:', insertError);
    }

    console.log('=== Adtogame Postback Processed Successfully ===');
    console.log('User:', profile.username, 'Coins:', coinAmount);

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
