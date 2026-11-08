import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller, isStaff } from "../_shared/auth.ts";

// ============================================================
// EDGE FUNCTION: backup-database
// Sauvegarde nocturne (pg_cron 03:30 UTC, migration 20261104000000) ou à la
// demande depuis /admin/monitoring (admin connecté).
//
// Exporte toutes les tables du schéma public + auth.users + auth.identities
// dans UN fichier JSON Lines compressé du stockage privé « db-backups » :
//   bossiz-AAAA-MM-JJ.jsonl.gz
// Ligne 1 : {"type":"meta", ...}. Puis une ligne par paquet de lignes :
//   {"type":"rows","schema":"public","table":"bookings","rows":[...]}
// Dernière ligne : {"type":"end","tables":{...nombre de lignes...}}
// Les fichiers de plus de 14 jours sont supprimés.
// Aucun mot de passe de base nécessaire : la fonction lit la base avec la
// clé service-role via les fonctions SQL backup_table_list/backup_table_page.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BUCKET = "db-backups";
const PAGE = 2000;
const KEEP_DAYS = 14;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const cronSecret = Deno.env.get("CRON_SECRET");
  const fromCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  if (!fromCron) {
    const caller = await getCaller(req, supabase);
    if (!isStaff(caller)) return json({ success: false, error: "Accès refusé" }, 401);
  }

  const started = Date.now();
  const { data: list, error: listError } = await supabase.rpc("backup_table_list");
  if (listError) return json({ success: false, error: `Liste des tables : ${listError.message}` }, 500);

  const targets: [string, string][] = [
    ["auth", "users"],
    ["auth", "identities"],
    ...((list ?? []) as { table_name: string }[]).map((t): [string, string] => ["public", t.table_name]),
  ];

  // Compression au fil de l'eau : seul le fichier compressé reste en mémoire.
  const gzip = new CompressionStream("gzip");
  const writer = gzip.writable.getWriter();
  const collected = new Response(gzip.readable).arrayBuffer();
  const encoder = new TextEncoder();
  const line = (obj: unknown) => writer.write(encoder.encode(JSON.stringify(obj) + "\n"));

  const day = new Date().toISOString().slice(0, 10);
  await line({ type: "meta", format: "bossiz-backup-v1", createdAt: new Date().toISOString(), project: Deno.env.get("SUPABASE_URL") });

  const counts: Record<string, number> = {};
  const errors: string[] = [];
  for (const [schema, table] of targets) {
    let offset = 0;
    let total = 0;
    try {
      for (;;) {
        const { data, error } = await supabase.rpc("backup_table_page", {
          p_schema: schema,
          p_table: table,
          p_offset: offset,
          p_limit: PAGE,
        });
        if (error) throw new Error(error.message);
        const rows = (data ?? []) as unknown[];
        if (rows.length) await line({ type: "rows", schema, table, rows });
        total += rows.length;
        if (rows.length < PAGE) break;
        offset += PAGE;
      }
    } catch (e) {
      errors.push(`${schema}.${table} : ${e instanceof Error ? e.message : String(e)}`);
    }
    counts[`${schema}.${table}`] = total;
  }

  await line({ type: "end", tables: counts, errors, durationMs: Date.now() - started });
  await writer.close();
  const bytes = new Uint8Array(await collected);

  const path = `bossiz-${day}.jsonl.gz`;
  const { error: upError } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([bytes], { type: "application/gzip" }), { upsert: true, contentType: "application/gzip" });
  if (upError) return json({ success: false, error: `Envoi du fichier : ${upError.message}` }, 500);

  // Rotation : on garde les KEEP_DAYS derniers jours.
  const { data: files } = await supabase.storage.from(BUCKET).list("", { limit: 1000 });
  const limit = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
  const old = (files ?? [])
    .map((f) => f.name)
    .filter((n) => /^bossiz-\d{4}-\d{2}-\d{2}\.jsonl\.gz$/.test(n) && n.slice(7, 17) < limit);
  if (old.length) await supabase.storage.from(BUCKET).remove(old);

  const rowsTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  return json({
    success: errors.length === 0,
    file: path,
    sizeBytes: bytes.length,
    tables: Object.keys(counts).length,
    rows: rowsTotal,
    errors,
    removed: old,
    durationMs: Date.now() - started,
  });
});
