// Budget de taille du build (workflow Code Quality), à lancer après `npm run build`.
// Tailles mesurées compressées en gzip, comme servies aux visiteurs.
// Usage : node scripts/ci/bundle-size.mjs
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const ASSETS = "dist/assets";
const KB = 1024;

// Budgets : à relever seulement en connaissance de cause (chaque Ko compte sur
// les connexions mobiles lentes).
const BUDGETS = {
  entry: 160 * KB, // index-*.js, chargé sur toutes les pages
  chunk: 150 * KB, // tout autre fichier JS
  css: 40 * KB, // total des feuilles de style
};

const files = readdirSync(ASSETS);
const gzipSize = (file) => gzipSync(readFileSync(join(ASSETS, file))).length;
const fmt = (bytes) => `${(bytes / KB).toFixed(1)} Ko`;
const failures = [];

// Point d'entrée : le script module chargé par dist/index.html.
const entryMatch = readFileSync("dist/index.html", "utf8").match(/<script[^>]+type="module"[^>]+src="\/assets\/([^"]+\.js)"/);
if (!entryMatch) {
  console.error("Point d'entrée introuvable dans dist/index.html");
  process.exit(1);
}
const entryFile = entryMatch[1];

for (const file of files.filter((f) => f.endsWith(".js"))) {
  const size = gzipSize(file);
  const isEntry = file === entryFile;
  const budget = isEntry ? BUDGETS.entry : BUDGETS.chunk;
  if (size > budget) failures.push(`${file} : ${fmt(size)} > ${fmt(budget)}`);
  if (isEntry) console.log(`Entrée JS ${file} : ${fmt(size)} (budget ${fmt(budget)})`);
}

const cssTotal = files.filter((f) => f.endsWith(".css")).reduce((sum, f) => sum + gzipSize(f), 0);
console.log(`CSS total : ${fmt(cssTotal)} (budget ${fmt(BUDGETS.css)})`);
if (cssTotal > BUDGETS.css) failures.push(`CSS total : ${fmt(cssTotal)} > ${fmt(BUDGETS.css)}`);

if (failures.length > 0) {
  console.error("Budget de taille dépassé :\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("Budget de taille respecté.");
