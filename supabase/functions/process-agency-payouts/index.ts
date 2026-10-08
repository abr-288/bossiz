import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getJekoCredentials } from "../_shared/jeko.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Payout configuration is missing Supabase credentials");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    const isInternalCall = token === serviceRoleKey;

    let userId: string | null = null;
    if (!isInternalCall) {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return jsonResponse({ error: "Unauthorized" }, 401);
      userId = data.user.id;
    }

    const body = await req.json();
    const agencyId = body?.agencyId;
    const commissionId = body?.commissionId;
    if (!uuidPattern.test(agencyId || "") || (commissionId && !uuidPattern.test(commissionId))) {
      return jsonResponse({ error: "Invalid agency or commission ID" }, 400);
    }

    if (!isInternalCall && userId) {
      const [{ data: isAdmin }, { data: isAgencyOwner }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        supabase.rpc("is_agency_owner", { _user_id: userId, _agency_id: agencyId }),
      ]);
      if (!isAdmin && !isAgencyOwner) return jsonResponse({ error: "Forbidden" }, 403);
    }

    if (Deno.env.get("JEKO_PAYOUTS_ENABLED") !== "true") {
      return jsonResponse({ success: true, initiated: false, reason: "payouts_disabled" });
    }

    const { data: destination, error: destinationError } = await supabase
      .from("agency_payout_details")
      .select("*")
      .eq("agency_id", agencyId)
      .maybeSingle();
    if (destinationError) {
      console.error("Could not load agency payout destination:", destinationError.message);
      return jsonResponse({ error: "Could not load payout destination" }, 500);
    }
    if (!destination) {
      const { error: waitingError } = await supabase
        .from("commissions")
        .update({ payout_status: "awaiting_details", payout_error: null })
        .eq("agency_id", agencyId)
        .eq("payout_status", "ready");
      if (waitingError) {
        console.error("Could not mark payouts as awaiting details:", waitingError.message);
        return jsonResponse({ error: "Could not update payout status" }, 500);
      }
      return jsonResponse({ success: true, initiated: false, reason: "destination_missing" });
    }

    let duePayoutsQuery = supabase
      .from("commissions")
      .update({ payout_status: "ready", payout_error: null })
      .eq("agency_id", agencyId)
      .eq("status", "pending")
      .eq("payout_status", "awaiting_details")
      .not("payout_due_at", "is", null);
    if (commissionId) duePayoutsQuery = duePayoutsQuery.eq("id", commissionId);
    const { error: readyError } = await duePayoutsQuery;
    if (readyError) {
      console.error("Could not ready agency payouts:", readyError.message);
      return jsonResponse({ error: "Could not ready payouts" }, 500);
    }

    const beneficiaryName = String(destination.beneficiary_name || "").trim();
    const paymentMethod = destination.payment_method;
    let identifier: Record<string, string>;
    if (["wave", "orange_money", "mtn", "moov", "djamo"].includes(paymentMethod)) {
      const number = String(destination.mobile_money_number || "").trim();
      if (!beneficiaryName || !/^\+[1-9]\d{7,14}$/.test(number)) {
        const { error: waitingError } = await supabase
          .from("commissions")
          .update({ payout_status: "awaiting_details", payout_error: null })
          .eq("agency_id", agencyId)
          .eq("payout_status", "ready");
        if (waitingError) {
          console.error("Could not mark payouts as awaiting details:", waitingError.message);
          return jsonResponse({ error: "Could not update payout status" }, 500);
        }
        return jsonResponse({ success: true, initiated: false, reason: "destination_incomplete" });
      }
      identifier = { number };
    } else if (paymentMethod === "bank") {
      const bank = destination.bank_details || {};
      const requiredFields = ["bankName", "bankCode", "swiftCode", "agencyCode", "accountNumber", "key"];
      if (!beneficiaryName || requiredFields.some((field) => !String(bank[field] || "").trim())) {
        const { error: waitingError } = await supabase
          .from("commissions")
          .update({ payout_status: "awaiting_details", payout_error: null })
          .eq("agency_id", agencyId)
          .eq("payout_status", "ready");
        if (waitingError) {
          console.error("Could not mark payouts as awaiting details:", waitingError.message);
          return jsonResponse({ error: "Could not update payout status" }, 500);
        }
        return jsonResponse({ success: true, initiated: false, reason: "destination_incomplete" });
      }
      identifier = Object.fromEntries(requiredFields.map((field) => [field, String(bank[field]).trim()]));
    } else {
      return jsonResponse({ error: "Unsupported payout method" }, 422);
    }

    let commissionsQuery = supabase
      .from("commissions")
      .select("id, agency_id, commission_amount, payout_status, payout_reference")
      .eq("agency_id", agencyId)
      .eq("status", "pending")
      .eq("payout_status", "ready");
    if (commissionId) commissionsQuery = commissionsQuery.eq("id", commissionId);

    const { data: commissions, error: commissionError } = await commissionsQuery;
    if (commissionError) {
      console.error("Could not load due agency payouts:", commissionError.message);
      return jsonResponse({ error: "Could not load payouts" }, 500);
    }
    if (!commissions?.length) return jsonResponse({ success: true, initiated: false, reason: "nothing_ready" });

    const credentials = await getJekoCredentials(supabase);
    if (!credentials) {
      const { error: configurationError } = await supabase
        .from("commissions")
        .update({ payout_status: "failed", payout_error: "Configuration Jèko incomplète" })
        .eq("agency_id", agencyId)
        .eq("payout_status", "ready");
      if (configurationError) {
        console.error("Could not record missing Jèko credentials:", configurationError.message);
        return jsonResponse({ error: "Could not record payout status" }, 500);
      }
      return jsonResponse({ error: "Jèko payout credentials are not configured" }, 503);
    }

    const results: Array<{ commissionId: string; status: string }> = [];
    for (const commission of commissions) {
      const amountXof = Number(commission.commission_amount);
      const amountCents = Math.round(amountXof * 100);
      const minAmountCents = paymentMethod === "bank" ? 2_000_000 : paymentMethod === "moov" ? 10_000 : 500;
      if (!Number.isFinite(amountCents) || amountCents < minAmountCents) {
        const { error: minimumError } = await supabase
          .from("commissions")
          .update({ payout_status: "failed", payout_error: "Montant inférieur au minimum Jèko pour ce moyen de paiement" })
          .eq("id", commission.id)
          .eq("payout_status", "ready");
        if (minimumError) {
          console.error("Could not record payout minimum error:", minimumError.message);
          return jsonResponse({ error: "Could not record payout status" }, 500);
        }
        results.push({ commissionId: commission.id, status: "failed_minimum_amount" });
        continue;
      }

      const { data: claimed, error: claimError } = await supabase.rpc("claim_agency_payout", {
        p_commission_id: commission.id,
      });
      if (claimError) {
        console.error("Could not claim payout:", claimError.message);
        return jsonResponse({ error: "Could not claim payout" }, 500);
      }
      if (!claimed) continue;

      const reference = commission.payout_reference || `bossiz-${commission.id}`;
      let response: Response;
      try {
        response = await fetch("https://api.jeko.africa/partner_api/transfers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": credentials.api_key,
            "X-API-KEY-ID": credentials.api_key_id,
          },
          body: JSON.stringify({
            storeId: credentials.store_id,
            name: beneficiaryName,
            paymentMethod,
            identifier,
            amountCents,
            currency: "XOF",
            description: `Reversement agence Bossiz - ${commission.id}`,
            reference,
          }),
          signal: AbortSignal.timeout(20_000),
        });
      } catch {
        await supabase
          .from("commissions")
          .update({
            payout_status: "needs_review",
            payout_error: "Résultat réseau incertain; vérifier le transfert Jèko avant toute nouvelle tentative",
          })
          .eq("id", commission.id);
        results.push({ commissionId: commission.id, status: "needs_review" });
        continue;
      }

      let transfer: Record<string, any>;
      try {
        transfer = await response.json();
      } catch {
        transfer = {};
      }

      if (!response.ok || !transfer.id || !["pending", "success"].includes(transfer.status)) {
        const ambiguous = response.status === 409 || response.status >= 500;
        const { error: transferError } = await supabase
          .from("commissions")
          .update({
            payout_status: ambiguous ? "needs_review" : "failed",
            payout_error: `Jèko a refusé ou n’a pas confirmé le transfert (HTTP ${response.status})`,
          })
          .eq("id", commission.id);
        if (transferError) {
          console.error("Could not record Jèko transfer failure:", transferError.message);
          return jsonResponse({ error: "Could not record transfer result" }, 500);
        }
        results.push({ commissionId: commission.id, status: ambiguous ? "needs_review" : "failed" });
        continue;
      }

      const paid = transfer.status === "success";
      const { error: updateError } = await supabase
        .from("commissions")
        .update({
          payout_status: paid ? "paid" : "processing",
          payout_provider_id: String(transfer.id),
          payout_error: null,
          ...(paid ? { status: "paid", paid_at: new Date().toISOString() } : {}),
        })
        .eq("id", commission.id);

      if (updateError) {
        console.error("Jèko transfer created but payout ledger update failed:", commission.id, updateError.message);
        return jsonResponse({ error: "Transfer created; ledger update requires reconciliation" }, 500);
      }
      results.push({ commissionId: commission.id, status: paid ? "paid" : "processing" });
    }

    return jsonResponse({ success: true, payouts: results });
  } catch (error) {
    console.error("Agency payout processing failed:", error instanceof Error ? error.message : "Unknown error");
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
