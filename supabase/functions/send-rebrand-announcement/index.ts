import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";
import { renderEmailTemplate } from "../_shared/emailTemplates.ts";

// ============================================================
// EDGE FUNCTION: send-rebrand-announcement
// One-off broadcast: "B-Reserve is now Bossiz+, your account is active,
// here's where to log in" - sent once to every existing account, tailored
// to their role (admin / partner / client). Admin-only.
//
// Three modes, always explicit - nothing sends to real users by accident:
//   - { mode: "preview" }                 -> returns the 3 rendered HTML
//     variants (admin/partner/client) without sending any email at all.
//   - { mode: "test", testEmail, role? }  -> sends exactly one email to
//     testEmail, using sample data for the given role (default "user").
//   - { mode: "send", confirm: true, page? } -> real batch: processes one
//     page (200 accounts) of auth.users, sends the role-appropriate email
//     to each, and returns { processed, sent, failed, nextPage }. Call
//     again with the returned nextPage until it's null. One page per call
//     keeps this comfortably inside the Edge Function time limit and makes
//     the whole run safely resumable if it's interrupted.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://app.bossiz.com";
const PER_PAGE = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ROLE_META: Record<string, { roleLabel: string; dashboardLink: string }> = {
  admin: { roleLabel: "votre espace administrateur", dashboardLink: `${SITE_URL}/admin` },
  sub_agency: { roleLabel: "votre espace partenaire", dashboardLink: `${SITE_URL}/agency` },
  user: { roleLabel: "votre espace client", dashboardLink: `${SITE_URL}/dashboard` },
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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json().catch(() => ({}));
    const mode = String(body.mode ?? "");

    if (mode === "preview") {
      const variants: Record<string, { subject: string; html: string }> = {};
      for (const role of ["admin", "sub_agency", "user"] as const) {
        variants[role] = await buildEmail(adminClient, role, " Aïcha Koné");
      }
      return json({ variants });
    }

    if (mode === "test") {
      const testEmail = String(body.testEmail ?? "").trim().toLowerCase();
      const role = ["admin", "sub_agency", "user"].includes(body.role) ? body.role : "user";
      if (!EMAIL_RE.test(testEmail) || testEmail.length > 254) {
        return json({ error: "Adresse email de test invalide" }, 400);
      }
      const { subject, html } = await buildEmail(adminClient, role, " Aïcha Koné");
      const result = await sendEmail(adminClient, {
        from: "Bossiz+ <noreply@bossiz.com>",
        to: [testEmail],
        subject: `[TEST] ${subject}`,
        html,
      });
      return json({ success: result.ok, error: result.ok ? undefined : result.error });
    }

    if (mode === "send") {
      if (body.confirm !== true) {
        return json({ error: "confirm: true requis pour un envoi réel" }, 400);
      }
      const page = Number.isInteger(body.page) && body.page > 0 ? body.page : 1;

      const { data: pageData, error: listError } = await adminClient.auth.admin.listUsers({
        page,
        perPage: PER_PAGE,
      });
      if (listError) {
        console.error("listUsers error:", listError.message);
        return json({ error: "Impossible de lister les utilisateurs" }, 500);
      }

      const userIds = pageData.users.map((u) => u.id);
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const nameById = new Map((profiles || []).map((p) => [p.id, p.full_name as string | null]));

      const { data: roleRows } = await adminClient
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      const roleById = new Map<string, string>();
      for (const row of roleRows || []) {
        // admin > sub_agency > user si un compte a plusieurs lignes de rôle
        const current = roleById.get(row.user_id);
        if (row.role === "admin" || (row.role === "sub_agency" && current !== "admin")) {
          roleById.set(row.user_id, row.role);
        }
      }

      let sent = 0;
      let failed = 0;
      for (const u of pageData.users) {
        if (!u.email) continue;
        const role = roleById.get(u.id) || "user";
        const fullName = nameById.get(u.id);
        const { subject, html } = await buildEmail(adminClient, role, fullName ? ` ${fullName}` : "");
        const result = await sendEmail(adminClient, {
          from: "Bossiz+ <noreply@bossiz.com>",
          to: [u.email],
          subject,
          html,
        });
        if (result.ok) sent++;
        else {
          failed++;
          console.error(`send-rebrand-announcement: failed for ${u.email}:`, result.error);
        }
        // Petit délai pour rester sous les limites de débit du prestataire email.
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      const nextPage = pageData.users.length === PER_PAGE ? page + 1 : null;
      return json({ processed: pageData.users.length, sent, failed, page, nextPage });
    }

    return json({ error: "mode requis : preview | test | send" }, 400);
  } catch (error) {
    console.error("send-rebrand-announcement error:", error);
    return json({ error: "Erreur interne du serveur" }, 500);
  }
});

async function buildEmail(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  role: string,
  greeting: string
): Promise<{ subject: string; html: string }> {
  const meta = ROLE_META[role] || ROLE_META.user;
  const vars = {
    greeting,
    roleLabel: meta.roleLabel,
    dashboardLink: meta.dashboardLink,
    year: String(new Date().getFullYear()),
  };
  const rendered = await renderEmailTemplate(supabase, "rebrand_announcement", vars);
  if (rendered) return rendered;

  return {
    subject: "Nouveau nom, même équipe : bienvenue chez Bossiz+",
    html: defaultHtml(vars),
  };
}

function defaultHtml(vars: { greeting: string; roleLabel: string; dashboardLink: string; year: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0; font-size: 20px;">Nouveau nom, même équipe</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Bonjour${vars.greeting},</p>
          <p>B-Reserve s'appelle désormais <strong>Bossiz+</strong>. Rien ne change pour vous : même compte, mêmes accès, ${vars.roleLabel} reste actif.</p>
          <p style="text-align:center; margin: 28px 0;">
            <a href="${vars.dashboardLink}" style="background:#0b3d5c; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Me connecter à Bossiz+</a>
          </p>
          <p style="font-size: 13px; color:#666;">Si vous avez oublié votre mot de passe, utilisez « Mot de passe oublié » sur la page de connexion.</p>
          <p style="margin-top: 24px;">À bientôt,<br/>L'équipe Bossiz+</p>
          <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© ${vars.year} Conciergerie Bossiz. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
