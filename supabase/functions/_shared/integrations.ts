// Résout les identifiants de prestataires (email, SMS) en priorisant les
// clés saisies par l'admin dans la table `integration_credentials`, avec
// repli sur les secrets d'environnement (supabase secrets set) si la table
// n'existe pas encore ou n'a pas de ligne active pour le prestataire demandé.
//
// Usage: import { getResendApiKey, sendEmailViaResend, getActiveSmsCredential, sendSms } from "../_shared/integrations.ts";

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

interface IntegrationRow {
  provider: string;
  category: string;
  credentials: Record<string, string>;
  is_active: boolean;
}

async function getActiveCredentialByCategory(
  supabase: SupabaseClient,
  category: "email" | "sms" | "payment"
): Promise<IntegrationRow | null> {
  try {
    const { data, error } = await supabase
      .from("integration_credentials")
      .select("provider, category, credentials, is_active")
      .eq("category", category)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      // Table absente (migration pas encore appliquée) ou autre erreur : on
      // se rabat silencieusement sur les secrets d'environnement.
      return null;
    }
    return data as IntegrationRow | null;
  } catch {
    return null;
  }
}

export async function getResendApiKey(supabase: SupabaseClient): Promise<string | undefined> {
  const active = await getActiveCredentialByCategory(supabase, "email");
  if (active?.provider === "resend" && active.credentials?.api_key) {
    return active.credentials.api_key;
  }
  return Deno.env.get("RESEND_API_KEY") ?? undefined;
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64
}

export interface SendEmailParams {
  from?: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmailViaResend(
  supabase: SupabaseClient,
  params: SendEmailParams
): Promise<{ ok: boolean; error?: string }> {
  const resendApiKey = await getResendApiKey(supabase);

  if (!resendApiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: params.from || "B-Reserve <noreply@bossiz.com>",
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.text ? { text: params.text } : {}),
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      ...(params.attachments ? { attachments: params.attachments } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, error: `Resend API error: ${response.status} ${errorText}` };
  }

  return { ok: true };
}

export async function getActiveSmsCredential(supabase: SupabaseClient): Promise<IntegrationRow | null> {
  return getActiveCredentialByCategory(supabase, "sms");
}

// Point d'entrée unique pour l'envoi d'email transactionnel : dispatche vers
// le prestataire actif (Resend ou SMTP générique, voir /admin/integrations).
// Tous les Edge Functions d'envoi d'email doivent utiliser CETTE fonction
// plutôt que d'appeler Resend directement, sinon activer SMTP dans l'admin
// ne changerait rien pour eux.
export async function sendEmail(
  supabase: SupabaseClient,
  params: SendEmailParams
): Promise<{ ok: boolean; error?: string }> {
  const active = await getActiveCredentialByCategory(supabase, "email");

  if (
    active?.provider === "smtp" &&
    active.credentials?.host &&
    active.credentials?.username &&
    active.credentials?.password &&
    active.credentials?.from
  ) {
    const { sendEmailViaSmtp } = await import("./smtp.ts");
    return sendEmailViaSmtp(active.credentials as any, params);
  }

  return sendEmailViaResend(supabase, params);
}

// Retourne 'jeko' uniquement si Jèko est explicitement actif ET que ses
// identifiants sont complets. Dans tous les autres cas (table absente,
// aucune ligne active, ligne active = cinetpay, ou Jèko activé sans clés
// renseignées), on retombe sur 'cinetpay' — comportement historique inchangé,
// piloté par les secrets d'Edge Function CINETPAY_API_KEY / CINETPAY_SITE_ID.
export async function getActivePaymentProvider(supabase: SupabaseClient): Promise<"cinetpay" | "jeko"> {
  const active = await getActiveCredentialByCategory(supabase, "payment");
  if (
    active?.provider === "jeko" &&
    active.credentials?.api_key &&
    active.credentials?.api_key_id &&
    active.credentials?.store_id
  ) {
    return "jeko";
  }
  return "cinetpay";
}

