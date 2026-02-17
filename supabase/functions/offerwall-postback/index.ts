const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PAYOUT = 1000;
const MAX_OFFER_NAME_LENGTH = 200;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyHmacSha256(secret: string, payload: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const buf = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return bytesToHex(new Uint8Array(buf)) === signature.toLowerCase();
  } catch {
    return false;
  }
}

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
}

// Direct Supabase REST API helper
async function supabaseRequest(path: string, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'POST' ? 'return=minimal' : 'return=representation',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  if (options.method === 'POST' || options.method === 'PATCH') {
    return { ok: res.ok, status: res.status };
  }
  
  const data = await res.json();
  return { ok: res.ok, data, status: res.status };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const userId = params.get('user_id') || params.get('identity_id') || params.get('subid') || params.get('sub_id') || params.get('click_id');
    let offerName = params.get('offer_name') || params.get('offer') || params.get('campaign_name') || 'Unknown Offer';
    const offerwallName = params.get('offerwall') || params.get('network') || params.get('source') || 'Unknown';
    const payout = params.get('payout') || params.get('amount') || params.get('reward') || params.get('usd') || '0';
    const transactionId = params.get('transaction_id') || params.get('tid') || params.get('oid') || params.get('id') || null;
    const ip = params.get('ip') || params.get('user_ip') || req.headers.get('x-forwarded-for') || null;
    const country = params.get('country') || params.get('geo') || params.get('country_code') || null;

    console.log('=== Postback received ===', { offerwall: offerwallName, userId, payout });

    if (!userId) {
      return new Response('MISSING_SUBID', { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    // Get site settings
    const settingsRes = await supabaseRequest('site_settings?id=eq.default&select=postback_secret,offerwall_settings');
    const settings = settingsRes.ok && settingsRes.data?.[0] ? settingsRes.data[0] : null;

    const postbackSecret = settings?.postback_secret || null;
    const offerwallSettings = settings?.offerwall_settings as { offerwalls?: OfferwallConfig[] } | null;
    const offerwalls = offerwallSettings?.offerwalls || [];

    // Find matching offerwall config
    let matchedOfferwall: OfferwallConfig | null = null;
    const normalizedName = offerwallName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const ow of offerwalls) {
      const owName = ow.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (ow.enabled && (owName === normalizedName || owName.includes(normalizedName) || normalizedName.includes(owName))) {
        matchedOfferwall = ow;
        break;
      }
    }

    // Signature verification
    const secretToUse = matchedOfferwall?.secretKey || matchedOfferwall?.apiKey || postbackSecret;
    const signature = params.get('sig') || params.get('signature') || params.get('hash') || req.headers.get('x-signature');
    const apiKey = params.get('api_key') || params.get('apikey') || req.headers.get('x-api-key');

    let verified = false;

    if (apiKey && secretToUse && apiKey === secretToUse) {
      verified = true;
    } else if (signature && secretToUse) {
      const payloads = [
        `${userId}${payout}${transactionId || ''}`,
        `${secretToUse}${userId}${transactionId}${payout}`,
        `${secretToUse}${userId}${payout}`,
      ];
      for (const p of payloads) {
        if (await verifyHmacSha256(secretToUse, p, signature)) { verified = true; break; }
      }
    }

    if (!verified) {
      return new Response('SIGNATURE_MISMATCH', { status: 401, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // Parse payout
    const payoutValue = parseFloat(payout) || 0;
    if (payoutValue > MAX_PAYOUT || payoutValue <= 0) {
      return new Response('REWARD_MISSING', { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    const conversionRate = matchedOfferwall?.pointsConversionRate || 1000;
    const profitMargin = matchedOfferwall?.profitMargin || 0;
    const coins = Math.round(payoutValue * conversionRate * (1 - profitMargin / 100));

    if (coins <= 0) {
      return new Response('REWARD_MISSING', { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // Duplicate check
    if (transactionId) {
      const dupRes = await supabaseRequest(`completed_offers?transaction_id=eq.${encodeURIComponent(transactionId)}&select=id&limit=1`);
      if (dupRes.ok && dupRes.data?.length > 0) {
        return new Response('DUP', { headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
      }
    }

    // Get user
    const profileRes = await supabaseRequest(`profiles?id=eq.${userId}&select=username,balance`);
    const profile = profileRes.ok && profileRes.data?.[0] ? profileRes.data[0] : null;

    if (!profile) {
      return new Response('MISSING_SUBID', { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // Insert offer
    const insertRes = await supabaseRequest('completed_offers', {
      method: 'POST',
      body: {
        user_id: userId,
        username: profile.username,
        offer_name: offerName,
        offerwall: matchedOfferwall?.name || offerwallName,
        coin: coins,
        transaction_id: transactionId,
        ip, country: country || 'Unknown',
      },
    });

    if (!insertRes.ok) {
      console.error('Insert failed:', insertRes.status);
      return new Response('ERROR', { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    // Update balance
    const newBalance = (profile.balance || 0) + coins;
    await supabaseRequest(`profiles?id=eq.${userId}`, {
      method: 'PATCH',
      body: { balance: newBalance },
    });

    console.log('=== Postback OK ===', { coins });
    return new Response('OK', { headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response('ERROR', { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
  }
});
