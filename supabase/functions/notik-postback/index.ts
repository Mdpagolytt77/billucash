import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOTIK_SECRET_KEY = Deno.env.get('NOTIK_SECRET_KEY');
const MAX_PAYOUT = 10000000;
const MAX_OFFER_NAME_LENGTH = 200;

// Helper to convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// SHA-1 hash function (Notik uses SHA1)
async function sha1Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// SHA-256 hash function (fallback)
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
                     req.headers.get('cf-connecting-ip') || '';

    console.log('=== Notik Postback Received ===');
    console.log('All params:', Object.fromEntries(params.entries()));

    // Extract parameters
    const userId = params.get('user_id') || '';
    const txid = params.get('txn_id') || params.get('trans_id') || params.get('transaction_id') || '';
    let offerName = params.get('offer_name') || 'Notik Offer';
    // Use 'amount' for coins (not 'payout' which is USD)
    const amountStr = params.get('amount') || params.get('reward') || params.get('points') || '0';
    const payoutUsd = params.get('payout') || '0';
    const incomingHash = params.get('hash') || params.get('sig') || params.get('signature') || '';
    const userIp = params.get('conversion_ip') || params.get('ip') || clientIp || '';
    const country = params.get('country') || params.get('country_code') || 'Unknown';

    console.log('Parsed:', { userId, txid, offerName, amount: amountStr, payoutUsd, hasHash: !!incomingHash });

    // Validate required parameters
    if (!userId) {
      console.error('Missing user_id');
      return new Response('MISSING_USER_ID', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Signature verification
    if (NOTIK_SECRET_KEY) {
      if (!incomingHash) {
        console.error('Missing hash/signature');
        return new Response('SIGNATURE_MISMATCH', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      // Detect hash length: 40 = SHA1, 64 = SHA256
      const hashLen = incomingHash.length;
      const hashFn = hashLen <= 40 ? sha1Hash : sha256Hash;
      const hashName = hashLen <= 40 ? 'SHA1' : 'SHA256';

      // Try common signature formats
      const signatureFormats = [
        `${userId}${amountStr}${NOTIK_SECRET_KEY}`,
        `${userId}${payoutUsd}${NOTIK_SECRET_KEY}`,
        `${userId}${txid}${amountStr}${NOTIK_SECRET_KEY}`,
        `${txid}${userId}${amountStr}${NOTIK_SECRET_KEY}`,
        `${userId}${txid}${payoutUsd}${NOTIK_SECRET_KEY}`,
        `${txid}${payoutUsd}${NOTIK_SECRET_KEY}`,
        `${txid}${amountStr}${NOTIK_SECRET_KEY}`,
        `${NOTIK_SECRET_KEY}${userId}${amountStr}`,
        `${NOTIK_SECRET_KEY}${txid}${amountStr}`,
      ];

      let signatureValid = false;
      for (const format of signatureFormats) {
        const expected = await hashFn(format);
        if (expected.toLowerCase() === incomingHash.toLowerCase()) {
          signatureValid = true;
          console.log(`${hashName} signature verified with format: ${format.replace(NOTIK_SECRET_KEY, '***')}`);
          break;
        }
      }

      if (!signatureValid) {
        // Also try the other hash function as fallback
        const altHashFn = hashLen <= 40 ? sha256Hash : sha1Hash;
        for (const format of signatureFormats) {
          const expected = await altHashFn(format);
          if (expected.toLowerCase() === incomingHash.toLowerCase()) {
            signatureValid = true;
            console.log('Signature verified with alt hash');
            break;
          }
        }
      }

      if (!signatureValid) {
        console.error('Signature verification failed');
        console.error('Incoming hash:', incomingHash, `(${hashLen} chars)`);
        return new Response('SIGNATURE_MISMATCH', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
    } else {
      console.error('NOTIK_SECRET_KEY not configured');
      return new Response('CONFIG_ERROR', {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse coin amount from 'amount' field (not USD payout)
    let coinAmount = Math.round(parseFloat(amountStr) || 0);

    if (Math.abs(coinAmount) > MAX_PAYOUT) {
      console.error('Amount exceeds limit:', coinAmount);
      return new Response('PAYOUT_TOO_HIGH', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    if (coinAmount === 0) {
      console.error('Zero coin amount');
      return new Response('INVALID_REWARD', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    if (offerName.length > MAX_OFFER_NAME_LENGTH) {
      offerName = offerName.substring(0, MAX_OFFER_NAME_LENGTH);
    }

    // Supabase REST API
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    };

    // Check duplicate
    const transactionId = txid || `notik_${Date.now()}_${userId}`;
    if (txid) {
      const dupRes = await fetch(
        `${supabaseUrl}/rest/v1/completed_offers?transaction_id=eq.${encodeURIComponent(txid)}&select=id&limit=1`,
        { headers }
      );
      const dupData = await dupRes.json();
      if (dupData && dupData.length > 0) {
        console.log('Duplicate transaction');
        return new Response('DUP', {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
    }

    // Get user profile
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=username,balance&limit=1`,
      { headers }
    );
    const profileData = await profileRes.json();

    if (!profileData || profileData.length === 0) {
      console.error('User not found:', userId);
      return new Response('USER_NOT_FOUND', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const profile = profileData[0];

    // Update balance
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_balance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id_input: userId, amount_input: coinAmount }),
    });

    if (!rpcRes.ok) {
      const errText = await rpcRes.text();
      console.error('Balance update failed:', errText);
      return new Response('BALANCE_ERROR', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
    await rpcRes.text();

    // Insert completed offer
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/completed_offers`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        username: profile.username || userId,
        offer_name: offerName,
        offerwall: 'Notik',
        coin: coinAmount,
        transaction_id: transactionId,
        ip: userIp || null,
        country: country || 'Unknown',
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error('Insert failed:', errText);
    } else {
      await insertRes.text();
    }

    console.log(`Success: ${profile.username} credited ${coinAmount} coins via Notik`);

    return new Response('OK', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response('ERROR', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
