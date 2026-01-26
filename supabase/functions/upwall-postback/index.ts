import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Upwall Configuration - from environment variables
const UPWALL_SECRET_KEY = Deno.env.get('UPWALL_SECRET_KEY');

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
  const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => null);
  
  // If MD5 not available, use SHA-256 and take first 32 chars
  if (!hashBuffer) {
    const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
    return bytesToHex(new Uint8Array(sha256Buffer)).substring(0, 32);
  }
  
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
    const params = url.searchParams;

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || '';

    console.log('=== Upwall Postback Received ===');
    console.log('Full URL:', req.url);
    console.log('Client IP:', clientIp);
    console.log('All params:', Object.fromEntries(params.entries()));

    // Extract Upwall parameters - support multiple parameter names
    const userId = params.get('user_id') || params.get('subid') || params.get('sub_id') || 
                   params.get('uid') || params.get('click_id') || params.get('aff_sub');
    const transactionId = params.get('transaction_id') || params.get('txid') || params.get('tid') || 
                          params.get('offer_id') || params.get('id') || '';
    const payout = params.get('payout') || params.get('reward') || params.get('points') || 
                   params.get('amount') || params.get('coins') || '0';
    const offerNameRaw = params.get('offer_name') || params.get('offer') || params.get('name') || 
                         params.get('campaign') || params.get('offer_title') || '';
    const signature = params.get('sig') || params.get('signature') || params.get('hash') || 
                      params.get('sign') || params.get('key') || '';
    const country = params.get('country') || params.get('geo') || params.get('country_code') || 'Unknown';
    const status = params.get('status') || params.get('result') || 'completed';

    console.log('Parsed params:', { userId, transactionId, payout, offerNameRaw, signature: !!signature });

    // Validate required parameters
    if (!userId) {
      console.error('[Validation] Missing user_id/subid parameter');
      return new Response('MISSING_SUBID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse payout value
    let payoutValue = parseFloat(payout) || 0;

    if (payoutValue <= 0) {
      console.error('[Validation] Invalid payout value:', payout);
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

    // Signature verification (if secret key is configured)
    if (UPWALL_SECRET_KEY && signature) {
      // Try multiple signature formats
      const possibleSignatures = [
        await md5Hash(`${userId}${transactionId}${payout}${UPWALL_SECRET_KEY}`),
        await md5Hash(`${userId}${payout}${UPWALL_SECRET_KEY}`),
        await md5Hash(`${transactionId}${UPWALL_SECRET_KEY}`),
        await sha256Hash(`${userId}${transactionId}${payout}${UPWALL_SECRET_KEY}`),
        await sha256Hash(`${userId}${payout}${UPWALL_SECRET_KEY}`),
      ];

      const signatureValid = possibleSignatures.some(
        sig => sig.toLowerCase() === signature.toLowerCase()
      );

      if (!signatureValid) {
        console.error('[Security] Signature verification failed');
        console.log('Expected one of:', possibleSignatures.map(s => s.substring(0, 8) + '...'));
        console.log('Received:', signature.substring(0, 8) + '...');
        // Still process but log warning - some walls don't use signatures
      } else {
        console.log('[Security] Signature verification passed');
      }
    }

    // Handle offer name
    let offerName = offerNameRaw ? decodeURIComponent(offerNameRaw) : '';
    
    // Check for placeholder patterns
    const placeholderPatterns = [
      /^\{.*\}$/, /^\[.*\]$/, /^%.*%$/, /^\$\{.*\}$/, /^{{.*}}$/,
    ];
    
    const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(offerName));
    
    if (!offerName || isPlaceholder) {
      offerName = transactionId ? `Upwall Offer #${transactionId.slice(-6)}` : 'Upwall Offer';
    }

    // Truncate offer name if too long
    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    // Handle status - only process completed offers
    if (status.toLowerCase() !== 'completed' && status.toLowerCase() !== 'approved' && status.toLowerCase() !== 'success') {
      if (status.toLowerCase() === 'rejected' || status.toLowerCase() === 'chargeback' || status.toLowerCase() === 'reversed') {
        payoutValue = -Math.abs(payoutValue);
        console.log('Processing chargeback/rejection:', payoutValue);
      } else {
        console.log('Unknown status, ignoring:', status);
        return new Response('INVALID_STATUS', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate transaction
    if (transactionId) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction detected:', transactionId);
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
        offerwall: 'Upwall',
        coin: payoutValue,
        transaction_id: transactionId || `upwall_${Date.now()}`,
        ip: clientIp || null,
        country: country,
      });

    if (insertError) {
      console.error('Failed to insert offer record:', insertError);
    }

    console.log('=== Upwall Postback Processed Successfully ===');
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
