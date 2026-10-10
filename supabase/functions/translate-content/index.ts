import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { getClientIP, checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";
import { TARGET_LANGS, TRANSLATABLE_FIELDS } from "../_shared/translatableFields.ts";

// ============================================================
// EDGE FUNCTION: translate-content
// Traduit en anglais et en chinois les textes saisis en français dans
// l'admin et l'espace partenaire (publicités, promotions, abonnements,
// annonces…). Le résultat va dans la colonne `translations` de la ligne.
//
// - Ne traduit que les champs nouveaux ou modifiés (empreinte du texte
//   français par champ) : appeler la fonction plusieurs fois ne coûte rien
//   tant que rien n'a changé.
// - Une correction faite à la main dans l'admin est conservée tant que le
//   texte français du champ ne change pas.
// - Réservée aux utilisateurs connectés ; plafonnée par appel et par IP.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "claude-opus-5-5";
const MAX_ROWS_PER_CALL = 15;
const IP_LIMIT = { windowMs: 60 * 1000, maxRequests: 20, keyPrefix: "translate-ip" };

const SYSTEM_PROMPT = `Tu traduis les contenus d'un site de réservation de voyages et de services (Bossiz+), basé en Côte d'Ivoire et au Sénégal, du français vers l'anglais ("en") et le chinois simplifié ("zh").

Règles :
- Garde tels quels : les noms de marque (Bossiz, Bossiz+), les noms propres de personnes, d'établissements, de villes et de quartiers, les montants, les devises (FCFA, XOF, F CFA), les moyens de paiement (Wave, MTN, Moov, Orange Money, Jèko), les numéros, e-mails et URL.
- Traduis le sens, avec le ton d'un site commercial ; pas de mot à mot.
- Garde la ponctuation et la mise en forme (retours à la ligne, listes).
- Une liste se traduit élément par élément, dans le même ordre et avec le même nombre d'éléments.
- Ne rajoute ni n'enlève d'information.`;

type Value = string | string[];
type Translations = {
  en?: Record<string, Value>;
  zh?: Record<string, Value>;
  src?: Record<string, string>;
  manual?: { en?: string[]; zh?: string[] };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function fingerprint(value: Value): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

const isFilled = (v: unknown): v is Value =>
  (typeof v === "string" && v.trim() !== "") ||
  (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string"));

// Schéma JSON de la réponse : mêmes champs que la source, pour chaque langue.
function outputSchema(source: Record<string, Value>) {
  const fieldProps: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(source)) {
    fieldProps[field] = Array.isArray(value) ? { type: "array", items: { type: "string" } } : { type: "string" };
  }
  const lang = { type: "object", properties: fieldProps, required: Object.keys(source), additionalProperties: false };
  return {
    type: "object",
    properties: Object.fromEntries(TARGET_LANGS.map((l) => [l, lang])),
    required: [...TARGET_LANGS],
    additionalProperties: false,
  };
}

async function translate(client: Anthropic, source: Record<string, Value>) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: outputSchema(source) } },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Texte français à traduire (JSON) :\n${JSON.stringify(source, null, 2)}` }],
  });
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null;
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;
  try {
    return JSON.parse(text.text) as Record<(typeof TARGET_LANGS)[number], Record<string, Value>>;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ipResult = checkRateLimit(getClientIP(req), IP_LIMIT);
  if (!ipResult.allowed) return createRateLimitResponse(ipResult, IP_LIMIT, corsHeaders);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "ANTHROPIC_API_KEY manquante" }, 503);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Utilisateur connecté obligatoire (la clé publique seule ne suffit pas)
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: userData } = await admin.auth.getUser(token);
  if (!userData?.user) return json({ error: "Connexion requise" }, 401);

  const body = await req.json().catch(() => ({}));
  const tables = typeof body.table === "string"
    ? [body.table].filter((t) => t in TRANSLATABLE_FIELDS)
    : Object.keys(TRANSLATABLE_FIELDS);

  const client = new Anthropic({ apiKey });
  let translated = 0;
  let pending = 0;
  const errors: string[] = [];

  for (const table of tables) {
    const fields = TRANSLATABLE_FIELDS[table];
    const { data: rows, error } = await admin.from(table).select(["id", "translations", ...fields].join(","));
    if (error) {
      // Colonne absente tant que la migration n'est pas appliquée
      errors.push(`${table}: ${error.message}`);
      continue;
    }

    for (const row of (rows ?? []) as unknown as Record<string, unknown>[]) {
      const current: Translations = (row.translations as Translations) ?? {};
      const src = { ...(current.src ?? {}) };
      const changed: Record<string, Value> = {};
      for (const field of fields) {
        const value = row[field];
        if (!isFilled(value)) {
          delete src[field];
          continue;
        }
        const fp = await fingerprint(value);
        if (src[field] !== fp) {
          changed[field] = value;
          src[field] = fp;
        }
      }
      if (Object.keys(changed).length === 0) continue;
      if (translated >= MAX_ROWS_PER_CALL) {
        pending++;
        continue;
      }

      let result;
      try {
        result = await translate(client, changed);
      } catch (e) {
        // Erreur de l'API Claude (clé invalide, crédit épuisé…) : inutile d'insister
        if (e instanceof Anthropic.APIError) {
          const detail = (e.error as { error?: { message?: string } } | undefined)?.error?.message ?? e.message;
          return json({ translated, pending, errors: [`Claude ${e.status ?? ""} : ${detail}`] });
        }
        errors.push(`${table}/${row.id}: ${e instanceof Error ? e.message : "erreur"}`);
        continue;
      }
      if (!result) {
        errors.push(`${table}/${row.id}: réponse inutilisable`);
        continue;
      }

      const next: Translations = { ...current, src };
      const manual = { en: [...(current.manual?.en ?? [])], zh: [...(current.manual?.zh ?? [])] };
      for (const lang of TARGET_LANGS) {
        const langValues = { ...(current[lang] ?? {}) };
        for (const field of Object.keys(changed)) {
          if (isFilled(result[lang]?.[field])) langValues[field] = result[lang][field];
          // Le français a changé : la correction manuelle de ce champ n'est plus valable
          manual[lang] = manual[lang].filter((f) => f !== field);
        }
        next[lang] = langValues;
      }
      next.manual = manual;

      const { error: updateError } = await admin.from(table).update({ translations: next }).eq("id", row.id as string);
      if (updateError) errors.push(`${table}/${row.id}: ${updateError.message}`);
      else translated++;
    }
  }

  return json({ translated, pending, errors: errors.slice(0, 10) });
});
