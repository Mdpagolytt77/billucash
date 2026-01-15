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

    console.log('=== Offery Postback Received ===');
    console.log('Client IP:', clientIp);
    console.log('All params:', Object.fromEntries(params.entries()));

    // Extract Offery parameters
    // Offery uses: subid (User ID), reward (coins), offer_name, transid (transaction ID)
    const userId = params.get('subid') || params.get('user_id') || params.get('aff_sub') || params.get('uid') || '';
    const reward = params.get('reward') || params.get('payout') || params.get('points') || params.get('amount') || '0';
    const txid = params.get('transid') || params.get('transaction_id') || params.get('offer_id') || params.get('txid') || '';
    const status = params.get('status') || params.get('result') || 'completed';
    const country = params.get('country') || params.get('country_code') || params.get('geo') || 'Unknown';
    const userIp = params.get('ip') || params.get('user_ip') || clientIp || '';
    
    // Get offer name with multiple fallbacks and decode URL encoding
    let offerNameRaw = params.get('offer_name') || params.get('offername') || params.get('offer') || 
                       params.get('campaign_name') || params.get('name') || params.get('campaign') || '';
    
    let offerName = offerNameRaw ? decodeURIComponent(offerNameRaw) : '';
    
    // Check if the value is still a placeholder macro (not replaced by the offerwall)
    const placeholderPatterns = [
      /^\{.*\}$/,           // {OFFER_NAME}, {offer_name}
      /^\[.*\]$/,           // [OFFER_NAME], [offer_name]
      /^%.*%$/,             // %OFFER_NAME%, %offer_name%
      /^\$\{.*\}$/,         // ${OFFER_NAME}
      /^{{.*}}$/,           // {{OFFER_NAME}}
    ];
    
    const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(offerName));
    
    if (!offerName || isPlaceholder) {
      offerName = txid ? `Offer #${txid}` : 'Offery Offer';
      console.log('[Info] Using fallback offer name:', offerName, '(original was placeholder or empty)');
    }
    
    console.log('Parsed values:', { userId, reward, offerName, txid, status });

    // Validate required parameters
    if (!userId) {
      console.error('[Validation] Missing user_id/subid parameter');
      return new Response(JSON.stringify({ success: false, error: 'Missing user_id' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse reward value
    let rewardValue = parseFloat(reward) || 0;

    // SECURITY: Maximum payout validation
    if (Math.abs(rewardValue) > MAX_PAYOUT) {
      console.error(`[Security] Reward ${rewardValue} exceeds maximum ${MAX_PAYOUT}`);
      return new Response(JSON.stringify({ success: false, error: 'Invalid reward amount' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle status for chargebacks/rejections
    if (status.toLowerCase() === 'rejected' || status.toLowerCase() === 'chargeback' || status.toLowerCase() === 'reversed') {
      if (rewardValue > 0) {
        rewardValue = -rewardValue;
      }
      console.log('Processing rejection/chargeback, reward:', rewardValue);
    } else if (status.toLowerCase() !== 'completed' && status.toLowerCase() !== 'approved' && status.toLowerCase() !== 'success') {
      console.log('Unknown status, proceeding anyway:', status);
    }

    // Validate string field lengths
    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate transaction
    if (txid) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', txid)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction, already processed');
        return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      return new Response(JSON.stringify({ success: false, error: 'User not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the increment_balance function
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: rewardValue
    });

    if (balanceError) {
      console.error('Failed to update balance:', balanceError);
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
        offerwall: 'Offery',
        coin: rewardValue,
        transaction_id: txid || `offery_${Date.now()}`,
        ip: userIp || null,
        country: country,
      });

    if (insertError) {
      console.error('Failed to insert offer:', insertError);
    }

    console.log('=== Offery Postback Processed ===', {
      status,
      reward: rewardValue,
      offerName,
      newBalance
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Postback processed successfully',
      reward: rewardValue,
      newBalance 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Processing error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
