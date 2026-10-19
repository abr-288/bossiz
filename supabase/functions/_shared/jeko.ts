// Intégration Jèko (jeko.africa) — passerelle de paiement Mobile Money /
// cartes bancaires pour la Côte d'Ivoire. Référence API :
// https://developer.jeko.africa/api-reference/liens-de-paiement/créer-un-lien-de-paiement
// https://developer.jeko.africa/fr/integration/webhooks/integration
//
// Flux retenu : "payment links" (POST /partner_api/payment_links). Le lien
// renvoyé (`link`) sert de payment_url, exactement comme cinetpayData.data.payment_url.
// La confirmation arrive via webhook (`transaction.completed`), jamais en
// synchrone : voir jeko-webhook/index.ts.

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

const JEKO_API_BASE = "https://api.jeko.africa/partner_api";

export interface JekoCredentials {
  api_key: string;
  api_key_id: string;
  store_id: string;
  webhook_secret?: string;
}

export async function getJekoCredentials(supabase: SupabaseClient): Promise<JekoCredentials | null> {
  try {
    const { data, error } = await supabase
      .from("integration_credentials")
      .select("credentials")
      .eq("provider", "jeko")
      .maybeSingle();

    if (error || !data?.credentials) return null;

    const { api_key, api_key_id, store_id } = data.credentials;
    if (!api_key || !api_key_id || !store_id) return null;

    return data.credentials as JekoCredentials;
  } catch {
    return null;
  }
}

export interface CreateJekoPaymentLinkParams {
  title: string;
  amountXof: number; // montant réel en XOF (pas encore converti en "cents")
  reference?: string;
}

export interface CreateJekoPaymentLinkResult {
  ok: true;
  id: string;
  link: string;
}

export async function createJekoPaymentLink(
  credentials: JekoCredentials,
  params: CreateJekoPaymentLinkParams
): Promise<CreateJekoPaymentLinkResult | { ok: false; error: string }> {
  const storeId = credentials.store_id.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId)) {
    return {
      ok: false,
      error: "Store ID Jèko invalide : renseignez l’UUID du magasin (format 8-4-4-4-12) dans Admin > Intégrations.",
    };
  }

  if (!Number.isFinite(params.amountXof) || params.amountXof < 100) {
    return { ok: false, error: "Le montant Jèko doit être d'au moins 100 XOF." };
  }

  // L'API Jèko exprime les montants en "amountCents" pour toutes les devises,
  // XOF y compris (confirmé par les exemples de la doc : 50000 amountCents
  // pour un exemple de paiement service). On applique donc ×100 comme pour
  // toute devise à 2 décimales dans leur schéma, même si le XOF n'a pas de
  // sous-unité dans l'usage courant.
  const amountCents = Math.round(params.amountXof * 100);

  // Contrainte documentée : title entre 10 et 255 caractères.
  const title = (params.title.length >= 10 ? params.title : `${params.title} - Réservation Bossiz+`)
    .trim()
    .slice(0, 255);

  const response = await fetch(`${JEKO_API_BASE}/payment_links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": credentials.api_key,
      "X-API-KEY-ID": credentials.api_key_id,
    },
    body: JSON.stringify({
      storeId,
      title,
      amountCents,
      currency: "XOF",
      allowMultiplePayments: false,
    }),
  });

  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: `Réponse Jèko non-JSON: ${text.slice(0, 200)}` };
  }

  if (!response.ok || !data?.link || !data?.id) {
    // Preserve Jèko's validation details (for example, the rejected field on
    // HTTP 422) so process-payment logs explain why the provider refused the
    // request. Never include request headers, which contain API credentials.
    const providerDetails = data?.errors ?? data?.details ?? data?.message ?? data?.error;
    const details = typeof providerDetails === "string"
      ? providerDetails
      : providerDetails != null
        ? JSON.stringify(providerDetails)
        : "";
    const suffix = details ? `: ${details.slice(0, 1000)}` : "";
    return { ok: false, error: `Erreur Jèko (HTTP ${response.status})${suffix}` };
  }

  return { ok: true, id: data.id, link: data.link };
}

// Vérifie la signature HMAC-SHA256 du webhook Jèko. IMPORTANT : `rawBody`
// doit être le texte brut de la requête (avant JSON.parse), sinon la
// signature ne correspondra jamais (voir doc "raw body").
export async function verifyJekoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): Promise<boolean> {
  if (!signatureHeader || !webhookSecret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparaison à temps constant.
  if (computedHex.length !== signatureHeader.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computedHex.length; i++) {
    mismatch |= computedHex.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return mismatch === 0;
}
