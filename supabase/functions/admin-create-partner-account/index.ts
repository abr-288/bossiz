import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";

// ============================================================
// EDGE FUNCTION: admin-create-partner-account
// Used by the admin "Créer une agence" flow (AdminAgencies.tsx) when a
// partner application's contact_email has no B-Reserve account yet.
// Instead of asking the candidate to sign up first, an admin creates the
// account here and the candidate receives an email with a link to choose
// their own password (Supabase "recovery" link -> /reset-password). No
// password is ever generated for, or sent to, anyone.
// Idempotent: if the email already has an account, that account is returned.
// Admin-only (same check as admin-list-users).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://app.bossiz.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non autorisé" }, 401);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Non authentifié" }, 401);

    const { data: rolesData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");
    if (!rolesData || rolesData.length === 0) {
      return json({ error: "Accès refusé - Admin requis" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.fullName ?? "").trim().slice(0, 120);
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return json({ error: "Adresse email invalide" }, 400);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Compte déjà existant : on le réutilise sans rien envoyer.
    // (les emails ne vivent que dans auth.users, pas dans profiles)
    let existingId: string | null = null;
    for (let page = 1; page <= 25 && !existingId; page++) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      existingId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      if (data.users.length < 200) break;
    }
    if (existingId) {
      return json({ success: true, userId: existingId, created: false, emailSent: false });
    }

    // Le trigger handle_new_user crée la ligne profiles à partir de full_name.
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError || !created?.user) {
      console.error("createUser error:", createError?.message);
      return json({ error: "Impossible de créer le compte" }, 500);
    }

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${SITE_URL}/reset-password` },
    });
    const actionLink = linkData?.properties?.action_link;
    if (linkError || !actionLink) {
      console.error("generateLink error:", linkError?.message);
      return json({ success: true, userId: created.user.id, created: true, emailSent: false });
    }

    const result = await sendEmail(adminClient, {
      from: "B-Reserve Partenaires <partenaires@bossiz.com>",
      to: [email],
      subject: "Votre compte partenaire B-Reserve est prêt",
      html: emailHtml(fullName, actionLink),
    });
    if (!result.ok) console.error("Account email error:", result.error);

    // Si l'email n'a pas pu partir, on rend le lien à l'admin (déjà de
    // confiance) pour qu'il le transmette lui-même (WhatsApp, etc.).
    return json({
      success: true,
      userId: created.user.id,
      created: true,
      emailSent: result.ok,
      ...(result.ok ? {} : { setupLink: actionLink }),
    });
  } catch (error) {
    console.error("admin-create-partner-account error:", error);
    return json({ error: "Erreur interne du serveur" }, 500);
  }
});

function emailHtml(name: string, link: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0; font-size: 20px;">Bienvenue chez B-Reserve</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Bonjour${name ? ` ${escapeHtml(name)}` : ""},</p>
          <p>Suite à votre candidature partenaire, nous avons créé votre compte B-Reserve avec cette adresse email.</p>
          <p>Cliquez sur le bouton ci-dessous pour choisir votre mot de passe et accéder à votre espace :</p>
          <p style="text-align:center; margin: 28px 0;">
            <a href="${escapeHtml(link)}" style="background:#0b3d5c; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Choisir mon mot de passe</a>
          </p>
          <p style="font-size: 13px; color:#666;">Ce lien est à usage unique et expire au bout d'un certain temps. S'il a expiré, utilisez « Mot de passe oublié » sur ${SITE_URL}/auth. Si vous n'êtes pas à l'origine de cette candidature, ignorez cet email.</p>
          <p style="margin-top: 24px;">L'équipe B-Reserve</p>
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
