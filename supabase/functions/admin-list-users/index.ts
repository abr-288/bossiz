import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// EDGE FUNCTION: admin-list-users
// Returns every site user (id, email, full_name) for the admin "Créer une
// agence" flow (AdminAgencies.tsx): matching a partner application's
// contact_email to an existing account, and populating the owner picker
// with real emails. Emails live only in Supabase Auth (auth.users),
// which is never exposed through PostgREST - the previous implementation
// called supabase.auth.admin.getUserById() once per row directly from the
// admin's browser session (anon/user key), which the Auth admin API
// rejects, so it silently failed via a .catch() and every owner showed
// "N/A". This runs server-side with the service-role key instead.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PER_PAGE = 200;
const MAX_PAGES = 25; // safety cap (~5000 users)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: rolesData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!rolesData || rolesData.length === 0) {
      return new Response(
        JSON.stringify({ error: "Accès refusé - Admin requis" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const authUsersById = new Map<string, string>();
    for (let page = 1; page <= MAX_PAGES; page++) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: PER_PAGE });
      if (error) {
        console.error("listUsers error:", error.message);
        break;
      }
      for (const u of data.users) {
        if (u.email) authUsersById.set(u.id, u.email);
      }
      if (data.users.length < PER_PAGE) break;
    }

    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, full_name");

    if (profilesError) {
      console.error("profiles fetch error:", profilesError.message);
      return new Response(
        JSON.stringify({ error: "Impossible de charger les utilisateurs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = (profiles || [])
      .map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: authUsersById.get(p.id) || null,
      }))
      .filter((u) => u.email);

    return new Response(
      JSON.stringify({ users: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("admin-list-users error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
