const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const LOCALES = {
  fr: require('./src/i18n/locales/fr.json'),
  en: require('./src/i18n/locales/en.json'),
  zh: require('./src/i18n/locales/zh.json'),
};

// ---- 1. Collect all source files ----
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walk(full, out);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}
const files = walk(SRC);

// ---- 2. Extract t('key') / t("key") static calls ----
const staticKeyRe = /\bt\(\s*['"]([a-zA-Z0-9_.\-]+)['"]/g;
// Dynamic keys like t(`pages.x.${id}.title`) - flag separately, can't auto-verify
const dynamicKeyRe = /\bt\(\s*`([a-zA-Z0-9_.\-]+)\$\{/g;

const usedKeys = new Map(); // key -> [file, ...]
const dynamicPrefixes = new Map(); // prefix -> [file, ...]

for (const file of files) {
  const rel = path.relative(__dirname, file);
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = staticKeyRe.exec(content))) {
    const key = m[1];
    if (!usedKeys.has(key)) usedKeys.set(key, []);
    usedKeys.get(key).push(rel);
  }
  while ((m = dynamicKeyRe.exec(content))) {
    const prefix = m[1];
    if (!dynamicPrefixes.has(prefix)) dynamicPrefixes.set(prefix, []);
    dynamicPrefixes.get(prefix).push(rel);
  }
}

// ---- 3. Check presence in each locale ----
function get(obj, dotPath) {
  return dotPath.split('.').reduce((o, k) => (o && typeof o === 'object' && k in o ? o[k] : undefined), obj);
}

const missing = { fr: [], en: [], zh: [] };
for (const [key, filesUsing] of usedKeys) {
  for (const lang of ['fr', 'en', 'zh']) {
    const val = get(LOCALES[lang], key);
    if (val === undefined) {
      missing[lang].push({ key, files: filesUsing });
    }
  }
}

// Dynamic-prefix keys: verify at least one concrete sub-key exists under that prefix as a sanity check
const dynamicMissing = { fr: [], en: [], zh: [] };
for (const [prefix, filesUsing] of dynamicPrefixes) {
  for (const lang of ['fr', 'en', 'zh']) {
    const parent = get(LOCALES[lang], prefix.replace(/\.$/, ''));
    // parent should resolve to an object if any concrete key under it exists; if totally undefined, likely broken
    if (parent === undefined) {
      dynamicMissing[lang].push({ prefix, files: filesUsing });
    }
  }
}

// ---- 4. Reverse: keys defined in fr.json but never referenced (potential dead translations) ----
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}
const frFlat = flatten(LOCALES.fr);
const allFrKeys = Object.keys(frFlat);
const usedKeySet = new Set(usedKeys.keys());
const dynamicPrefixList = [...dynamicPrefixes.keys()];
const unusedFrKeys = allFrKeys.filter((k) => {
  if (usedKeySet.has(k)) return false;
  // matches a dynamic prefix pattern?
  return !dynamicPrefixList.some((p) => k.startsWith(p));
});

// ---- 5. Heuristic scan for hardcoded French text not wrapped in t() ----
// Look for JSX text nodes / common string-literal props containing French accented chars or words,
// skipping lines that already contain a t( call, comments, or import/console statements.
const FRENCH_HINT = /[àâäéèêëïîôöùûüç]|(\b(vous|votre|nos|notre|réserv|paiement|voyage|hôtel|vol|prix|gratuit|inscription|connexion)\b)/i;
const hardcoded = [];
const SKIP_FILES = /\.(test|spec)\.tsx?$/;

for (const file of files) {
  if (SKIP_FILES.test(file)) continue;
  const rel = path.relative(__dirname, file);
  if (rel.startsWith('src/i18n')) continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    if (trimmed.includes('t(') || trimmed.includes('t(`')) return; // already translated on this line
    if (!FRENCH_HINT.test(trimmed)) return;

    // JSX text node: a line that is just text between tags, e.g. `Réserver maintenant`
    const jsxTextMatch = trimmed.match(/^>?([A-ZÀ-Ü][^<>{}\n]{3,80})<\/?[a-zA-Z]/) || trimmed.match(/^([A-ZÀ-Ü][^<>{}\n]{3,80})$/);
    // common hardcoded prop patterns
    const propMatch = trimmed.match(/(placeholder|title|aria-label|alt)=["']([^"'{}]{3,80})["']/);

    if (jsxTextMatch || propMatch) {
      hardcoded.push({ file: rel, line: idx + 1, text: trimmed.slice(0, 100) });
    }
  });
}

// ---- Report ----
console.log('=== MISSING i18n KEYS (used in code, absent from locale) ===');
for (const lang of ['fr', 'en', 'zh']) {
  console.log(`\n--- ${lang} (${missing[lang].length} missing) ---`);
  missing[lang].forEach((m) => console.log(`  ${m.key}  [${m.files[0]}${m.files.length > 1 ? ` +${m.files.length - 1} more` : ''}]`));
}

console.log('\n=== DYNAMIC-KEY PREFIXES with unresolved base object ===');
for (const lang of ['fr', 'en', 'zh']) {
  if (dynamicMissing[lang].length) {
    console.log(`\n--- ${lang} ---`);
    dynamicMissing[lang].forEach((m) => console.log(`  ${m.prefix}  [${m.files[0]}]`));
  }
}

console.log(`\n=== UNUSED fr.json KEYS (${unusedFrKeys.length}) — not referenced by any t() call ===`);
console.log(unusedFrKeys.slice(0, 40).join('\n'));
if (unusedFrKeys.length > 40) console.log(`  ... and ${unusedFrKeys.length - 40} more`);

console.log(`\n=== POSSIBLE HARDCODED TEXT (heuristic, ${hardcoded.length} hits) ===`);
hardcoded.forEach((h) => console.log(`  ${h.file}:${h.line}  ${h.text}`));

fs.writeFileSync('_hardcoded_full.json', JSON.stringify(hardcoded, null, 2));

console.log(`\n=== SUMMARY ===`);
console.log(`Files scanned: ${files.length}`);
console.log(`Static t() keys found: ${usedKeys.size}`);
console.log(`Dynamic t() prefixes found: ${dynamicPrefixes.size}`);
console.log(`Missing keys - fr: ${missing.fr.length}, en: ${missing.en.length}, zh: ${missing.zh.length}`);
console.log(`Unused fr.json keys: ${unusedFrKeys.length}`);
console.log(`Hardcoded-text heuristic hits: ${hardcoded.length}`);
