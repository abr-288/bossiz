// Recette automatique de toutes les pages du site (lecture seule).
//
// Ouvre chaque route de src/components/AnimatedRoutes.tsx sur le site en ligne,
// en visiteur, en client connecté et (si fourni) en partenaire, puis note :
// statut, redirection, titre, erreurs JavaScript, requêtes en échec, page 404
// ou « Une erreur s'est produite », débordement horizontal sur mobile, temps de
// chargement. Écrit un JSON et des captures d'écran mobiles.
//
// Aucune action d'écriture : on ne clique sur aucun bouton d'achat ni d'envoi.
//
// Usage (Git Bash) :
//   CLIENT_EMAIL=... CLIENT_PASSWORD=... [PARTNER_EMAIL=... PARTNER_PASSWORD=...] \
//   node scripts/qa/page-report.mjs [dossier-de-sortie]
//
// Variables : BASE_URL (défaut https://app.bossiz.com), ONLY=/flights,/hotels

import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.BASE_URL || "https://app.bossiz.com").replace(/\/$/, "");
const OUT = process.argv[2] || "qa-report";
fs.mkdirSync(path.join(OUT, "shots"), { recursive: true });

// Route -> qui doit la tester. Les routes dynamiques sont résolues depuis la
// page liste (premier lien trouvé).
const ROUTES = [
  // Public
  ["/", "public"],
  ["/bossiz-portal", "public"],
  ["/bossiz-conciergerie-ci", "public"],
  ["/bossiz-conciergerie-ci/services", "public"],
  ["/bossiz-conciergerie-ci/a-propos", "public"],
  ["/bossiz-conciergerie-ci/formules", "public"],
  ["/bossiz-conciergerie-sn", "public"],
  ["/bossiz-conciergerie-sn/services", "public"],
  ["/bossiz-conciergerie-sn/a-propos", "public"],
  ["/bossiz-conciergerie-sn/formules", "public"],
  ["/flights", "public"],
  ["/hotels", "public"],
  ["/hotels-partenaires", "public"],
  ["/hotels/partenaires/:id", "public", { from: "/hotels-partenaires", prefix: "/hotels/partenaires/" }],
  ["/cars", "public"],
  ["/tours", "public"],
  ["/restaurants", "public"],
  ["/artisans", "public"],
  ["/bien-etre-beaute", "public"],
  ["/entreprises", "public"],
  ["/culture", "public"],
  ["/culture/:slug", "public", { from: "/culture", prefix: "/culture/" }],
  ["/destinations", "public"],
  ["/destinations/:id", "public", { from: "/destinations", prefix: "/destinations/" }],
  ["/activities", "public"],
  ["/stays", "public"],
  ["/events", "public"],
  ["/events/:slug", "public", { from: "/events", prefix: "/events/" }],
  ["/trains", "public"],
  ["/flight-hotel", "public"],
  ["/auth", "public"],
  ["/forgot-password", "public"],
  ["/reset-password", "public"],
  ["/actualites", "public"],
  ["/actualites/:slug", "public", { from: "/actualites", prefix: "/actualites/" }],
  ["/bossiz-impact", "public"],
  ["/bossiz-impact/:slug", "public", { from: "/bossiz-impact", prefix: "/bossiz-impact/" }],
  ["/verifier-membre/TEST0000", "public"],
  ["/flight-comparison", "public"],
  ["/help", "public"],
  ["/contact", "public"],
  ["/partenariat", "public"],
  ["/devenir-partenaire", "public"],
  ["/partenaires/voitures", "public"],
  ["/support", "public"],
  ["/support/:categoryId", "public", { from: "/support", prefix: "/support/" }],
  ["/privacy", "public"],
  ["/terms", "public"],
  ["/install", "public"],
  ["/install/android", "public"],
  ["/install/ios", "public"],
  ["/privacy-policy", "public"],
  ["/terms-of-service", "public"],
  ["/politique-cookies", "public"],
  ["/cookie-policy", "public"],
  ["/mentions-legales", "public"],
  ["/documentation", "public"],
  ["/documentations", "public"],
  ["/compatibility", "public"],
  ["/page-qui-nexiste-pas", "public"],
  // Client connecté
  ["/dashboard", "client"],
  ["/booking-history", "client"],
  ["/mes-avis", "client"],
  ["/mon-impact", "client"],
  ["/account", "client"],
  ["/ma-carte", "client"],
  ["/smiles", "client"],
  ["/price-alerts", "client"],
  ["/payment", "client"],
  ["/confirmation", "client"],
  ["/booking-process", "client"],
  ["/booking/hotel", "client"],
  ["/flight-hotel/booking", "client"],
  ["/subscription-payment", "client"],
  ["/order-summary", "client"],
  ["/company/dashboard", "client"],
  // Partenaire
  ["/agency", "partner"],
  ["/agency/services", "partner"],
  ["/agency/hotel-bookings", "partner"],
  ["/agency/restaurants", "partner"],
  ["/agency/artisans", "partner"],
  ["/agency/wellness", "partner"],
  ["/agency/activities", "partner"],
  ["/agency/stays", "partner"],
  ["/agency/promotions", "partner"],
  ["/agency/settings", "partner"],
  ["/agency/orders", "partner"],
  ["/agency/finances", "partner"],
  ["/agency/reviews", "partner"],
  ["/agency/customers", "partner"],
  ["/agency/support", "partner"],
  ["/agency/rates", "partner"],
  // Admin : testées ici en CLIENT pour vérifier qu'un non-admin est bien refoulé.
  ...[
    "",
    "/bookings",
    "/services",
    "/activities",
    "/stays",
    "/users",
    "/subscriptions",
    "/subscription-plans",
    "/smiles",
    "/promotions",
    "/email-templates",
    "/configuration",
    "/agencies",
    "/partner-applications",
    "/commissions",
    "/support",
    "/monitoring",
    "/car-partner-plans",
    "/advertisements",
    "/payments",
    "/reviews",
    "/newsletter",
    "/translations",
    "/culture",
    "/events",
    "/hotel-commissions",
    "/partner-categories",
    "/actualites",
    "/impact",
    "/destinations",
    "/content",
    "/bossiz-sites",
    "/bossiz-microsites",
    "/integrations",
    "/homepage-config",
    "/users-list",
  ].map((p) => [`/admin${p}`, "admin"]),
];

