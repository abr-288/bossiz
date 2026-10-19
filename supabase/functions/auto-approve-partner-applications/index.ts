import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findOrCreatePartnerAccount, sendPartnerApprovedEmail } from "../_shared/partnerAccount.ts";
import { rejectIfNotCron } from "../_shared/cronAuth.ts";

// ============================================================
// EDGE FUNCTION: auto-approve-partner-applications
// Appelée chaque minute par pg_cron (migration 20261017020000).
// Quand la validation automatique est activée (site_config
// 'partner_applications' -> autoApprove, modifiable dans
// /admin/partner-applications), chaque candidature restée en attente plus de
// delayMinutes (3 par défaut) et reçue après enabledSince (date
// d'activation) est validée comme le ferait un admin dans
// AdminAgencies.tsx : compte créé (ou existant réutilisé), agence créée,
// rôle sub_agency, moyen de reversement, candidature 'approved', emails.
// Idempotente : chaque candidature n'est tentée qu'une fois
// (auto_approval_attempted_at). En cas d'échec elle reste en attente avec
// auto_approval_error, pour une validation manuelle.
// ============================================================

const BATCH_SIZE = 20;
const DEFAULT_DELAY_MINUTES = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PartnerApplication {
  id: string;
  name: string;
  description: string | null;
  contact_email: string;
  contact_phone: string | null;
  logo_url: string | null;
  requested_car_plan_id: string | null;
  preferred_payout_method: string | null;
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

  const { data: setting } = await supabase
    .from("site_config")
    .select("config_value")
    .eq("config_key", "partner_applications")
    .maybeSingle();
  const config = (setting?.config_value ?? {}) as { autoApprove?: boolean; delayMinutes?: number; enabledSince?: string };
  const enabledSince = config.enabledSince ? new Date(config.enabledSince) : null;
  // Sans date d'activation valide on ne valide rien plutôt que tout l'historique.
  if (config.autoApprove !== true || !enabledSince || Number.isNaN(enabledSince.getTime())) {
    return json({ success: true, enabled: false, approved: 0 });
  }

  const delayMinutes = Number.isFinite(config.delayMinutes)
    ? Math.min(Math.max(Number(config.delayMinutes), 0), 1440)
    : DEFAULT_DELAY_MINUTES;
  const cutoff = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();

  // Seules les candidatures reçues depuis l'activation : celles arrivées
  // pendant la validation manuelle restent à l'admin.
  const { data: due, error } = await supabase
    .from("partner_applications")
    .select("id, name, description, contact_email, contact_phone, logo_url, requested_car_plan_id, preferred_payout_method")
    .eq("status", "pending")
    .is("auto_approval_attempted_at", null)
    .gte("created_at", enabledSince.toISOString())
    .lte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Lecture des candidatures en attente:", error.message);
    return json({ success: false, error: "Lecture impossible" }, 500);
  }

  let approved = 0;
  for (const application of (due ?? []) as PartnerApplication[]) {
    // Réservée avant traitement : deux appels simultanés ne valident pas
    // deux fois la même candidature.
    const { data: claimed } = await supabase
      .from("partner_applications")
      .update({ auto_approval_attempted_at: new Date().toISOString() })
      .eq("id", application.id)
      .eq("status", "pending")
      .is("auto_approval_attempted_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    const failure = await approve(supabase, application);
    if (failure) {
      console.error("Validation automatique impossible pour", application.id, failure);
      await supabase
        .from("partner_applications")
        .update({ auto_approval_error: failure })
        .eq("id", application.id);
    } else {
      approved++;
    }
  }

  return json({ success: true, enabled: true, checked: due?.length ?? 0, approved });
});

// Même enchaînement que la création d'agence dans AdminAgencies.tsx.
// Renvoie un message d'erreur lisible par l'admin, ou null si tout est fait.
// deno-lint-ignore no-explicit-any
async function approve(supabase: any, application: PartnerApplication): Promise<string | null> {
  const email = application.contact_email.trim().toLowerCase();
  const account = await findOrCreatePartnerAccount(supabase, email, application.name.trim().slice(0, 120));
  if (!account) return "Impossible de créer le compte du partenaire";

  // Une seule agence par compte : un doublon reste à trancher par un admin.
  const { data: existingAgency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_id", account.userId)
    .limit(1)
    .maybeSingle();
  if (existingAgency) return "Ce compte possède déjà une agence";

  const phone = application.contact_phone
    ? application.contact_phone.startsWith("+")
      ? application.contact_phone
      : `+225 ${application.contact_phone}`
    : null;

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .insert({
      name: application.name,
      description: application.description,
      logo_url: application.logo_url,
      contact_email: application.contact_email,
      contact_phone: phone,
      owner_id: account.userId,
      is_visible: false,
      is_active: true,
      commission_rate: 10,
      car_plan_id: application.requested_car_plan_id,
      car_plan_started_at: application.requested_car_plan_id ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (agencyError || !agency) {
    console.error("Création de l'agence:", agencyError?.message);
    return "Impossible de créer l'agence";
  }

  if (application.preferred_payout_method) {
    const { error: payoutError } = await supabase
      .from("agency_payout_details")
      .upsert({
        agency_id: agency.id,
        payment_method: application.preferred_payout_method,
        beneficiary_name: application.name,
      });
    if (payoutError) console.error("Moyen de reversement non enregistré:", payoutError.message);
  }

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: account.userId, role: "sub_agency" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
  if (roleError) {
    console.error("Attribution du rôle sub_agency:", roleError.message);
    return "Agence créée mais rôle partenaire non attribué";
  }

  await supabase
    .from("partner_applications")
    .update({ status: "approved", auto_approved_at: new Date().toISOString(), auto_approval_error: null })
    .eq("id", application.id);

  await sendPartnerApprovedEmail(supabase, agency.id);
  return null;
}
