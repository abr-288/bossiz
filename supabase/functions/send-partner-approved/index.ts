import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPartnerApprovedEmail } from "../_shared/partnerAccount.ts";

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

    const result = await sendPartnerApprovedEmail(adminClient, agencyId);
    if (!result) return json({ error: "Agence introuvable" }, 404);

    return json({ success: true, emailSent: result.emailSent });
  } catch (error) {
    console.error("send-partner-approved error:", error);
    return json({ error: "Erreur interne du serveur" }, 500);
  }
});
