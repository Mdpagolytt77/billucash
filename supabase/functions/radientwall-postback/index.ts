import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * RadientWall Postback Endpoint
 * - Receives GET requests with: subId, transId, reward
 * - Returns ONLY plain text: OK | DUP | ERROR (no JSON)
 */
serve(async (req) => {
  try {
    if (req.method !== "GET") return new Response("ERROR");

    const url = new URL(req.url);

    const userId = url.searchParams.get("subId") ?? "";
    const transactionId = url.searchParams.get("transId") ?? "";
    const rewardRaw = url.searchParams.get("reward") ?? "";

    if (!userId || !transactionId || !rewardRaw) return new Response("ERROR");

    const coins = Math.round(Number(rewardRaw));
    if (!Number.isFinite(coins)) return new Response("ERROR");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) return new Response("ERROR");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Duplicate check (prevents double-crediting)
    const { data: existing, error: dupErr } = await supabase
      .from("completed_offers")
      .select("id")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (dupErr) return new Response("ERROR");
    if (existing) return new Response("DUP");

    // Update balance
    const { error: balErr } = await supabase.rpc("increment_balance", {
      user_id_input: userId,
      amount_input: coins,
    });

    if (balErr) return new Response("ERROR");

    // Record the transaction
    const { error: insErr } = await supabase.from("completed_offers").insert({
      user_id: userId,
      offerwall: "RadientWall",
      coin: coins,
      transaction_id: transactionId,
      offer_name: "RadientWall Offer",
      country: "Unknown",
    });

    if (insErr) return new Response("ERROR");

    return new Response("OK");
  } catch (_e) {
    return new Response("ERROR");
  }
});