const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const mobile = { ...devices["iPhone 13"], browserName: "chromium" };

async function login(context, email, password) {
  const page = await context.newPage();
  await page.goto(`${BASE}/auth`, { waitUntil: "load", timeout: 60000 });
  await waitForApp(page);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 30000 }).catch(() => {});
  const ok = !new URL(page.url()).pathname.startsWith("/auth");
  await page.close();
  return ok;
}

// Attend la fin de l'écran de démarrage (logo animé) et des chargements de
// page (même .loader-container), puis que le réseau se calme.
async function waitForApp(page) {
  await page
    .waitForFunction(
      () => !document.querySelector(".loader-container") && (document.body?.innerText || "").trim().length > 80,
      null,
      { timeout: 25000 },
    )
    .catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function resolveDynamic(context, spec) {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}${spec.from}`, { waitUntil: "load", timeout: 60000 });
    await waitForApp(page);
    const href = await page.evaluate((prefix) => {
      const a = [...document.querySelectorAll("a[href]")]
        .map((x) => x.getAttribute("href"))
        .find((h) => h && h.startsWith(prefix) && h.length > prefix.length);
      return a || null;
    }, spec.prefix);
    return href;
  } finally {
    await page.close();
  }
}

async function visit(context, route, role) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failed = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => pageErrors.push(String(e.message || e).slice(0, 300)));
  page.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 400 && (u.includes("supabase.co") || u.startsWith(BASE)))
      failed.push(`${r.status()} ${r.request().method()} ${u.replace(/\?.*$/, "").slice(0, 160)}`);
  });
  page.on("requestfailed", (r) => {
    const u = r.url();
    const err = r.failure()?.errorText || "";
    if (/ERR_ABORTED|NS_BINDING_ABORTED/.test(err)) return;
    if (u.includes("supabase.co") || u.startsWith(BASE)) failed.push(`ÉCHEC ${u.slice(0, 160)} (${err})`);
  });

  const start = Date.now();
  let status = null;
  let navError = null;
  try {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60000 });
    status = res?.status() ?? null;
    await waitForApp(page);
  } catch (e) {
    navError = String(e.message || e).split("\n")[0];
  }
  const loadMs = Date.now() - start;

  const info = await page
    .evaluate(() => {
      const text = document.body?.innerText || "";
      const h1 = document.querySelector("h1")?.innerText?.trim() || "";
      return {
        title: document.title,
        h1: h1.slice(0, 120),
        textLength: text.length,
        errorBoundary: text.includes("Une erreur s'est produite"),
        notFound: /\b404\b|page introuvable|page not found/i.test(text),
        overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        snippet: text.replace(/\s+/g, " ").slice(0, 220),
      };
    })
    .catch(() => ({}));

  const finalPath = (() => {
    try {
      const u = new URL(page.url());
      return u.pathname + u.search;
    } catch {
      return page.url();
    }
  })();
  const shot = `${route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home"}__${role}.jpg`;
  await page.screenshot({ path: path.join(OUT, "shots", shot), type: "jpeg", quality: 45 }).catch(() => {});
  await page.close();

  return {
    route,
    role,
    status,
    navError,
    finalPath,
    redirected: finalPath.split("?")[0] !== route.split("?")[0],
    loadMs,
    ...info,
    consoleErrors: [...new Set(consoleErrors)].slice(0, 8),
    pageErrors: [...new Set(pageErrors)].slice(0, 8),
    failedRequests: [...new Set(failed)].slice(0, 10),
    shot,
  };
}

const browser = await chromium.launch();
const contexts = {};
const auth = {};
async function ctx(role) {
  const key = role === "admin" ? "client" : role;
  if (contexts[key]) return contexts[key];
  const c = await browser.newContext({ ...mobile, locale: "fr-FR", serviceWorkers: "block" });
  // Bandeau cookies : réponse « essentiels seulement » enregistrée d'avance
  // (même format que src/hooks/useCookieConsent.ts), pour ne pas masquer les pages.
  await c.addInitScript(() => {
    try {
      localStorage.setItem(
        "bossiz-cookie-consent",
        JSON.stringify({
          version: 1,
          consent: { essential: true, preferences: false, analytics: false, decidedAt: new Date().toISOString() },
        }),
      );
    } catch {}
  });
  if (key === "client") auth.client = await login(c, process.env.CLIENT_EMAIL, process.env.CLIENT_PASSWORD);
  if (key === "partner") {
    auth.partner = process.env.PARTNER_EMAIL
      ? await login(c, process.env.PARTNER_EMAIL, process.env.PARTNER_PASSWORD)
      : false;
  }
  contexts[key] = c;
  return c;
}

const results = [];
for (const [pattern, role, dyn] of ROUTES) {
  if (ONLY && !ONLY.includes(pattern)) continue;
  if (role === "partner" && !process.env.PARTNER_EMAIL) {
    results.push({ route: pattern, role, skipped: "pas de compte partenaire fourni" });
    continue;
  }
  const c = await ctx(role);
  let route = pattern;
  if (dyn) {
    const href = await resolveDynamic(c, dyn).catch(() => null);
    if (!href) {
      results.push({ route: pattern, role, skipped: `aucun lien ${dyn.prefix}… trouvé sur ${dyn.from}` });
      console.log(`- ${pattern} : aucun élément à ouvrir`);
      continue;
    }
    route = href;
  }
  const r = await visit(c, route, role);
  r.pattern = pattern;
  results.push(r);
  const flags = [
    r.navError && "NAV",
    r.errorBoundary && "CRASH",
    r.pageErrors.length && "JS",
    r.failedRequests.length && "REQ",
    r.overflowPx > 1 && "OVERFLOW",
    r.redirected && `→${r.finalPath}`,
  ].filter(Boolean);
  console.log(`${flags.length ? "!" : "✓"} [${role}] ${route} ${r.loadMs}ms ${flags.join(" ")}`);
}

fs.writeFileSync(
  path.join(OUT, "results.json"),
  JSON.stringify({ base: BASE, at: new Date().toISOString(), auth, results }, null, 2),
);
await browser.close();
console.log(`\n${results.length} pages, rapport : ${path.join(OUT, "results.json")}`);
