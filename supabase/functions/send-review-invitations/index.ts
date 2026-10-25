import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";
import { rejectIfNotCron } from "../_shared/cronAuth.ts";

// ============================================================
// EDGE FUNCTION: send-review-invitations
// Appelée chaque jour à 10 h par pg_cron (migration 20261026000000).
// Invite les clients à noter une prestation effectuée dans les 7 derniers
// jours (séjour, location, circuit, activité, restaurant, soin, commande
// artisan). claim_review_invitations() réserve chaque invitation avant
// l'envoi : un appel en double n'envoie rien deux fois.
// ============================================================

const SITE_URL = (Deno.env.get("SITE_URL") || "https://app.bossiz.com").replace(/\/+$/, "");
const BATCH_SIZE = 50;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function invitationEmail(customerName: string, title: string, reviewUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
        <div style="background: #1B2A4A; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Comment s'est passée votre expérience ?</h1>
        </div>
        <div style="padding: 24px;">
          <p>Bonjour ${esc(customerName)},</p>
          <p>Merci d'avoir réservé <strong>${esc(title)}</strong> avec Bossiz+.</p>
          <p>Votre avis aide les autres voyageurs à bien choisir et permet à nos partenaires de s'améliorer.
             Cela ne prend qu'une minute.</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${esc(reviewUrl)}" style="background: #0F7B5F; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Donner mon avis</a>
          </p>
          <p style="font-size: 13px; color: #666;">Les avis sont publiés après vérification par notre équipe.</p>
          <p>Merci de votre confiance,<br>L'équipe Bossiz+</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const denied = rejectIfNotCron(req, corsHeaders);
  if (denied) return denied;

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ success: false, error: "Configuration serveur incomplète" }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: due, error } = await supabase.rpc("claim_review_invitations", { p_limit: BATCH_SIZE });
  if (error) {
    console.error("Réservation des invitations à noter:", error.message);
    return json({ success: false, error: "Lecture impossible" }, 500);
  }

  let sent = 0;
  for (const invitation of due ?? []) {
    // E-mail saisi à la réservation, sinon celui du compte.
    let email = invitation.email?.trim() || null;
    if (!email) {
      const { data: authUser } = await supabase.auth.admin.getUserById(invitation.user_id);
      email = authUser?.user?.email ?? null;
    }
    if (!email) continue;

    const result = await sendEmail(supabase, {
      to: [email],
      subject: `Votre avis sur ${invitation.title}`,
      html: invitationEmail(invitation.customer_name || email.split("@")[0], invitation.title, `${SITE_URL}/mes-avis`),
    });

    if (result.ok) {
      sent++;
    } else {
      console.error("Invitation non envoyée pour", invitation.source_type, invitation.source_id, result.error);
    }
  }

  return json({ success: true, claimed: due?.length ?? 0, sent });
});
