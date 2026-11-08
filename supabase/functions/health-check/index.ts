import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller, isStaff } from "../_shared/auth.ts";
import { sendEmail } from "../_shared/integrations.ts";
import { notifyPhone } from "../_shared/notify.ts";

// ============================================================
// EDGE FUNCTION: health-check
// Appelée toutes les 5 minutes par pg_cron (en-tête x-cron-secret, voir
// migration 20261103000000_monitoring.sql) et depuis /admin/monitoring
// (« Vérifier maintenant », admin connecté).
//
// Vérifie : le site app.bossiz.com, le fichier de mise à jour de l'app mobile,
// la base de données, les tâches cron, la synchro des événements, et les
// nouvelles erreurs remontées par les navigateurs (table app_errors).
//
// Alerte par e-mail (MONITORING_ALERT_EMAIL, défaut contact@bossiz.com) et par
// SMS/WhatsApp si MONITORING_ALERT_PHONE est défini :
//   - quand un contrôle passe en échec (puis rappel toutes les heures),
//   - quand tout redevient normal,
//   - quand de nouvelles erreurs apparaissent (au plus un e-mail / 30 min).
// Comme elle tourne chez Supabase et non sur le VPS, elle détecte aussi une
// panne complète du serveur du site.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SITE_URL = "https://app.bossiz.com";
const REMINDER_MS = 60 * 60 * 1000;
const ERROR_DIGEST_MS = 30 * 60 * 1000;
const KEEP_DAYS = 14;

interface CheckResult {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
  ms?: number;
}

async function timed(key: string, label: string, fn: () => Promise<string>): Promise<CheckResult> {
  const start = Date.now();
  try {
    const detail = await fn();
    return { key, label, ok: true, detail, ms: Date.now() - start };
  } catch (e) {
    return { key, label, ok: false, detail: e instanceof Error ? e.message : String(e), ms: Date.now() - start };
  }
}

