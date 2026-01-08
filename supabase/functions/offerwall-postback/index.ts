import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security limits
const MAX_PAYOUT = 1000; // Maximum $1000 per transaction
const MAX_OFFER_NAME_LENGTH = 200;

// Helper to convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// HMAC-SHA256 signature verification
async function verifyHmacSha256(secret: string, payload: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSignature = bytesToHex(new Uint8Array(signatureBuffer));
    return expectedSignature === signature.toLowerCase();
  } catch {
    return false;
  }
}

// MD5 hash for signature verification
async function md5Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// Offerwall configuration (from site_settings)
interface OfferwallConfig {
  id: string;
  name: string;
  enabled: boolean;
  provider: string;
  pointsConversionRate?: number;
  profitMargin?: number;
  minimumPayout?: number;
  apiKey?: string;
  secretKey?: string;
  subIdParam?: string;
}

// Secure signature verification
async function verifySignature(
  params: URLSearchParams,
  headers: Headers,
  postbackSecret: string | null,
  isTestMode: boolean,
  supabaseClient: any,
  offerwallConfig: OfferwallConfig | null
): Promise<{ valid: boolean; reason?: string }> {
  const secretToUse = offerwallConfig?.secretKey || offerwallConfig?.apiKey || postbackSecret;
  
  if (!secretToUse) {
    console.error('[Security] No secret configured');
    return { valid: false, reason: 'Configuration error' };
  }

  const signature = params.get('sig') || params.get('signature') || params.get('hash') || headers.get('x-signature');
  const apiKey = params.get('api_key') || params.get('apikey') || headers.get('x-api-key');
  const userId = params.get('user_id') || params.get('subid') || params.get('sub_id') || params.get('click_id');
  const payout = params.get('payout') || params.get('amount') || params.get('reward');
  const transactionId = params.get('transaction_id') || params.get('tid') || params.get('oid') || params.get('id');

  console.log('[Security] Verifying postback...', { 
    hasSignature: !!signature, 
    hasApiKey: !!apiKey, 
    isTestMode
  });

  // Test mode: DISABLED in production for security
  // Test mode requires explicit environment variable AND valid signature
  if (isTestMode) {
    const testModeEnabled = Deno.env.get('ENABLE_TEST_MODE') === 'true';
    if (!testModeEnabled) {
      console.warn('[Security] Test mode rejected - not enabled in environment');
      return { valid: false, reason: 'Test mode disabled' };
    }
    // Even in test mode, require API key or signature verification
    console.log('[Security] Test mode enabled, continuing to signature verification');
  }

  // Check API key match
  if (apiKey === secretToUse) {
    console.log('[Security] Verified via API key');
    return { valid: true };
  }

  if (offerwallConfig?.apiKey && apiKey === offerwallConfig.apiKey) {
    console.log('[Security] Verified via offerwall API key');
    return { valid: true };
  }

  // Check signature
  if (signature) {
    const secrets = [secretToUse];
    if (offerwallConfig?.secretKey && offerwallConfig.secretKey !== secretToUse) {
      secrets.push(offerwallConfig.secretKey);
    }
    if (postbackSecret && postbackSecret !== secretToUse) {
      secrets.push(postbackSecret);
    }

    for (const secret of secrets) {
      const payloads = [
        `${userId}${payout}${transactionId || ''}`,
        `${secret}${userId}${transactionId}${payout}`,
        `${secret}${userId}${payout}`,
        `${userId}${transactionId}${payout}`,
        `${payout}${userId}${transactionId || ''}`,
      ];

      for (const payload of payloads) {
        if (await verifyHmacSha256(secret, payload, signature)) {
          console.log('[Security] Verified via HMAC-SHA256');
          return { valid: true };
        }
        const md5Sig = await md5Hash(payload);
        if (md5Sig === signature.toLowerCase()) {
          console.log('[Security] Verified via MD5');
          return { valid: true };
        }
      }
    }
  }

  return { valid: false, reason: 'Unauthorized' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const userId = params.get('user_id') || params.get('identity_id') || params.get('subid') || params.get('sub_id') || params.get('click_id');
    let offerName = params.get('offer_name') || params.get('offer') || params.get('campaign_name') || params.get('offer_title') || 'Unknown Offer';
    const offerwallName = params.get('offerwall') || params.get('network') || params.get('source') || params.get('placement') || 'Unknown';
    const payout = params.get('payout') || params.get('amount') || params.get('reward') || params.get('usd') || '0';
    const transactionId = params.get('transaction_id') || params.get('tid') || params.get('oid') || params.get('id') || params.get('offer_id') || null;
    const ip = params.get('ip') || params.get('user_ip') || params.get('click_ip') || req.headers.get('x-forwarded-for') || null;
    const country = params.get('country') || params.get('geo') || params.get('country_code') || null;

    console.log('=== Postback received ===', { offerwall: offerwallName });

    // Validate required parameters
    if (!userId) {
      console.error('[Validation] Missing user_id');
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate string field lengths
    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get site settings
    const { data: settings } = await supabase
      .from('site_settings')
      .select('postback_secret, offerwall_settings')
      .eq('id', 'default')
      .single();

    const postbackSecret = settings?.postback_secret || null;
    const offerwallSettings = settings?.offerwall_settings as { offerwalls?: OfferwallConfig[] } | null;
    const offerwalls = offerwallSettings?.offerwalls || [];

    // Find matching offerwall
    let matchedOfferwall: OfferwallConfig | null = null;
    const normalizedName = offerwallName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const ow of offerwalls) {
      const owName = ow.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (ow.enabled && (owName === normalizedName || owName.includes(normalizedName) || normalizedName.includes(owName))) {
        matchedOfferwall = ow;
        break;
      }
    }

    if (!matchedOfferwall) {
      for (const ow of offerwalls) {
        if (ow.enabled && normalizedName.includes(ow.provider.toLowerCase())) {
          matchedOfferwall = ow;
          break;
        }
      }
    }

    console.log('[Security] Matched offerwall:', matchedOfferwall?.name || 'none');

    const isTestMode = params.get('test_mode') === 'true';
    const verificationResult = await verifySignature(params, req.headers, postbackSecret, isTestMode, supabase, matchedOfferwall);

    if (!verificationResult.valid) {
      console.error('[Security] Verification failed');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate payout
    const payoutValue = parseFloat(payout) || 0;
    
    // SECURITY: Maximum payout validation
    if (payoutValue > MAX_PAYOUT) {
      console.error(`[Security] Payout ${payoutValue} exceeds maximum ${MAX_PAYOUT}`);
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const conversionRate = matchedOfferwall?.pointsConversionRate || 1000;
    const profitMargin = matchedOfferwall?.profitMargin || 0;
    const totalPoints = payoutValue * conversionRate;
    const coins = Math.round(totalPoints * (1 - profitMargin / 100));

    const minimumPayout = matchedOfferwall?.minimumPayout || 0;
    if (payoutValue < minimumPayout) {
      console.log(`[Validation] Payout below minimum threshold`);
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (coins <= 0) {
      console.error('[Validation] Invalid payout value');
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate transaction
    if (transactionId) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction detected');
        return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
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
      console.error('[Validation] User not found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert completed offer
    const finalOfferwallName = matchedOfferwall?.name || offerwallName;
    const { error: insertError } = await supabase
      .from('completed_offers')
      .insert({
        user_id: userId,
        username: profile.username,
        offer_name: offerName,
        offerwall: finalOfferwallName,
        coin: coins,
        transaction_id: transactionId,
        ip: ip,
        country: country || 'Unknown',
      });

    if (insertError) {
      console.error('Failed to insert offer:', insertError);
      return new Response(JSON.stringify({ error: 'Processing error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user balance
    const newBalance = (profile.balance || 0) + coins;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update balance:', updateError);
    }

    console.log('=== Postback processed ===', { 
      offerwall: finalOfferwallName, 
      coinsAwarded: coins
    });

    return new Response(JSON.stringify({ 
      success: true, 
      coins_awarded: coins,
      new_balance: newBalance,
      offerwall: finalOfferwallName,
      conversion_rate: conversionRate
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Processing error:', error);
    return new Response(JSON.stringify({ error: 'Processing error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
