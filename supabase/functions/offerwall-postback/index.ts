import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return expectedSignature === signature.toLowerCase();
  } catch {
    return false;
  }
}

// MD5 hash for OfferToro verification
async function md5Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Provider-specific credential types
interface OfferwallCredentials {
  appId?: string;
  apiKey?: string;
  postbackUrl?: string;
  publicKey?: string;
  secretKey?: string;
  publisherId?: string;
  campaignId?: string;
  hashKey?: string;
}

interface OfferwallConfig {
  id: string;
  name: string;
  enabled: boolean;
  provider: 'adgem' | 'offertoro' | 'adgate' | 'wannads' | 'custom';
  credentials: OfferwallCredentials;
}

// Verify AdGem postback
async function verifyAdGem(
  params: URLSearchParams,
  headers: Headers,
  credentials: OfferwallCredentials
): Promise<{ valid: boolean; reason?: string }> {
  const apiKey = headers.get('x-api-key') || params.get('api_key');
  const appId = params.get('app_id') || params.get('appid');
  
  // Verify API key matches
  if (credentials.apiKey && apiKey === credentials.apiKey) {
    console.log('AdGem: Verified via API key');
    return { valid: true };
  }
  
  // Verify App ID matches
  if (credentials.appId && appId === credentials.appId) {
    console.log('AdGem: Verified via App ID');
    return { valid: true };
  }
  
  // If no credentials configured, allow (with warning)
  if (!credentials.apiKey && !credentials.appId) {
    console.warn('AdGem: No credentials configured - allowing request');
    return { valid: true };
  }
  
  return { valid: false, reason: 'Invalid AdGem API key or App ID' };
}

// Verify OfferToro postback using signature
async function verifyOfferToro(
  params: URLSearchParams,
  credentials: OfferwallCredentials
): Promise<{ valid: boolean; reason?: string }> {
  const signature = params.get('sig') || params.get('signature');
  const userId = params.get('user_id') || params.get('subid');
  const amount = params.get('amount') || params.get('payout');
  const transactionId = params.get('oid') || params.get('transaction_id');
  
  if (!credentials.secretKey) {
    console.warn('OfferToro: No secret key configured - allowing request');
    return { valid: true };
  }
  
  if (signature) {
    // OfferToro signature format: md5(secret_key + user_id + oid + amount)
    const expectedPayload = `${credentials.secretKey}${userId}${transactionId}${amount}`;
    const expectedSig = await md5Hash(expectedPayload);
    
    if (expectedSig === signature.toLowerCase()) {
      console.log('OfferToro: Verified via signature');
      return { valid: true };
    }
    
    // Try alternate format: md5(secret_key + user_id + amount)
    const altPayload = `${credentials.secretKey}${userId}${amount}`;
    const altSig = await md5Hash(altPayload);
    
    if (altSig === signature.toLowerCase()) {
      console.log('OfferToro: Verified via alternate signature');
      return { valid: true };
    }
  }
  
  // Fallback: verify public key if provided
  const publicKey = params.get('pub_key') || params.get('public_key');
  if (credentials.publicKey && publicKey === credentials.publicKey) {
    console.log('OfferToro: Verified via public key');
    return { valid: true };
  }
  
  return { valid: false, reason: 'Invalid OfferToro signature or public key' };
}

// Verify AdGate postback
async function verifyAdGate(
  params: URLSearchParams,
  headers: Headers,
  credentials: OfferwallCredentials
): Promise<{ valid: boolean; reason?: string }> {
  const apiKey = headers.get('x-api-key') || params.get('api_key');
  const publisherId = params.get('aff_id') || params.get('publisher_id');
  const campaignId = params.get('campaign_id') || params.get('cid');
  
  // Verify API key
  if (credentials.apiKey && apiKey === credentials.apiKey) {
    console.log('AdGate: Verified via API key');
    return { valid: true };
  }
  
  // Verify publisher ID
  if (credentials.publisherId && publisherId === credentials.publisherId) {
    console.log('AdGate: Verified via Publisher ID');
    return { valid: true };
  }
  
  // Verify campaign ID (optional additional check)
  if (credentials.campaignId && campaignId === credentials.campaignId) {
    console.log('AdGate: Verified via Campaign ID');
    return { valid: true };
  }
  
  // If no credentials configured
  if (!credentials.apiKey && !credentials.publisherId) {
    console.warn('AdGate: No credentials configured - allowing request');
    return { valid: true };
  }
  
  return { valid: false, reason: 'Invalid AdGate API key or Publisher ID' };
}

