import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * RadientWall Postback Endpoint
 * - Receives GET requests with: subId, transId, reward
 * - Returns ONLY plain text: OK | DUP | ...debug strings (no JSON)
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
    const rewardRaw = url.searchParams.get("reward");

    if (!userId) return respond("MISSING_SUBID", 200);
    if (!transactionId) return respond("MISSING_TRANSID", 200);

    // Reward check requested by user
    if (!rewardRaw) return respond("REWARD_MISSING", 200);

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

    // Update balance
    const { error: balErr } = await supabase.rpc("increment_balance", {
      user_id_input: userId,
      amount_input: coins,
    });

    if (balErr) throw balErr;

    // Record the transaction
    const { error: insErr } = await supabase.from("completed_offers").insert({
      user_id: userId,
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

