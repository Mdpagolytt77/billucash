import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * RadientWall Postback Endpoint
 * - Receives GET requests with: subId, transId, reward
 * - Returns ONLY plain text: OK | DUP | ERROR (no JSON)
 */
serve(async (req) => {
  try {
    // Log full incoming URL + params for debugging
    console.log("[radientwall-postback] Incoming:", req.method, req.url);
    const url = new URL(req.url);
    console.log(
      "[radientwall-postback] Params:",
      Object.fromEntries(url.searchParams.entries()),
    );

    if (req.method !== "GET") return new Response("METHOD_NOT_ALLOWED");

    const userId = url.searchParams.get("subId") ?? "";
    const transactionId = url.searchParams.get("transId") ?? "";
    const rewardRaw = url.searchParams.get("reward");

    if (!userId) return new Response("MISSING_SUBID");
    if (!transactionId) return new Response("MISSING_TRANSID");

    // Reward check requested by user
    if (!rewardRaw) return new Response("REWARD_MISSING");

    const coins = Math.round(Number(rewardRaw));
    if (!Number.isFinite(coins)) return new Response("INVALID_REWARD");
    if (coins === 0) return new Response("REWARD_MISSING");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response("CONFIG_MISSING");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Duplicate check (prevents double-crediting)
    const { data: existing, error: dupErr } = await supabase
      .from("completed_offers")
      .select("id")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (dupErr) throw dupErr;
    if (existing) return new Response("DUP");

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

    return new Response("OK");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[radientwall-postback] ERROR:", message);
    return new Response(message || "ERROR");
  }
});