// CinetPay a un repli légitime sur les secrets d'Edge Function existants :
// contrairement à Resend/SMS/Jèko, ses identifiants fonctionnent déjà en
// production via CINETPAY_API_KEY / CINETPAY_SITE_ID. La table permet juste
// de les remplacer sans repasser par la CLI, mais reste facultative.
export async function getCinetPayCredentials(
  supabase: SupabaseClient
): Promise<{ apiKey: string; siteId: string } | null> {
  let tableApiKey: string | undefined;
  let tableSiteId: string | undefined;

  try {
    const { data, error } = await supabase
      .from("integration_credentials")
      .select("credentials")
      .eq("provider", "cinetpay")
      .maybeSingle();

    if (!error && data?.credentials) {
      tableApiKey = data.credentials.api_key;
      tableSiteId = data.credentials.site_id;
    }
  } catch {
    // Table absente (migration pas encore appliquée) ou autre erreur : on
    // se rabat silencieusement sur les secrets d'environnement.
  }

  const apiKey = tableApiKey || Deno.env.get("CINETPAY_API_KEY");
  const siteId = tableSiteId || Deno.env.get("CINETPAY_SITE_ID");

  if (!apiKey || !siteId) return null;
  return { apiKey, siteId };
}

export async function sendSms(
  supabase: SupabaseClient,
  params: { to: string; message: string }
): Promise<{ ok: boolean; error?: string }> {
  const active = await getActiveSmsCredential(supabase);

  if (!active) {
    return { ok: false, error: "No active SMS provider configured in integration_credentials" };
  }

  const { provider, credentials } = active;

  try {
    if (provider === "twilio") {
      const { account_sid, auth_token, from_number } = credentials;
      if (!account_sid || !auth_token || !from_number) {
        return { ok: false, error: "Twilio credentials incomplete" };
      }
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${btoa(`${account_sid}:${auth_token}`)}`,
          },
          body: new URLSearchParams({ To: params.to, From: from_number, Body: params.message }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, error: `Twilio API error: ${response.status} ${errorText}` };
      }
      return { ok: true };
    }

    if (provider === "orange_sms_ci") {
      const { client_id, client_secret, sender_name } = credentials;
      if (!client_id || !client_secret) {
        return { ok: false, error: "Orange SMS API credentials incomplete" };
      }
      const tokenResponse = await fetch("https://api.orange.com/oauth/v3/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${btoa(`${client_id}:${client_secret}`)}`,
        },
        body: "grant_type=client_credentials",
      });
      if (!tokenResponse.ok) {
        return { ok: false, error: `Orange OAuth error: ${tokenResponse.status}` };
      }
      const { access_token } = await tokenResponse.json();
      const smsResponse = await fetch(
        `https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B${encodeURIComponent(sender_name || "BOSSIZ")}/requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            outboundSMSMessageRequest: {
              address: [`tel:+${params.to.replace(/\D/g, "")}`],
              senderAddress: `tel:+225${sender_name || "BOSSIZ"}`,
              outboundSMSTextMessage: { message: params.message },
            },
          }),
        }
      );
      if (!smsResponse.ok) {
        const errorText = await smsResponse.text();
        return { ok: false, error: `Orange SMS API error: ${smsResponse.status} ${errorText}` };
      }
      return { ok: true };
    }

    if (provider === "africastalking") {
      const { username, api_key, sender_id } = credentials;
      if (!username || !api_key) {
        return { ok: false, error: "Africa's Talking credentials incomplete" };
      }
      const response = await fetch("https://api.africastalking.com/version1/messaging", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "apiKey": api_key,
        },
        body: new URLSearchParams({
          username,
          to: params.to,
          message: params.message,
          ...(sender_id ? { from: sender_id } : {}),
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, error: `Africa's Talking API error: ${response.status} ${errorText}` };
      }
      return { ok: true };
    }

    return { ok: false, error: `Unknown SMS provider: ${provider}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown SMS error" };
  }
}