// Verify Wannads postback using hash
async function verifyWannads(
  params: URLSearchParams,
  headers: Headers,
  credentials: OfferwallCredentials
): Promise<{ valid: boolean; reason?: string }> {
  const apiKey = headers.get('x-api-key') || params.get('api_key');
  const hash = params.get('hash') || params.get('sig') || params.get('signature');
  const userId = params.get('user_id') || params.get('subid');
  const payout = params.get('payout') || params.get('amount');
  const transactionId = params.get('tid') || params.get('transaction_id');
  
  // Verify API key
  if (credentials.apiKey && apiKey === credentials.apiKey) {
    console.log('Wannads: Verified via API key');
    return { valid: true };
  }
  
  // Verify hash using hashKey
  if (credentials.hashKey && hash) {
    // Wannads hash format: HMAC-SHA256(hashKey, user_id + payout + transaction_id)
    const payload = `${userId}${payout}${transactionId || ''}`;
    const isValid = await verifyHmacSha256(credentials.hashKey, payload, hash);
    
    if (isValid) {
      console.log('Wannads: Verified via hash');
      return { valid: true };
    }
  }
  
  // If no credentials configured
  if (!credentials.apiKey && !credentials.hashKey) {
    console.warn('Wannads: No credentials configured - allowing request');
    return { valid: true };
  }
  
  return { valid: false, reason: 'Invalid Wannads API key or hash' };
}

