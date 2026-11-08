// Lit une sauvegarde bossiz-AAAA-MM-JJ.jsonl.gz (fonction backup-database) et,
// au choix :
//   - l'inspecte (par défaut) : nombre de lignes par table, erreurs d'export ;
//   - la restaure dans un projet Supabase CIBLE (--restore), jamais la prod :
//     comptes (avec mot de passe chiffré d'origine), puis tables public.
//
// Usage (Git Bash ou PowerShell) :
//   node scripts/backup/restore.mjs chemin/bossiz-2026-11-08.jsonl.gz
//   TARGET_URL=https://xxxx.supabase.co TARGET_SERVICE_ROLE_KEY=... \
//     node scripts/backup/restore.mjs chemin/bossiz-2026-11-08.jsonl.gz --restore
//
// Le projet cible doit déjà avoir le schéma (appliquer supabase/migrations).
// Les tables sont insérées en plusieurs passes jusqu'à ce que les clés
// étrangères soient satisfaites.
import fs from "node:fs";
import zlib from "node:zlib";
import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";

const file = process.argv[2];
const restore = process.argv.includes("--restore");
if (!file) {
  console.error("Usage : node scripts/backup/restore.mjs <fichier.jsonl.gz> [--restore]");
  process.exit(1);
}

const tables = new Map(); // "schema.table" -> rows[]
let meta = null;
let end = null;
const rl = readline.createInterface({
  input: fs.createReadStream(file).pipe(zlib.createGunzip()),
  crlfDelay: Infinity,
});
for await (const line of rl) {
  if (!line.trim()) continue;
  const rec = JSON.parse(line);
  if (rec.type === "meta") meta = rec;
  else if (rec.type === "end") end = rec;
  else if (rec.type === "rows") {
    const key = `${rec.schema}.${rec.table}`;
    if (!tables.has(key)) tables.set(key, []);
    tables.get(key).push(...rec.rows);
  }
}

console.log(`Sauvegarde du ${meta?.createdAt ?? "?"} (${meta?.format ?? "format inconnu"})`);
if (!end) console.log("ATTENTION : fichier incomplet (pas de ligne de fin).");
if (end?.errors?.length) console.log("Erreurs pendant l'export :\n  " + end.errors.join("\n  "));
const total = [...tables.values()].reduce((a, r) => a + r.length, 0);
console.log(`${tables.size} tables non vides, ${total} lignes.`);
for (const [k, rows] of [...tables].sort((a, b) => b[1].length - a[1].length).slice(0, 15)) {
  console.log(`  ${k.padEnd(45)} ${rows.length}`);
}
if (!restore) process.exit(0);

const url = process.env.TARGET_URL;
const key = process.env.TARGET_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("TARGET_URL et TARGET_SERVICE_ROLE_KEY sont nécessaires pour --restore.");
  process.exit(1);
}
if (meta?.project && url.replace(/\/$/, "") === meta.project.replace(/\/$/, "")) {
  console.error("Refusé : la cible est le projet d'origine. Restaurez dans un NOUVEAU projet.");
  process.exit(1);
}
const target = createClient(url, key, { auth: { persistSession: false } });

// 1. Comptes : même id, même e-mail, même mot de passe chiffré.
let users = 0;
for (const u of tables.get("auth.users") ?? []) {
  const { error } = await target.auth.admin.createUser({
    id: u.id,
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
    password_hash: u.encrypted_password || undefined,
    email_confirm: !!u.email_confirmed_at,
    phone_confirm: !!u.phone_confirmed_at,
    user_metadata: u.raw_user_meta_data ?? {},
    app_metadata: u.raw_app_meta_data ?? {},
  });
  if (!error || /already/i.test(error.message)) users++;
  else console.warn(`compte ${u.email ?? u.id} : ${error.message}`);
}
console.log(`${users} comptes restaurés.`);

// 2. Tables public, en plusieurs passes (ordre des clés étrangères inconnu).
let pending = [...tables].filter(([k]) => k.startsWith("public.")).map(([k, rows]) => [k.slice(7), rows]);
for (let pass = 1; pending.length && pass <= 8; pass++) {
  const failed = [];
  for (const [table, rows] of pending) {
    let ok = true;
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await target.from(table).upsert(rows.slice(i, i + 500));
      if (error) {
        ok = false;
        if (pass === 8) console.warn(`${table} : ${error.message}`);
        break;
      }
    }
    if (!ok) failed.push([table, rows]);
  }
  console.log(`Passe ${pass} : ${pending.length - failed.length} tables restaurées, ${failed.length} en attente.`);
  if (failed.length === pending.length) {
    console.warn("Plus de progrès possible :", failed.map(([t]) => t).join(", "));
    break;
  }
  pending = failed;
}
