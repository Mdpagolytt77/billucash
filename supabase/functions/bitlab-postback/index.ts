import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BITLAB_SECRET_KEY = Deno.env.get('BITLAB_SECRET_KEY');
const MAX_PAYOUT = 1000;
const MAX_OFFER_NAME_LENGTH = 200;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

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

    console.log('=== BitLab Postback Received ===');
    console.log('All params:', Object.fromEntries(params.entries()));

    // BitLabs parameters: uid (USER:ID), tx (TX), val (VALUE:CURRENCY), usd (VALUE:USD)
    const userId = params.get('uid') || params.get('user_id') || '';
    const txid = params.get('tx') || params.get('transaction_id') || '';
    let offerName = params.get('offer_name') || params.get('offer_id') || 'BitLab Offer';
    const payout = params.get('val') || params.get('reward') || params.get('usd') || '0';
    const incomingHash = params.get('hash') || params.get('sig') || params.get('signature') || '';
    const status = params.get('status') || params.get('offer_state') || 'completed';
    const country = params.get('country') || params.get('country_code') || 'Unknown';
    const userIp = params.get('ip') || clientIp || '';

    console.log('Parsed BitLab values:', { userId, txid, offerName, payout, status });

    // Validate required parameters
    if (!userId) {
      console.error('[Validation] Missing uid/user_id');
      return new Response('MISSING_SUBID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Signature verification (BitLabs uses SHA1 hash typically)
    if (BITLAB_SECRET_KEY && incomingHash) {
      const formats = [
        `${userId}${payout}${BITLAB_SECRET_KEY}`,
        `${txid}${userId}${payout}${BITLAB_SECRET_KEY}`,
        `${userId}${txid}${payout}${BITLAB_SECRET_KEY}`,
      ];

      let signatureValid = false;
      for (const format of formats) {
        const expected = await sha256Hash(format);
        if (expected.toLowerCase() === incomingHash.toLowerCase()) {
          signatureValid = true;
          console.log('[Security] SHA256 signature verified');
          break;
        }
      }

      if (!signatureValid) {
        console.warn('[Security] Signature mismatch, proceeding anyway');
      }
    }

    let payoutValue = parseFloat(payout) || 0;

    if (Math.abs(payoutValue) > MAX_PAYOUT) {
      console.error(`[Security] Payout ${payoutValue} exceeds max`);
      return new Response('ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Handle rejections/chargebacks
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'rejected' || lowerStatus === 'chargeback' || lowerStatus === 'reversed' || lowerStatus === 'screen_out') {
      if (payoutValue > 0) payoutValue = -payoutValue;
      console.log('Processing rejection, payout:', payoutValue);
    }

    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Duplicate check
    const transactionId = txid || `bitlab_${Date.now()}_${userId}`;
    if (txid) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', txid)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction');
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

    const coinsToAward = Math.round(payoutValue);

    // Update balance
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: coinsToAward
    });

    if (balanceError) {
      console.error('Failed to update balance:', balanceError);
      return new Response('ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Insert completed offer
    const { error: insertError } = await supabase
      .from('completed_offers')
      .insert({
        user_id: userId,
        username: profile.username || userId,
        offer_name: offerName,
        offerwall: 'BitLab',
        coin: coinsToAward,
        transaction_id: transactionId,
        ip: userIp || null,
        country: country,
      });

    if (insertError) {
      console.error('Failed to insert offer:', insertError);
    }

    console.log('=== BitLab Postback Processed ===', {
      userId, offerName, coinsToAward, transactionId
    });

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
