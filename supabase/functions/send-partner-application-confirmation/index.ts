import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";
import { renderEmailTemplate, escapeHtml as escapeVarHtml } from "../_shared/emailTemplates.ts";

// ============================================================
// EDGE FUNCTION: send-partner-application-confirmation
// Called right after a public "Devenir partenaire" application is
// inserted (BecomePartner.tsx). Re-reads the row from the DB by id
// (service role) instead of trusting client-supplied content, then sends
// two emails: a receipt confirmation to the applicant, and an internal
// alert to the admin team so candidatures are not only discoverable by
// polling /admin/partner-applications.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_NOTIFICATION_EMAIL = "contact@bossiz.com";

const carPlanLabels: Record<string, string> = {
  decouverte: "Découverte",
  pro: "Pro",
  flotte: "Flotte",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId } = await req.json();
    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: "applicationId requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: application, error: fetchError } = await supabase
      .from("partner_applications")
      .select("id, name, contact_email, description, requested_car_plan_id, created_at")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      console.error("Partner application not found:", fetchError?.message);
      return new Response(
        JSON.stringify({ error: "Candidature introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const carPlanLabel = application.requested_car_plan_id
      ? carPlanLabels[application.requested_car_plan_id] || application.requested_car_plan_id
      : null;

    const year = String(new Date().getFullYear());

    const applicantVars = { applicationName: application.name, year };
    const applicantRendered = await renderEmailTemplate(supabase, "partner_application_received", applicantVars);

    const applicantResult = await sendEmail(supabase, {
      from: "Bossiz+ Partenaires <partenaires@bossiz.com>",
      to: [application.contact_email],
      subject: applicantRendered?.subject ?? "Candidature partenaire reçue - Bossiz+",
      html: applicantRendered?.html ?? applicantEmailHtml(application.name),
    });

    const adminVars = {
      applicationName: application.name,
      contactEmail: application.contact_email,
      carPlanBlockHtml: carPlanLabel
        ? `<p style="margin:4px 0;"><strong>Forfait voiture demandé :</strong> ${carPlanLabel}</p>`
        : "",
      descriptionBlockHtml: application.description
        ? `<p style="margin:4px 0;"><strong>Description :</strong><br/>${escapeVarHtml(application.description).replace(/\n/g, "<br/>")}</p>`
        : "",
      receivedAt: new Date(application.created_at).toLocaleString("fr-FR"),
      reviewLink: "https://app.bossiz.com/admin/partner-applications",
      year,
    };
    const adminRendered = await renderEmailTemplate(
      supabase,
      "partner_application_admin_alert",
      adminVars,
      ["carPlanBlockHtml", "descriptionBlockHtml"]
    );

    const adminResult = await sendEmail(supabase, {
      from: "Bossiz+ Partenaires <partenaires@bossiz.com>",
      to: [ADMIN_NOTIFICATION_EMAIL],
      subject: adminRendered?.subject ?? `Nouvelle candidature partenaire : ${application.name}`,
      html: adminRendered?.html ?? adminEmailHtml(application, carPlanLabel),
      replyTo: application.contact_email,
    });

    const configured = !(
      applicantResult.error === "RESEND_API_KEY not configured" &&
      adminResult.error === "RESEND_API_KEY not configured"
    );

    if (configured && (!applicantResult.ok || !adminResult.ok)) {
      console.error("Partner application email error:", applicantResult.error, adminResult.error);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-partner-application-confirmation error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function applicantEmailHtml(name: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0; font-size: 20px;">Candidature bien reçue</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Bonjour,</p>
          <p>Nous avons bien reçu la candidature partenaire de <strong>${escapeHtml(name)}</strong> sur Bossiz+.</p>
          <p>Notre équipe étudie chaque dossier manuellement. Vous serez recontacté par email à cette même adresse une fois l'étude terminée, avec la décision et les prochaines étapes si votre candidature est retenue.</p>
          <p style="margin-top: 24px;">Merci pour votre intérêt,<br/>L'équipe Bossiz+</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function adminEmailHtml(
  application: { name: string; contact_email: string; description: string | null; created_at: string },
  carPlanLabel: string | null
) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin:0; font-size: 18px;">Nouvelle candidature partenaire</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <p><strong>Nom :</strong> ${escapeHtml(application.name)}</p>
          <p><strong>Email :</strong> ${escapeHtml(application.contact_email)}</p>
          ${carPlanLabel ? `<p><strong>Forfait voiture demandé :</strong> ${escapeHtml(carPlanLabel)}</p>` : ""}
          ${application.description ? `<p><strong>Description :</strong><br/>${escapeHtml(application.description).replace(/\n/g, "<br/>")}</p>` : ""}
          <p><strong>Reçue le :</strong> ${new Date(application.created_at).toLocaleString("fr-FR")}</p>
          <p style="margin-top: 20px;">
            <a href="https://app.bossiz.com/admin/partner-applications" style="background:#2563eb;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">
              Étudier la candidature
            </a>
          </p>
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
