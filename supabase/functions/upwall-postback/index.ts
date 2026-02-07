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

    // Extract Upwall parameters based on their macro system
    // {userid} - unique identifier for user
    const userId = params.get('userid') || params.get('user_id') || params.get('subid') || '';
    // {transactionID} - transaction ID of completed offer
    const transactionId = params.get('transactionID') || params.get('transaction_id') || params.get('offer_id') || '';
    // {user_amount} - coin amount after exchange rate (e.g., $1 × 50 = 50 coins)
    const userAmount = params.get('user_amount') || '';
    // {payout} - offer payout in $ (USD)
    const payout = params.get('payout') || '0';
    // {offer_name} - name of completed offer
    const offerNameRaw = params.get('offer_name') || '';
    // {offer_id} - ID of completed offer
    const offerId = params.get('offer_id') || '';
    // {password} - postback password for verification
    const password = params.get('password') || '';
    // {ip_address} - device IP address
    const userIpAddress = params.get('ip_address') || '';
    const country = params.get('country') || 'Unknown';
    const status = params.get('status') || 'completed';

    console.log('Parsed params:', { userId, transactionId, userAmount, payout, offerNameRaw, password: !!password });

    // Validate required parameters
    if (!userId) {
      console.error('[Validation] Missing userid parameter');
      return new Response('MISSING_USERID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse coin amount - prefer user_amount (coins after exchange rate), fallback to payout (USD) conversion
    let coinAmount = 0;
    const userAmountValue = parseFloat(userAmount) || 0;
    
    if (userAmountValue > 0) {
      // Use user_amount directly as coins (already converted by Upwall's exchange rate)
      coinAmount = Math.round(userAmountValue);
    } else {
      // Fallback: convert payout (USD) to coins using platform rate (1 USD = 1000 coins)
      const payoutValue = parseFloat(payout) || 0;
      coinAmount = Math.round(payoutValue * 1000);
    }

    if (coinAmount <= 0) {
      console.error('[Validation] Invalid coin amount:', userAmount, payout);
      return new Response('INVALID_PAYOUT', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Calculate payout value for logging (coins / 1000 for approximate USD)
    const payoutValue = coinAmount / 1000;

    // Security: Maximum payout validation (MAX_PAYOUT is in USD, coinAmount is in coins)
    const maxCoinAmount = MAX_PAYOUT * 1000;
    if (coinAmount > maxCoinAmount) {
      console.error(`[Security] Coin amount ${coinAmount} exceeds maximum ${maxCoinAmount}`);
      return new Response('PAYOUT_TOO_HIGH', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Password verification (if secret key is configured)
    if (UPWALL_SECRET_KEY && password) {
      if (password !== UPWALL_SECRET_KEY) {
        console.error('[Security] Password verification failed');
        console.log('Expected:', UPWALL_SECRET_KEY.substring(0, 4) + '...');
        console.log('Received:', password.substring(0, 4) + '...');
        return new Response('INVALID_PASSWORD', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      } else {
        console.log('[Security] Password verification passed');
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
        coinAmount = -Math.abs(coinAmount);
        console.log('Processing chargeback/rejection:', coinAmount, 'coins');
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

    // Update user balance using increment_balance function (coinAmount is in coins)
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
        coin: coinAmount,
        transaction_id: transactionId || `upwall_${Date.now()}`,
        ip: clientIp || null,
        country: country,
      });

    if (insertError) {
      console.error('Failed to insert offer record:', insertError);
    }

    console.log('=== Upwall Postback Processed Successfully ===');
    console.log('User:', profile.username);
    console.log('Coins credited:', coinAmount);
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