// Generic custom provider verification
async function verifyCustom(
  params: URLSearchParams,
  headers: Headers,
  credentials: OfferwallCredentials,
  postbackSecret: string | null
): Promise<{ valid: boolean; reason?: string }> {
  const apiKey = headers.get('x-api-key') || params.get('api_key');
  const signature = headers.get('x-signature') || params.get('signature') || params.get('sig');
  
  // Check custom API key
  if (credentials.apiKey && apiKey === credentials.apiKey) {
    console.log('Custom: Verified via offerwall API key');
    return { valid: true };
  }
  
  // Check global postback secret
  if (postbackSecret) {
    if (apiKey === postbackSecret) {
      console.log('Custom: Verified via global postback secret');
      return { valid: true };
    }
    
    // Check signature
    if (signature) {
      const userId = params.get('user_id') || params.get('subid');
      const payout = params.get('payout') || params.get('amount');
      const transactionId = params.get('transaction_id') || params.get('tid');
      const payload = `${userId}${payout}${transactionId || ''}`;
      
      if (await verifyHmacSha256(postbackSecret, payload, signature)) {
        console.log('Custom: Verified via signature');
        return { valid: true };
      }
    }
  }
  
  // If no auth method configured
  if (!credentials.apiKey && !postbackSecret) {
    console.warn('Custom: No credentials configured - allowing request');
    return { valid: true };
  }
  
  return { valid: false, reason: 'Invalid custom API key or signature' };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    // Extract parameters from query string (common offerwall format)
    const userId = params.get('user_id') || params.get('subid') || params.get('sub_id');
    const offerName = params.get('offer_name') || params.get('offer') || params.get('campaign_name') || 'Unknown Offer';
    const offerwallName = params.get('offerwall') || params.get('network') || params.get('source') || 'Unknown';
    const payout = params.get('payout') || params.get('amount') || params.get('reward') || '0';
    const transactionId = params.get('transaction_id') || params.get('tid') || params.get('oid') || params.get('id') || null;
    const ip = params.get('ip') || params.get('user_ip') || req.headers.get('x-forwarded-for') || null;
    const country = params.get('country') || params.get('geo') || null;

    console.log('Postback received:', { userId, offerName, offerwallName, payout, transactionId, ip, country });

    // Validate required parameters
    if (!userId) {
      console.error('Missing user_id parameter');
      return new Response(JSON.stringify({ error: 'Missing user_id parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get site settings including offerwall configurations
    const { data: settings } = await supabase
      .from('site_settings')
      .select('postback_secret, offerwall_settings')
      .eq('id', 'default')
      .single();

    const postbackSecret = settings?.postback_secret || null;
    const offerwallSettings = settings?.offerwall_settings as { offerwalls?: OfferwallConfig[] } | null;
    const offerwalls = offerwallSettings?.offerwalls || [];

    // Find matching offerwall configuration
    let matchedOfferwall: OfferwallConfig | null = null;
    const normalizedName = offerwallName.toLowerCase();
    
    for (const ow of offerwalls) {
      if (ow.enabled && ow.name.toLowerCase().includes(normalizedName) || normalizedName.includes(ow.name.toLowerCase())) {
        matchedOfferwall = ow;
        break;
      }
    }

    // Also try to match by provider name in the URL
    if (!matchedOfferwall) {
      for (const ow of offerwalls) {
        if (ow.enabled && normalizedName.includes(ow.provider)) {
          matchedOfferwall = ow;
          break;
        }
      }
    }

    console.log('Matched offerwall:', matchedOfferwall?.name || 'none', 'provider:', matchedOfferwall?.provider || 'unknown');

    // Verify the request based on provider
    let verificationResult: { valid: boolean; reason?: string } = { valid: false, reason: 'No matching offerwall found' };

    if (matchedOfferwall) {
      const credentials = matchedOfferwall.credentials || {};
      
      switch (matchedOfferwall.provider) {
        case 'adgem':
          verificationResult = await verifyAdGem(params, req.headers, credentials);
          break;
        case 'offertoro':
          verificationResult = await verifyOfferToro(params, credentials);
          break;
        case 'adgate':
          verificationResult = await verifyAdGate(params, req.headers, credentials);
          break;
        case 'wannads':
          verificationResult = await verifyWannads(params, req.headers, credentials);
          break;
        case 'custom':
        default:
          verificationResult = await verifyCustom(params, req.headers, credentials, postbackSecret);
          break;
      }
    } else {
      // No matched offerwall - try generic verification with global secret
      console.log('No matched offerwall - using global verification');
      verificationResult = await verifyCustom(params, req.headers, {}, postbackSecret);
    }

    if (!verificationResult.valid) {
      console.error('Verification failed:', verificationResult.reason);
      return new Response(JSON.stringify({ error: `Unauthorized: ${verificationResult.reason}` }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse payout - convert to coins (1 coin = $0.001, so $1 = 1000 coins)
    const payoutValue = parseFloat(payout) || 0;
    const coins = Math.round(payoutValue * 1000);

    if (coins <= 0) {
      console.error('Invalid payout value:', payout);
      return new Response(JSON.stringify({ error: 'Invalid payout value' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if transaction already exists (prevent duplicates)
    if (transactionId) {
      const { data: existing } = await supabase
        .from('completed_offers')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existing) {
        console.log('Duplicate transaction:', transactionId);
        return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get user profile to get username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, balance')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('User not found:', userId, profileError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
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
      return new Response(JSON.stringify({ error: 'Failed to record offer' }), {
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

    console.log('Postback processed successfully:', { 
      userId, 
      offerwall: finalOfferwallName, 
      provider: matchedOfferwall?.provider || 'unknown',
      coins, 
      newBalance 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      coins_awarded: coins,
      new_balance: newBalance,
      offerwall: finalOfferwallName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Postback error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
