// Audit des dépendances pour la CI : échoue sur toute vulnérabilité de niveau
// « moderate » ou plus, sauf les avis acceptés ci-dessous (chacun avec sa
// raison). Usage : node scripts/ci/npm-audit.mjs
import { execSync } from "node:child_process";

const LEVELS = ["info", "low", "moderate", "high", "critical"];
const MIN_LEVEL = "moderate";

// Avis acceptés. À retirer dès qu'une version corrigée existe ou que la
// dépendance concernée disparaît.
const ALLOWED = {
  // Ajoutés le 2026-11-07 (avis publiés début novembre, pas de correctif dans la même version majeure).
  "GHSA-3g3m-2fjr-6pw4":
    "glob (via workbox-build, génération du service worker au build) - ne lit que nos propres fichiers, " +
    "aucune entrée extérieure. Outil de build uniquement.",
  "GHSA-g3hv-75wg-m249":
    "minimatch (via typescript-eslint et workbox-build) - motifs écrits par nous, au lint et au build. " +
    "Disparaîtra avec typescript-eslint 9 / workbox 8.",
  "GHSA-mrhx-c7xc-m3w5":
    "zod 3 (validation des formulaires côté navigateur) - corrigé seulement en zod 4 (refonte de l'API). " +
    "Dans le navigateur, seul le visiteur lui-même pourrait saturer sa propre page. Migration zod 4 à planifier.",
};

let output;
try {
  output = execSync("npm audit --json", { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 64 * 1024 * 1024 });
} catch (error) {
  // npm audit sort en erreur dès qu'il trouve une vulnérabilité : le JSON est sur stdout.
  output = error.stdout;
}

const report = JSON.parse(output);
const advisories = new Map();
for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vulnerability.via) {
    if (typeof via !== "object") continue;
    const id = via.url?.split("/").pop() ?? String(via.source);
    advisories.set(id, { id, name: via.name, severity: via.severity, title: via.title, url: via.url });
  }
}

const atLeast = (severity) => LEVELS.indexOf(severity) >= LEVELS.indexOf(MIN_LEVEL);
const blocking = [...advisories.values()].filter((a) => atLeast(a.severity) && !(a.id in ALLOWED));
const accepted = [...advisories.values()].filter((a) => a.id in ALLOWED);

for (const a of accepted) console.log(`Accepté  ${a.severity.padEnd(8)} ${a.name} ${a.id} : ${ALLOWED[a.id]}`);
for (const id of Object.keys(ALLOWED)) {
  if (!advisories.has(id)) console.log(`Note : ${id} n'apparaît plus dans l'audit, retirez-le de ALLOWED.`);
}

if (blocking.length > 0) {
  for (const a of blocking) console.error(`Bloquant ${a.severity.padEnd(8)} ${a.name} ${a.id} - ${a.title} (${a.url})`);
  console.error(`\n${blocking.length} vulnérabilité(s) de niveau ${MIN_LEVEL} ou plus à corriger.`);
  process.exit(1);
}

console.log(`Audit OK : aucune vulnérabilité de niveau ${MIN_LEVEL} ou plus hors avis acceptés.`);
