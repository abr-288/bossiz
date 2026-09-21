import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";
import { getClientIP, checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";

// ============================================================
// EDGE FUNCTION: send-password-reset
// Replaces supabase.auth.resetPasswordForEmail() (ForgotPassword.tsx and
// Auth.tsx). That call goes through Supabase Auth's own mailer, which is
// rate-limited and only delivers to team members unless a custom SMTP is
// configured in the Supabase dashboard. Here we generate the recovery link
// with the Auth admin API and send it through the site's own email provider
// (/admin/integrations), like every other transactional email.
//
// Anti-abuse / privacy:
//  - always answers { success: true } whether or not the account exists
//    (no account enumeration);
//  - per-IP and per-email rate limits (the per-email limit is silent so
//    it can't be used to probe or to mail-bomb an inbox);
//  - the link always targets SITE_URL and an allow-listed path - the client
//    can't choose an arbitrary redirect (no phishing via our own email).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://app.bossiz.com";
const ALLOWED_REDIRECT_PATHS = ["/reset-password", "/auth"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const IP_LIMIT = { windowMs: 15 * 60 * 1000, maxRequests: 10, keyPrefix: "pwreset-ip" };
const EMAIL_LIMIT = { windowMs: 60 * 60 * 1000, maxRequests: 3, keyPrefix: "pwreset-email" };

const ok = () =>
  new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ipResult = checkRateLimit(getClientIP(req), IP_LIMIT);
    if (!ipResult.allowed) return createRateLimitResponse(ipResult, IP_LIMIT, corsHeaders);

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return new Response(JSON.stringify({ error: "Adresse email invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const redirectPath = ALLOWED_REDIRECT_PATHS.includes(body.redirectPath)
      ? body.redirectPath
      : "/reset-password";

    // Silent per-email throttle: same answer as a normal request.
    if (!checkRateLimit(email, EMAIL_LIMIT).allowed) return ok();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${SITE_URL}${redirectPath}` },
    });

    const actionLink = data?.properties?.action_link;
    if (error || !actionLink) {
      // Unknown email (or transient error): say nothing different.
      if (error && !/not.?found/i.test(error.message)) {
        console.error("generateLink error:", error.message);
      }
      return ok();
    }

    const result = await sendEmail(adminClient, {
      from: "B-Reserve <contact@bossiz.com>",
      to: [email],
      subject: "Réinitialisation de votre mot de passe - B-Reserve",
      html: emailHtml(actionLink),
    });
    if (!result.ok) console.error("Password reset email error:", result.error);

    return ok();
  } catch (error) {
    console.error("send-password-reset error:", error);
    return new Response(JSON.stringify({ error: "Erreur interne du serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function emailHtml(link: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0; font-size: 20px;">Réinitialisation du mot de passe</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Bonjour,</p>
          <p>Vous avez demandé à réinitialiser le mot de passe de votre compte B-Reserve. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :</p>
          <p style="text-align:center; margin: 28px 0;">
            <a href="${link.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" style="background:#0b3d5c; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Choisir un nouveau mot de passe</a>
          </p>
          <p style="font-size: 13px; color:#666;">Ce lien est à usage unique et expire rapidement. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail : votre mot de passe actuel reste valable.</p>
          <p style="margin-top: 24px;">L'équipe B-Reserve</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
