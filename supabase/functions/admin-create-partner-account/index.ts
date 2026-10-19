import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findOrCreatePartnerAccount } from "../_shared/partnerAccount.ts";

// ============================================================
// EDGE FUNCTION: admin-create-partner-account
// Used by the admin "Créer une agence" flow (AdminAgencies.tsx) when a
// partner application's contact_email has no Bossiz+ account yet.
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

    // Si l'email n'a pas pu partir, setupLink est rendu à l'admin (déjà de
    // confiance) pour qu'il le transmette lui-même (WhatsApp, etc.).
    const account = await findOrCreatePartnerAccount(adminClient, email, fullName);
    if (!account) return json({ error: "Impossible de créer le compte" }, 500);

    return json({ success: true, ...account });
  } catch (error) {
    console.error("admin-create-partner-account error:", error);
    return json({ error: "Erreur interne du serveur" }, 500);
  }
});