async function fetchWithTimeout(url: string, ms = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, headers: { "User-Agent": "BossizHealthCheck/1.0" } });
  } catch (e) {
    throw new Error(controller.signal.aborted ? `Pas de réponse en ${ms / 1000} s` : `Injoignable : ${String(e)}`);
  } finally {
    clearTimeout(timer);
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Cron (secret partagé) ou admin connecté.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const fromCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  if (!fromCron) {
    const caller = await getCaller(req, supabase);
    if (!isStaff(caller)) return json({ success: false, error: "Accès refusé" }, 401);
  }

  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const checks: CheckResult[] = await Promise.all([
    timed("site", "Site app.bossiz.com", async () => {
      const res = await fetchWithTimeout(`${SITE_URL}/?hc=${Date.now()}`);
      const body = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!body.includes('id="root"')) throw new Error("La page répond mais ne contient pas l'application (build vide ?)");
      const script = body.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];
      if (script) {
        const js = await fetchWithTimeout(`${SITE_URL}${script}`);
        await js.body?.cancel();
        if (!js.ok) throw new Error(`Script principal ${script} : HTTP ${js.status}`);
      }
      return `HTTP ${res.status}`;
    }),
    timed("app_updates", "Mises à jour de l'app mobile", async () => {
      const res = await fetchWithTimeout(`${SITE_URL}/app-updates/latest.json?hc=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.version || !data?.url) throw new Error("latest.json incomplet");
      return `version ${data.version}`;
    }),
    timed("database", "Base de données", async () => {
      const { error } = await supabase.from("site_config").select("config_key").limit(1);
      if (error) throw new Error(error.message);
      return "OK";
    }),
    timed("cron", "Tâches planifiées", async () => {
      const [{ data: jobs, error: e1 }, { data: http, error: e2 }] = await Promise.all([
        supabase.rpc("monitoring_cron_failures", { p_since: since }),
        supabase.rpc("monitoring_http_failures", { p_since: since }),
      ]);
      if (e1) throw new Error(e1.message);
      if (e2) throw new Error(e2.message);
      const problems = [
        ...((jobs ?? []) as { jobname: string; failures: number; last_message: string }[]).map(
          (j) => `${j.jobname} : ${j.failures} échec(s) — ${j.last_message}`,
        ),
        ...((http ?? []) as { status_code: number | null; error_msg: string; failures: number }[]).map(
          (h) => `appel HTTP ${h.status_code ?? "sans réponse"} ×${h.failures} — ${h.error_msg}`,
        ),
      ];
      if (problems.length) throw new Error(problems.join(" ; "));
      return "Aucun échec sur 10 min";
    }),
    timed("backup", "Sauvegarde de la base", async () => {
      const { data, error } = await supabase.storage.from("db-backups").list("", {
        limit: 100,
        sortBy: { column: "name", order: "desc" },
      });
      if (error) throw new Error(error.message);
      const latest = (data ?? []).find((f) => /^bossiz-\d{4}-\d{2}-\d{2}\.jsonl\.gz$/.test(f.name));
      if (!latest) return "Première sauvegarde cette nuit (03:30 UTC)";
      const ageH = (Date.now() - new Date(latest.created_at ?? latest.updated_at ?? 0).getTime()) / 3_600_000;
      if (ageH > 30) throw new Error(`Dernière sauvegarde il y a ${Math.round(ageH)} h (${latest.name})`);
      return `${latest.name}, il y a ${Math.round(ageH)} h`;
    }),
    timed("events_sync", "Synchro des événements (Ticketmaster)", async () => {
      const { data, error } = await supabase
        .from("site_config")
        .select("config_value")
        .eq("config_key", "events_sync")
        .maybeSingle();
      if (error) throw new Error(error.message);
      const cfg = (data?.config_value ?? {}) as { lastRunAt?: string; lastResult?: { errors?: unknown[] } };
      if (!cfg.lastRunAt) return "Pas encore lancée";
      const ageH = (Date.now() - new Date(cfg.lastRunAt).getTime()) / 3_600_000;
      if (ageH > 36) throw new Error(`Dernière synchro il y a ${Math.round(ageH)} h (attendu : chaque nuit)`);
      return `il y a ${Math.round(ageH)} h`;
    }),
  ]);

  // Nouvelles erreurs navigateur pas encore signalées.
  const { data: newErrors } = await supabase
    .from("app_errors")
    .select("id, source, message, url, occurrences, first_seen")
    .is("resolved_at", null)
    .is("alerted_at", null)
    .order("first_seen", { ascending: false })
    .limit(20);

  const ok = checks.every((c) => c.ok);

  const { data: previous } = await supabase
    .from("health_checks")
    .select("ok, checked_at, alert_sent")
    .order("checked_at", { ascending: false })
    .limit(30);

  const last = previous?.[0];
  const lastFailureAlert = previous?.find((p) => p.alert_sent === "down" || p.alert_sent === "reminder");
  const lastErrorAlert = previous?.find((p) => p.alert_sent === "errors");

  let alert: "down" | "reminder" | "recovered" | "errors" | null = null;
  if (!ok && (!last || last.ok)) alert = "down";
  else if (!ok && (!lastFailureAlert || Date.now() - new Date(lastFailureAlert.checked_at).getTime() > REMINDER_MS))
    alert = "reminder";
  else if (ok && last && !last.ok) alert = "recovered";
  else if (
    (newErrors?.length ?? 0) > 0 &&
    (!lastErrorAlert || Date.now() - new Date(lastErrorAlert.checked_at).getTime() > ERROR_DIGEST_MS)
  )
    alert = "errors";

  let alertSent: string | null = null;
  if (alert) {
    const failing = checks.filter((c) => !c.ok);
    const subject =
      alert === "recovered"
        ? "✅ Bossiz+ : tout est revenu à la normale"
        : alert === "errors"
          ? `⚠️ Bossiz+ : ${newErrors!.length} nouvelle(s) erreur(s) sur le site`
          : `🔴 Bossiz+ : problème détecté — ${failing.map((c) => c.label).join(", ")}`;

    const rows = checks
      .map(
        (c) =>
          `<tr><td style="padding:4px 8px">${c.ok ? "✅" : "🔴"}</td><td style="padding:4px 8px"><strong>${escapeHtml(c.label)}</strong></td><td style="padding:4px 8px">${escapeHtml(c.detail)}</td></tr>`,
      )
      .join("");
    const errorRows = (newErrors ?? [])
      .map(
        (e) =>
          `<li><strong>[${e.source}]</strong> ${escapeHtml(e.message.slice(0, 200))}${e.url ? ` — <em>${escapeHtml(e.url.slice(0, 120))}</em>` : ""} (×${e.occurrences})</li>`,
      )
      .join("");

    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
      <p>Contrôle automatique du ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Abidjan" })} (heure d'Abidjan).</p>
      <table style="border-collapse:collapse">${rows}</table>
      ${errorRows ? `<h3>Nouvelles erreurs</h3><ul>${errorRows}</ul>` : ""}
      <p><a href="${SITE_URL}/admin/monitoring">Ouvrir le tableau de surveillance</a></p>
    </div>`;

    const to = (Deno.env.get("MONITORING_ALERT_EMAIL") || "contact@bossiz.com")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const mail = await sendEmail(supabase, { from: "Bossiz+ Surveillance <noreply@bossiz.com>", to, subject, html });
    if (!mail.ok) console.error("health-check: e-mail d'alerte non envoyé:", mail.error);

    const phone = Deno.env.get("MONITORING_ALERT_PHONE");
    if (phone && alert !== "errors") {
      await notifyPhone(phone, `${subject}. ${failing.map((c) => `${c.label}: ${c.detail}`).join(" | ")}`.slice(0, 300));
    }

    alertSent = alert;
    if (newErrors?.length) {
      await supabase
        .from("app_errors")
        .update({ alerted_at: new Date().toISOString() })
        .in(
          "id",
          newErrors.map((e) => e.id),
        );
    }
  }

  await supabase.from("health_checks").insert({ ok, results: checks, alert_sent: alertSent });
  await supabase
    .from("health_checks")
    .delete()
    .lt("checked_at", new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString());

  return json({ success: true, ok, checks, newErrors: newErrors?.length ?? 0, alert: alertSent });
});
