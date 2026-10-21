import { sendEmail } from "./integrations.ts";
import { renderEmailTemplate } from "./emailTemplates.ts";

// Création du compte partenaire et email d'approbation, partagés entre la
// validation manuelle (admin-create-partner-account, send-partner-approved)
// et la validation automatique (auto-approve-partner-applications).
// Toujours appelés avec un client service-role.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = (Deno.env.get("SITE_URL") || "https://app.bossiz.com").replace(/\/+$/, "");
const FROM = "Bossiz+ Partenaires <partenaires@bossiz.com>";

export interface PartnerAccountResult {
  userId: string;
  created: boolean;
  emailSent: boolean;
  setupLink?: string;
}

// Lien vers /reset-password avec le jeton haché (vérifié à la validation du
// mot de passe) : le lien Supabase /verify était consommé par les robots qui
// analysent les liens des e-mails. undefined si la génération échoue.
async function createSetupLink(adminClient: SupabaseClient, email: string): Promise<string | undefined> {
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${SITE_URL}/reset-password` },
  });
  const hashedToken = linkData?.properties?.hashed_token;
  if (linkError || !hashedToken) {
    console.error("generateLink error:", linkError?.message);
    return undefined;
  }
  return `${SITE_URL}/reset-password?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`;
}

export interface FindOrCreateOptions {
  // false : aucun e-mail « compte prêt » ; le lien pour choisir le mot de passe
  // est renvoyé (setupLink) pour être intégré à l'e-mail de confirmation
  // (validation automatique : un seul e-mail après la validation).
  sendSetupEmail?: boolean;
}

// Compte existant (même email) : réutilisé sans rien envoyer. Sinon le compte
// est créé et le candidat reçoit un lien pour choisir son mot de passe
// (aucun mot de passe n'est généré ni envoyé). Renvoie null si la création
// échoue.
export async function findOrCreatePartnerAccount(
  adminClient: SupabaseClient,
  email: string,
  fullName: string,
  { sendSetupEmail = true }: FindOrCreateOptions = {},
): Promise<PartnerAccountResult | null> {
  // Les emails ne vivent que dans auth.users, pas dans profiles.
  let existing: { id: string; last_sign_in_at?: string | null } | null = null;
  for (let page = 1; page <= 25 && !existing; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    existing = data.users.find((u: { email?: string }) => u.email?.toLowerCase() === email) ?? null;
    if (data.users.length < 200) break;
  }
  if (existing) {
    // Compte jamais utilisé (créé par une tentative précédente, par exemple) :
    // l'e-mail de confirmation doit permettre de choisir le mot de passe.
    const setupLink = !sendSetupEmail && !existing.last_sign_in_at ? await createSetupLink(adminClient, email) : undefined;
    return { userId: existing.id, created: false, emailSent: false, ...(setupLink ? { setupLink } : {}) };
  }

  // Le trigger handle_new_user crée la ligne profiles à partir de full_name.
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created?.user) {
    console.error("createUser error:", createError?.message);
    return null;
  }

  const actionLink = await createSetupLink(adminClient, email);
  if (!actionLink) {
    return { userId: created.user.id, created: true, emailSent: false };
  }
  if (!sendSetupEmail) {
    return { userId: created.user.id, created: true, emailSent: false, setupLink: actionLink };
  }

  const vars = {
    ownerGreeting: fullName ? ` ${fullName}` : "",
    setupLink: actionLink,
    year: String(new Date().getFullYear()),
  };
  const rendered = await renderEmailTemplate(adminClient, "partner_account_ready", vars);

  const result = await sendEmail(adminClient, {
    from: FROM,
    to: [email],
    subject: rendered?.subject ?? "Votre compte partenaire Bossiz+ est prêt",
    html: rendered?.html ?? accountReadyHtml(fullName, actionLink),
  });
  if (!result.ok) console.error("Account email error:", result.error);

  return {
    userId: created.user.id,
    created: true,
    emailSent: result.ok,
    ...(result.ok ? {} : { setupLink: actionLink }),
  };
}

// Relit l'agence par id, retrouve l'email de connexion du propriétaire
// (agencies.contact_email est un contact commercial, pas forcément l'email
// du compte) et envoie l'email de bienvenue. Avec setupLink (nouveau compte,
// validation automatique), le bouton mène au choix du mot de passe.
// null : agence introuvable.
export async function sendPartnerApprovedEmail(
  adminClient: SupabaseClient,
  agencyId: string,
  { setupLink }: { setupLink?: string } = {},
): Promise<{ emailSent: boolean } | null> {
  const { data: agency, error: fetchError } = await adminClient
    .from("agencies")
    .select("id, name, owner_id")
    .eq("id", agencyId)
    .single();

  if (fetchError || !agency) {
    console.error("Agency not found:", fetchError?.message);
    return null;
  }

  const { data: ownerData, error: ownerError } = await adminClient.auth.admin.getUserById(agency.owner_id);
  const ownerEmail = ownerData?.user?.email;
  if (ownerError || !ownerEmail) {
    console.error("Agency owner has no email:", ownerError?.message);
    return { emailSent: false };
  }
  const ownerName = (ownerData.user.user_metadata?.full_name as string | undefined) || "";

  const vars = {
    ownerGreeting: ownerName ? ` ${ownerName}` : "",
    agencyName: agency.name,
    loginLink: setupLink ?? `${SITE_URL}/auth`,
    year: String(new Date().getFullYear()),
  };
  const rendered = await renderEmailTemplate(adminClient, "partner_approved", vars);

  const result = await sendEmail(adminClient, {
    from: FROM,
    to: [ownerEmail],
    subject: rendered?.subject ?? "Votre candidature est approuvée - Bienvenue chez Bossiz+",
    html: rendered?.html ?? approvedHtml(agency.name, ownerName, setupLink),
  });

  if (!result.ok && result.error !== "RESEND_API_KEY not configured") {
    console.error("Partner approval email error:", result.error);
  }

  return { emailSent: result.ok };
}

function accountReadyHtml(name: string, link: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0; font-size: 20px;">Bienvenue chez Bossiz+</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Bonjour${name ? ` ${escapeHtml(name)}` : ""},</p>
          <p>Suite à votre candidature partenaire, nous avons créé votre compte Bossiz+ avec cette adresse email.</p>
          <p>Cliquez sur le bouton ci-dessous pour choisir votre mot de passe et accéder à votre espace :</p>
          <p style="text-align:center; margin: 28px 0;">
            <a href="${escapeHtml(link)}" style="background:#0b3d5c; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Choisir mon mot de passe</a>
          </p>
          <p style="font-size: 13px; color:#666;">Ce lien est à usage unique et expire au bout d'un certain temps. S'il a expiré, utilisez « Mot de passe oublié » sur ${SITE_URL}/auth. Si vous n'êtes pas à l'origine de cette candidature, ignorez cet email.</p>
          <p style="margin-top: 24px;">L'équipe Bossiz+</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function approvedHtml(agencyName: string, ownerName: string, setupLink?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0; font-size: 20px;">Félicitations, vous êtes partenaire !</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Bonjour${ownerName ? ` ${escapeHtml(ownerName)}` : ""},</p>
          <p>Votre candidature partenaire a été étudiée et approuvée : <strong>${escapeHtml(agencyName)}</strong> est maintenant un partenaire actif de Bossiz+.</p>
          <p>Vous pouvez dès à présent accéder à votre espace agence pour gérer vos offres, tarifs et réservations.</p>
          ${setupLink ? `<p>Votre compte Bossiz+ a été créé avec cette adresse e-mail : le bouton ci-dessous vous permet de choisir votre mot de passe.</p>` : ""}
          <p style="text-align:center; margin: 28px 0;">
            <a href="${escapeHtml(setupLink ?? `${SITE_URL}/auth`)}" style="background:#0b3d5c; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">${setupLink ? "Choisir mon mot de passe" : "Accéder à mon espace agence"}</a>
          </p>
          <p style="margin-top: 24px;">Bienvenue,<br/>L'équipe Bossiz+</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
