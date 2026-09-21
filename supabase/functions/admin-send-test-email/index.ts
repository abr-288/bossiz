import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";

// ============================================================
// EDGE FUNCTION: admin-send-test-email
// Lets an admin (button on /admin/integrations) send a test email through
// the active email provider and see the REAL error if it fails. Every other
// email function swallows delivery errors into console logs the admin can't
// reach, which makes a bad SMTP/Resend configuration invisible.
// Admin-only (same check as admin-list-users). Never returns credentials.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const to = String(body.to ?? "").trim();
    if (!EMAIL_RE.test(to) || to.length > 254) {
      return json({ error: "Adresse email invalide" }, 400);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: active } = await adminClient
      .from("integration_credentials")
      .select("provider")
      .eq("category", "email")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const result = await sendEmail(adminClient, {
      from: "B-Reserve <contact@bossiz.com>",
      to: [to],
      subject: "Test d'envoi d'e-mail - B-Reserve",
      html: "<p>Bonjour,</p><p>Ceci est un e-mail de test envoyé depuis l'administration de B-Reserve. Si vous le lisez, l'envoi d'e-mails fonctionne.</p>",
    });

    return json({
      success: result.ok,
      provider: active?.provider ?? "aucun prestataire actif (repli sur RESEND_API_KEY)",
      error: result.ok ? undefined : result.error,
    });
  } catch (error) {
    console.error("admin-send-test-email error:", error);
    return json({ error: "Erreur interne du serveur" }, 500);
  }
});
