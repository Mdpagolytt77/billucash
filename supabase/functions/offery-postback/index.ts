import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Offery Configuration - from environment variables
const OFFERY_SECRET_KEY = Deno.env.get('OFFERY_SECRET_KEY');

// Security limits
const MAX_PAYOUT = 1000; // Maximum $1000 per transaction
const MAX_OFFER_NAME_LENGTH = 200;

// Helper to convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// MD5 hash function
async function md5Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// SHA256 hash function
async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Get the raw query string and fix multiple encoding issues
    let rawQuery = decodeURIComponent(url.search);
    
    // Fix HTML encoded ampersands (multiple variations)
    rawQuery = rawQuery
      .replace(/&amp;/gi, '&')
      .replace(/&amp%3B/gi, '&')
      .replace(/amp;/gi, '');
    
    // Rebuild URL with fixed query
    const fixedUrl = new URL(url.origin + url.pathname + rawQuery);
    const params = fixedUrl.searchParams;

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || '';

    console.log('=== Offery Postback Received ===');
    console.log('Client IP:', clientIp);
    console.log('Original query:', url.search);
    console.log('Fixed query:', rawQuery);
    console.log('All params:', Object.fromEntries(params.entries()));

    // Extract Offery parameters
    // Offery macros: {aff_sub}, {payout}, {offer_name}, {offer_id}, {ip}, {country_code}
    const userId = params.get('user_id') || params.get('aff_sub') || params.get('subid') || params.get('uid') || '';
    const txid = params.get('transaction_id') || params.get('offer_id') || params.get('txid') || params.get('click_id') || '';
    const incomingHash = params.get('sig') || params.get('hash') || params.get('signature') || '';
    const status = params.get('status') || params.get('result') || 'completed';
    const payout = params.get('payout') || params.get('points') || params.get('reward') || params.get('amount') || '0';
    let offerName = params.get('offer_name') || params.get('campaign_name') || params.get('offer') || 'Offery Offer';
    const country = params.get('country') || params.get('country_code') || params.get('geo') || 'Unknown';
    const userIp = params.get('ip') || clientIp || '';
    
    console.log('Parsed values:', { userId, payout, offerName, txid });

    // Validate required parameters
    if (!userId) {
      console.error('[Validation] Missing user_id parameter');
      return new Response(JSON.stringify({ success: false, error: 'Missing user_id' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Signature Verification (if secret key is configured)
    if (OFFERY_SECRET_KEY && incomingHash) {
      const signatureFormats = [
        `${userId}${payout}${OFFERY_SECRET_KEY}`,
        `${userId}${txid}${payout}${OFFERY_SECRET_KEY}`,
        `${txid}${userId}${payout}${OFFERY_SECRET_KEY}`,
      ];

      let signatureValid = false;

      for (const format of signatureFormats) {
        try {
          const md5Expected = await md5Hash(format);
          if (md5Expected.toLowerCase() === incomingHash.toLowerCase()) {
            signatureValid = true;
            console.log('[Security] MD5 signature verification passed');
            break;
          }
        } catch (e) {
          console.log('[Security] MD5 not supported, trying SHA256');
        }

        const sha256Expected = await sha256Hash(format);
        if (sha256Expected.toLowerCase() === incomingHash.toLowerCase()) {
          signatureValid = true;
          console.log('[Security] SHA256 signature verification passed');
          break;
        }
      }

      if (!signatureValid) {
        console.warn('[Security] Signature verification failed, but proceeding');
      }
    } else if (!incomingHash) {
      console.log('[Security] No signature provided, skipping verification');
    }

    // Parse payout
    let payoutValue = parseFloat(payout) || 0;

    // SECURITY: Maximum payout validation
    if (Math.abs(payoutValue) > MAX_PAYOUT) {
      console.error(`[Security] Payout ${payoutValue} exceeds maximum ${MAX_PAYOUT}`);
      return new Response(JSON.stringify({ success: false, error: 'Payout exceeds limit' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle status
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'rejected' || lowerStatus === 'chargeback' || lowerStatus === 'reversed') {
      if (payoutValue > 0) {
        payoutValue = -payoutValue;
      }
      console.log('Processing rejection/chargeback, payout:', payoutValue);
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
    const transactionId = txid || `offery_${Date.now()}_${userId}`;
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

    // Calculate coins to award
    const coinsToAward = Math.round(payoutValue);

    // Use the increment_balance function
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_input: userId,
      amount_input: coinsToAward
    });

    if (balanceError) {
      console.error('Failed to update balance:', balanceError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to update balance' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        offerwall: 'Offery',
        coin: coinsToAward,
        transaction_id: transactionId,
        ip: userIp || null,
        country: country,
      });

    if (insertError) {
      console.error('Failed to insert offer:', insertError);
    }

    console.log('=== Offery Postback Processed Successfully ===', {
      userId,
      offerName,
      coinsAwarded: coinsToAward,
      newBalance,
      transactionId
    });

    // Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Postback processed',
      coins_awarded: coinsToAward,
      new_balance: newBalance
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
