import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * RadientWall Postback Endpoint
 * - Receives GET requests with: subId, transId, reward, signature
 * - Verifies signature: md5(subId + transId + reward + secret)
 * - Returns ONLY plain text: OK | DUP | ERROR...
 */

const textHeaders = { "Content-Type": "text/plain" };
const respond = (text: string, status = 200) =>
  new Response(text, { status, headers: textHeaders });

function stringifyError(e: unknown): string {
  if (e instanceof Error) return e.message || "ERROR";
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "ERROR";
  }
}

// MD5 hash function
async function md5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  try {
    // Log full incoming URL + params for debugging
    console.log("[radientwall-postback] Incoming:", req.method, req.url);
    const url = new URL(req.url);
    console.log(
      "[radientwall-postback] Params:",
      Object.fromEntries(url.searchParams.entries()),
    );

    if (req.method !== "GET") return respond("METHOD_NOT_ALLOWED", 200);

    const userId = url.searchParams.get("subId") ?? "";
    const transactionId = url.searchParams.get("transId") ?? "";
    const rewardRaw = url.searchParams.get("reward") ?? "";
    const signature = url.searchParams.get("signature") ?? "";

    if (!userId) return respond("MISSING_SUBID", 200);
    if (!transactionId) return respond("MISSING_TRANSID", 200);
    if (!rewardRaw) return respond("REWARD_MISSING", 200);

    // Signature verification: md5(subId + transId + reward + secret)
    const secretKey = Deno.env.get("RADIENTWALL_SECRET_KEY");
    if (!secretKey) return respond("SECRET_KEY_MISSING", 200);

    const expectedSig = await md5(userId + transactionId + rewardRaw + secretKey);
    if (signature.toLowerCase() !== expectedSig.toLowerCase()) {
      console.log("[radientwall-postback] Signature mismatch:", {
        received: signature,
        expected: expectedSig,
      });
      return respond("ERROR: Signature mismatch", 200);
    }

    const coins = Math.round(Number(rewardRaw));
    if (!Number.isFinite(coins)) return respond("INVALID_REWARD", 200);
    if (coins === 0) return respond("REWARD_MISSING", 200);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return respond("CONFIG_MISSING", 200);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Duplicate check (prevents double-crediting)
    const { data: existing, error: dupErr } = await supabase
      .from("completed_offers")
      .select("id")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (dupErr) throw dupErr;
    if (existing) return respond("DUP", 200);

    // Fetch username from profiles (fallback to subId if not found)
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    const username = profile?.username || userId;

    // Update balance
    const { error: balErr } = await supabase.rpc("increment_balance", {
      user_id_input: userId,
      amount_input: coins,
    });

    if (balErr) throw balErr;

    // Record the transaction
    const { error: insErr } = await supabase.from("completed_offers").insert({
      user_id: userId,
      username: username,
      offerwall: "RadientWall",
      coin: coins,
      transaction_id: transactionId,
      offer_name: "RadientWall Offer",
      country: "Unknown",
    });

    if (insErr) throw insErr;

    return respond("OK", 200);
  } catch (e) {
    const message = stringifyError(e);
    console.error("[radientwall-postback] ERROR:", message);
    return respond(message || "ERROR", 200);
  }
});

