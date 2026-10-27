// Prépare l'application mobile (Android / iOS) après `vite build`.
//
// 1. dist-app/ : copie du site pour l'app (npx cap sync), sans le dossier
//    downloads/ (l'APK de 20 Mo n'a rien à faire dans l'app elle-même).
// 2. dist/app-updates/ : la même copie zippée + latest.json. redeploy.sh les
//    publie sur app.bossiz.com ; les apps installées les téléchargent
//    (src/lib/appUpdates.ts). Seule la dernière version est conservée.
//
// La version vient de la balise <meta name="app-version"> écrite par
// vite.config.ts : l'app compare la sienne à celle de latest.json.
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIST = path.join(ROOT, "dist");
const APP_DIR = path.join(ROOT, "dist-app");
const UPDATES_DIR = path.join(DIST, "app-updates");
const PUBLIC_URL = "https://app.bossiz.com/app-updates";
const EXCLUDED = new Set(["downloads", "app-updates"]);

const html = readFileSync(path.join(DIST, "index.html"), "utf8");
const version = html.match(/<meta name="app-version" content="([^"]+)"/)?.[1];
if (!version) throw new Error('dist/index.html : balise <meta name="app-version"> introuvable');

rmSync(APP_DIR, { recursive: true, force: true });
cpSync(DIST, APP_DIR, { recursive: true, filter: (src) => !EXCLUDED.has(path.relative(DIST, src).split(path.sep)[0]) });

const files = {};
const collect = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) collect(full);
    else files[path.relative(APP_DIR, full).split(path.sep).join("/")] = readFileSync(full);
  }
};
collect(APP_DIR);
const zip = zipSync(files, { level: 9 });

rmSync(UPDATES_DIR, { recursive: true, force: true });
mkdirSync(UPDATES_DIR);
const zipName = `bundle-${version}.zip`;
writeFileSync(path.join(UPDATES_DIR, zipName), zip);
writeFileSync(
  path.join(UPDATES_DIR, "latest.json"),
  JSON.stringify(
    {
      version,
      url: `${PUBLIC_URL}/${zipName}`,
      // SHA-256 du zip, vérifié par le plugin avant d'installer la version.
      checksum: createHash("sha256").update(zip).digest("hex"),
    },
    null,
    2,
  ),
);

console.log(`App mobile ${version} : dist-app/ prêt, ${zipName} (${(zip.length / 1e6).toFixed(1)} Mo)`);
