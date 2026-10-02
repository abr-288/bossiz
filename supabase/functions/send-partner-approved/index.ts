import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";
import { renderEmailTemplate } from "../_shared/emailTemplates.ts";

// ============================================================
// EDGE FUNCTION: send-partner-approved
// Called by the admin "Agences" page right after a new agency row is
// created and its owner granted the sub_agency role - the moment a client
// (new or already registered) actually becomes a partner. Re-reads the
// agency from the DB by id (service role) instead of trusting
// client-supplied content, resolves the owner's real login email via
// auth.users (agencies.contact_email is a business contact, not
// necessarily the account email), and sends a welcome/approval email.
// Admin-only (same check as admin-create-partner-account).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://app.bossiz.com";

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
    const agencyId = String(body.agencyId ?? "");
    if (!agencyId) return json({ error: "agencyId requis" }, 400);

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: agency, error: fetchError } = await adminClient
      .from("agencies")
      .select("id, name, owner_id")
      .eq("id", agencyId)
      .single();

    if (fetchError || !agency) {
      console.error("Agency not found:", fetchError?.message);
      return json({ error: "Agence introuvable" }, 404);
    }

    const { data: ownerData, error: ownerError } = await adminClient.auth.admin.getUserById(agency.owner_id);
    const ownerEmail = ownerData?.user?.email;
    if (ownerError || !ownerEmail) {
      console.error("Agency owner has no email:", ownerError?.message);
      return json({ success: true, emailSent: false });
    }
    const ownerName = (ownerData.user.user_metadata?.full_name as string | undefined) || "";

    const vars = {
      ownerGreeting: ownerName ? ` ${ownerName}` : "",
      agencyName: agency.name,
      loginLink: `${SITE_URL}/auth`,
      year: String(new Date().getFullYear()),
    };
    const rendered = await renderEmailTemplate(adminClient, "partner_approved", vars);

    const result = await sendEmail(adminClient, {
      from: "Bossiz+ Partenaires <partenaires@bossiz.com>",
      to: [ownerEmail],
      subject: rendered?.subject ?? "Votre candidature est approuvée - Bienvenue chez Bossiz+",
      html: rendered?.html ?? emailHtml(agency.name, ownerName),
    });

    if (!result.ok && result.error !== "RESEND_API_KEY not configured") {
      console.error("Partner approval email error:", result.error);
    }

    return json({ success: true, emailSent: result.ok });
  } catch (error) {
    console.error("send-partner-approved error:", error);
    return json({ error: "Erreur interne du serveur" }, 500);
  }
});

function emailHtml(agencyName: string, ownerName: string) {
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
          <p style="text-align:center; margin: 28px 0;">
            <a href="${SITE_URL}/auth" style="background:#0b3d5c; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Accéder à mon espace agence</a>
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
