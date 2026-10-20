// ============================================================
// Remboursement d'un paiement Jèko.
// Jèko n'a pas d'API de remboursement pour les liens de paiement : on
// renvoie l'argent par un virement sortant (POST /partner_api/transfers)
// vers le compte Mobile Money qui a payé (counterpart* reçus par le webhook
// jeko-webhook et enregistrés dans payments.payment_data).
//
// Garde-fous contre un double remboursement :
//  * réclamation atomique : payment_data.refund n'est posé que si aucun
//    remboursement n'est en cours (ou si le précédent a échoué) ;
//  * référence de virement unique côté Jèko (refund-<id du paiement>) ;
//  * résultat incertain (réseau, 5xx, 409) : statut « needs_review », plus
//    aucune tentative automatique, vérification manuelle dans Jèko.
// ============================================================

import { getJekoCredentials } from "./jeko.ts";

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface JekoPayment {
  id: string;
  amount: number;
  payment_data: Record<string, unknown> | null;
}

export type JekoRefundOutcome =
  | { ok: true; transferId: string; transferStatus: string }
  | { ok: false; error: string };

// Moyen de paiement du webhook → moyen de virement (même convention que
// process-agency-payouts pour Orange Money).
const MOBILE_MONEY: Record<string, string> = {
  wave: "wave",
  orange: "orange_money",
  orange_money: "orange_money",
  mtn: "mtn",
  moov: "moov",
  djamo: "djamo",
};

const MANUAL_ERROR =
  "Ce paiement ne peut pas être remboursé automatiquement : contactez le support, notre équipe s'en charge.";

export async function sendJekoRefund(
  supabase: SupabaseClient,
  payment: JekoPayment,
  reason: string,
): Promise<JekoRefundOutcome> {
  const data = (payment.payment_data ?? {}) as Record<string, unknown>;
  const method = MOBILE_MONEY[String(data.payment_method ?? "").toLowerCase()];
  const number = String(data.counterpart_identifier ?? "").replace(/\s/g, "");
  const name = String(data.counterpart_label ?? "").trim() || "Client Bossiz";

  // Carte, virement bancaire, portefeuille Jèko ou paiement antérieur à
  // l'enregistrement du payeur : remboursement par l'équipe.
  if (!method || !/^\+[1-9]\d{7,14}$/.test(number)) {
    return { ok: false, error: MANUAL_ERROR };
  }

  const amountCents = Math.round(Number(payment.amount) * 100);
  const minimumCents = method === "moov" ? 10_000 : 500;
  if (!Number.isFinite(amountCents) || amountCents < minimumCents) {
    return { ok: false, error: MANUAL_ERROR };
  }

  const credentials = await getJekoCredentials(supabase);
  if (!credentials) {
    return { ok: false, error: "Remboursement indisponible pour le moment : contactez le support." };
  }

  // Réclamation atomique : un seul remboursement à la fois pour ce paiement
  const startedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("payments")
    .update({ payment_data: { ...data, refund: { status: "processing", started_at: startedAt, reason } } })
    .eq("id", payment.id)
    .eq("status", "completed")
    .or("payment_data->refund.is.null,payment_data->refund->>status.eq.failed")
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) {
    return { ok: false, error: "Un remboursement est déjà en cours pour ce paiement." };
  }

  const recordRefund = (refund: Record<string, unknown>) =>
    supabase
      .from("payments")
      .update({ payment_data: { ...data, refund: { ...refund, started_at: startedAt, reason } } })
      .eq("id", payment.id);

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
        name,
        paymentMethod: method,
        identifier: { number },
        amountCents,
        currency: "XOF",
        description: `Remboursement Bossiz+ - paiement ${payment.id.slice(0, 8)}`,
        reference: `refund-${payment.id}`,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    // Le virement est peut-être parti : on ne retente pas automatiquement.
    await recordRefund({ status: "needs_review", error: "Résultat réseau incertain" });
    return { ok: false, error: "Remboursement en cours de vérification : notre équipe vous recontacte." };
  }

  let transfer: Record<string, unknown> = {};
  try {
    transfer = await response.json();
  } catch {
    // corps vide ou non JSON : traité ci-dessous comme un refus
  }

  if (!response.ok || !transfer.id || !["pending", "success"].includes(String(transfer.status))) {
    const ambiguous = response.status === 409 || response.status >= 500;
    await recordRefund({
      status: ambiguous ? "needs_review" : "failed",
      error: `Jèko a refusé ou n'a pas confirmé le virement (HTTP ${response.status})`,
    });
    console.error("Remboursement Jèko non effectué:", payment.id, response.status, JSON.stringify(transfer).slice(0, 300));
    return {
      ok: false,
      error: ambiguous
        ? "Remboursement en cours de vérification : notre équipe vous recontacte."
        : "Le remboursement automatique a échoué : contactez le support.",
    };
  }

  await recordRefund({
    status: String(transfer.status),
    transfer_id: String(transfer.id),
    amount_xof: Number(payment.amount),
    destination: `${method} ${number.slice(0, 4)}…${number.slice(-2)}`,
  });
  return { ok: true, transferId: String(transfer.id), transferStatus: String(transfer.status) };
}
