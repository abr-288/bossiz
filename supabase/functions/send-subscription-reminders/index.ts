import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";
import { rejectIfNotCron } from "../_shared/cronAuth.ts";

// ============================================================
// EDGE FUNCTION: send-subscription-reminders
// Appelée chaque jour par pg_cron (migration 20261015000002).
// Jèko ne permet pas de prélèvement récurrent : on prévient le client
// REMINDER_DAYS jours avant l'échéance pour qu'il renouvelle lui-même.
// Idempotente : un seul rappel par abonnement (renewal_reminder_sent_at),
// un appel en double ne renvoie donc aucun email.
// ============================================================

const SITE_URL = (Deno.env.get("SITE_URL") || "https://app.bossiz.com").replace(/\/+$/, "");
const REMINDER_DAYS = 7;
const BATCH_SIZE = 50;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function reminderEmail(customerName: string, planName: string, endDate: string, renewUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
        <div style="background: #1B2A4A; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Votre abonnement arrive à échéance</h1>
        </div>
        <div style="padding: 24px;">
          <p>Bonjour ${esc(customerName)},</p>
          <p>Votre abonnement <strong>${esc(planName)}</strong> se termine le <strong>${esc(endDate)}</strong>.</p>
          <p>Pour continuer à profiter de vos avantages sans interruption, renouvelez-le dès maintenant.
             La nouvelle période commencera à la fin de l'actuelle : vous ne perdez aucun jour.</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${esc(renewUrl)}" style="background: #0F7B5F; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Renouveler mon abonnement</a>
          </p>
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

  const now = new Date();
  const horizon = new Date(now.getTime() + REMINDER_DAYS * 24 * 60 * 60 * 1000);

  const { data: due, error } = await supabase
    .from("user_subscriptions")
    .select("id, user_id, plan_id, plan_name, end_date")
    .eq("status", "active")
    .is("renewal_reminder_sent_at", null)
    .gt("end_date", now.toISOString())
    .lte("end_date", horizon.toISOString())
    .order("end_date", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Lecture des abonnements à échéance:", error.message);
    return json({ success: false, error: "Lecture impossible" }, 500);
  }

  let sent = 0;
  for (const sub of due ?? []) {
    // Déjà renouvelé (une autre période active court au-delà) : pas de rappel.
    const { data: later } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", sub.user_id)
      .eq("status", "active")
      .gt("end_date", sub.end_date)
      .limit(1)
      .maybeSingle();

    // Marqué avant l'envoi : en cas d'échec d'email on préfère rater un
    // rappel plutôt que d'en envoyer plusieurs.
    const { data: claimed } = await supabase
      .from("user_subscriptions")
      .update({ renewal_reminder_sent_at: now.toISOString() })
      .eq("id", sub.id)
      .is("renewal_reminder_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed || later) continue;

    const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", sub.user_id)
      .maybeSingle();

    const planName = sub.plan_name || sub.plan_id;
    const endDate = new Date(sub.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const result = await sendEmail(supabase, {
      to: [email],
      subject: `Votre abonnement ${planName} se termine le ${endDate}`,
      html: reminderEmail(
        profile?.full_name || email.split("@")[0],
        planName,
        endDate,
        `${SITE_URL}/subscription-payment?planId=${encodeURIComponent(sub.plan_id)}`,
      ),
    });

    if (result.ok) {
      sent++;
    } else {
      console.error("Rappel non envoyé pour l'abonnement", sub.id, result.error);
    }
  }

  return json({ success: true, checked: due?.length ?? 0, sent });
});
