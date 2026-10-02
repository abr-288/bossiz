import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";
import { renderEmailTemplate } from "../_shared/emailTemplates.ts";

// ============================================================
// EDGE FUNCTION: send-partner-application-rejection
// Called by the admin "Candidatures Partenaires" page right after a
// partner_applications row is set to status = "rejected". Re-reads the
// row from the DB by id (service role) instead of trusting client-supplied
// content, then sends a generic rejection email to the applicant.
// Admin-only (same check as admin-create-partner-account).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const applicationId = String(body.applicationId ?? "");
    if (!applicationId) return json({ error: "applicationId requis" }, 400);

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: application, error: fetchError } = await adminClient
      .from("partner_applications")
      .select("id, name, contact_email, status")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      console.error("Partner application not found:", fetchError?.message);
      return json({ error: "Candidature introuvable" }, 404);
    }

    if (application.status !== "rejected") {
      return json({ error: "La candidature n'est pas au statut rejeté" }, 400);
    }

    const vars = { applicationName: application.name, year: String(new Date().getFullYear()) };
    const rendered = await renderEmailTemplate(adminClient, "partner_application_rejected", vars);

    const result = await sendEmail(adminClient, {
      from: "Bossiz+ Partenaires <partenaires@bossiz.com>",
      to: [application.contact_email],
      subject: rendered?.subject ?? "Réponse à votre candidature partenaire - Bossiz+",
      html: rendered?.html ?? emailHtml(application.name),
    });

    if (!result.ok && result.error !== "RESEND_API_KEY not configured") {
      console.error("Partner application rejection email error:", result.error);
    }

    return json({ success: true, emailSent: result.ok });
  } catch (error) {
    console.error("send-partner-application-rejection error:", error);
    return json({ error: "Erreur interne du serveur" }, 500);
  }
});

function emailHtml(name: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0; font-size: 20px;">Réponse à votre candidature</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Bonjour,</p>
          <p>Nous avons étudié avec attention la candidature partenaire de <strong>${escapeHtml(name)}</strong> sur Bossiz+.</p>
          <p>Après examen, nous ne sommes malheureusement pas en mesure d'y donner suite pour le moment.</p>
          <p>Vous pouvez soumettre une nouvelle candidature à tout moment si votre situation évolue.</p>
          <p style="margin-top: 24px;">Merci pour votre intérêt,<br/>L'équipe Bossiz+</p>
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
