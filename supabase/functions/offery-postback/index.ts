import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import md5 from "https://esm.sh/md5@2.3.0";

/**
 * Offery Postback Endpoint
 * - Receives GET requests with: subid, reward, transid, signature
 * - Verifies signature: md5(subid + transid + reward + secret)
 * - Returns plain text: OK | DUP | ERROR...
 */

const textHeaders = { "Content-Type": "text/plain" };
const respond = (text: string, status = 200) =>
  new Response(text, { status, headers: textHeaders });

// Security limits
const MAX_PAYOUT = 1000;
const MAX_OFFER_NAME_LENGTH = 200;

serve(async (req) => {
  try {
    console.log("[offery-postback] Incoming:", req.method, req.url);
    const url = new URL(req.url);
    const params = url.searchParams;

    console.log("[offery-postback] Params:", Object.fromEntries(params.entries()));

    if (req.method !== "GET") return respond("METHOD_NOT_ALLOWED");

    // Extract parameters
    const userId = params.get('subid') || params.get('user_id') || params.get('aff_sub') || params.get('uid') || '';
    const rewardRaw = params.get('reward') || params.get('payout') || params.get('points') || params.get('amount') || '';
    const txid = params.get('transid') || params.get('transaction_id') || params.get('offer_id') || params.get('txid') || '';
    const signature = params.get('signature') || params.get('sig') || params.get('hash') || '';
    const status = params.get('status') || params.get('result') || 'completed';
    const country = params.get('country') || params.get('country_code') || params.get('geo') || 'Unknown';
    const userIp = params.get('ip') || params.get('user_ip') || 
                   req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';

    // Get offer name with fallbacks
    let offerNameRaw = params.get('offer_name') || params.get('offername') || params.get('offer') || 
                       params.get('campaign_name') || params.get('name') || params.get('campaign') || '';
    let offerName = offerNameRaw ? decodeURIComponent(offerNameRaw) : '';

    // Check for placeholder macros
    const placeholderPatterns = [/^\{.*\}$/, /^\[.*\]$/, /^%.*%$/, /^\$\{.*\}$/, /^{{.*}}$/];
    if (!offerName || placeholderPatterns.some(p => p.test(offerName))) {
      offerName = txid ? `Offer #${txid}` : 'Offery Offer';
    }

    // Validate required parameters
    if (!userId) return respond("MISSING_SUBID");
    if (!rewardRaw) return respond("REWARD_MISSING");
    if (!txid) return respond("MISSING_TRANSID");

    // Signature verification: md5(subid + transid + reward + secret)
    const secretKey = Deno.env.get("OFFERY_SECRET_KEY");
    if (!secretKey) return respond("SECRET_KEY_MISSING");

    const expectedSig = md5(userId + txid + rewardRaw + secretKey);
    if (signature.toLowerCase() !== expectedSig.toLowerCase()) {
      console.log("[offery-postback] Signature mismatch:", {
        received: signature,
        expected: expectedSig,
      });
      return respond("ERROR: Signature mismatch");
    }

    // Parse and validate reward
    let rewardValue = parseFloat(rewardRaw) || 0;
    if (!Number.isFinite(rewardValue)) return respond("INVALID_REWARD");
    if (Math.abs(rewardValue) > MAX_PAYOUT) {
      console.error(`[Security] Reward ${rewardValue} exceeds maximum ${MAX_PAYOUT}`);
      return respond("INVALID_REWARD");
    }
    if (rewardValue === 0) return respond("REWARD_MISSING");

    // Handle chargebacks/rejections
    if (['rejected', 'chargeback', 'reversed'].includes(status.toLowerCase())) {
      if (rewardValue > 0) rewardValue = -rewardValue;
      console.log('Processing rejection/chargeback, reward:', rewardValue);
    }

    // Truncate offer name
    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) return respond("CONFIG_MISSING");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Duplicate check
    const { data: existing, error: dupErr } = await supabase
      .from('completed_offers')
      .select('id')
      .eq('transaction_id', txid)
      .maybeSingle();

    if (dupErr) throw dupErr;
    if (existing) return respond("DUP");

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, balance')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      console.error('[Validation] User not found:', userId);
      return respond("USER_NOT_FOUND");
    }

    // Update balance
    const { error: balErr } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: rewardValue
    });

    if (balErr) throw balErr;

    // Record the transaction
    const { error: insErr } = await supabase
      .from('completed_offers')
      .insert({
        user_id: userId,
        username: profile.username || userId,
        offer_name: offerName,
        offerwall: 'Offery',
        coin: rewardValue,
        transaction_id: txid,
        ip: userIp || null,
        country: country,
      });

    if (insErr) throw insErr;

    console.log('[offery-postback] OK', { reward: rewardValue, offerName });
    return respond("OK");

  } catch (e) {
    const message = e instanceof Error ? e.message : "ERROR";
    console.error("[offery-postback] ERROR:", message);
    return respond(message || "ERROR");
  }
});
