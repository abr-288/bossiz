import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { rejectIfNotCron } from "../_shared/cronAuth.ts";

// ============================================================
// EDGE FUNCTION: curate-events
// Agent IA de présentation des événements, appelé chaque heure par pg_cron
// (et depuis /admin/events). Pour chaque événement pas encore traité, Claude
// rédige un résumé en français à partir des seules données importées, choisit
// la catégorie, propose des mots-clés et une note d'intérêt (0-100) pour la
// clientèle Bossiz+. Les plus intéressants passent à la une au premier
// passage ; l'admin garde la main ensuite.
// Coût maîtrisé : seuls les événements à venir non traités, 60 par appel au
// plus, par lots de 20. Un appel en double ne retraite rien.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MODEL = "claude-opus-5-5";
const PER_RUN = 60;
const BATCH = 20;
const FEATURED_SCORE = 85;
const CATEGORIES = ["concert", "sport", "theatre", "festival", "family", "exhibition", "other"];

const SYSTEM = `Tu rédiges les fiches événements de Bossiz+, une conciergerie de voyage haut de gamme basée à Abidjan (Côte d'Ivoire). Ses clients — voyageurs d'affaires, familles aisées, amateurs de sorties — achètent par son intermédiaire des billets pour des événements à l'étranger.

Pour chaque événement fourni, tu produis :
- summary_fr : 2 à 3 phrases en français, vivantes et précises, qui disent ce qu'est l'événement, qui se produit ou s'affronte, où et quand. N'utilise QUE les informations fournies : n'invente ni artiste, ni programme, ni prix, ni ambiance. Si les données sont pauvres, reste sobre et factuel. Pas d'emoji, pas de superlatifs creux.
- category : concert, sport, theatre (théâtre, humour, comédie musicale, danse, opéra), festival, family (spectacles pour enfants et familles), exhibition (expositions, salons), other.
- tags : 2 à 5 mots-clés courts en français (genre, type d'artiste, sport, public).
- highlight_score : intérêt de 0 à 100 pour cette clientèle. Élevé (80+) pour les grandes têtes d'affiche internationales, les finales et grands matchs, les comédies musicales et festivals renommés, les artistes africains et afro-diasporiques de premier plan. Moyen pour les événements de qualité mais locaux. Bas pour les événements mineurs, les parkings, les options VIP vendues seules, les visites guidées de stade et les pages techniques.

Renvoie exactement un objet par événement fourni, avec le même id.`;

const SCHEMA = {
  type: "object",
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          summary_fr: { type: "string" },
          category: { type: "string", enum: CATEGORIES },
          tags: { type: "array", items: { type: "string" } },
          highlight_score: { type: "integer" },
        },
        required: ["id", "summary_fr", "category", "tags", "highlight_score"],
        additionalProperties: false,
      },
    },
  },
  required: ["events"],
  additionalProperties: false,
};

interface Curated {
  id: string;
  summary_fr: string;
  category: string;
  tags: string[];
  highlight_score: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const denied = rejectIfNotCron(req, corsHeaders);
  if (denied) return denied;

  if (!Deno.env.get("ANTHROPIC_API_KEY")) return json({ success: false, error: "Secret ANTHROPIC_API_KEY manquant" }, 503);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const client = new Anthropic();
  const today = new Date().toISOString().slice(0, 10);

  const { data: pending, error } = await supabase
    .from("events")
    .select("id, name, info, category, genre, local_date, local_time, venue_name, city, country, price_min, price_max, price_currency, status")
    .is("curated_at", null)
    .eq("is_published", true)
    .gte("local_date", today)
    .order("local_date", { ascending: true })
    .limit(PER_RUN);

  if (error) return json({ success: false, error: error.message }, 500);
  if (!pending?.length) return json({ success: true, curated: 0 });

  let curated = 0;
  const failures: string[] = [];

  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH);
    const payload = batch.map((e) => ({
      id: e.id,
      name: e.name,
      info: e.info?.slice(0, 1200) ?? null,
      genre: e.genre,
      category_guess: e.category,
      date: e.local_date,
      time: e.local_time,
      venue: e.venue_name,
      city: e.city,
      country: e.country,
      price: e.price_min ? `${e.price_min}-${e.price_max ?? e.price_min} ${e.price_currency ?? ""}`.trim() : null,
      status: e.status,
    }));

    try {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
        system: SYSTEM,
        messages: [{ role: "user", content: `Événements à présenter :\n${JSON.stringify(payload)}` }],
      // Paramètres bêta (fallbacks) pas forcément décrits par la version du SDK.
      } as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming);

      if (response.stop_reason === "refusal") {
        failures.push(`lot ${i / BATCH + 1} : refus du modèle`);
        continue;
      }
      if (response.stop_reason === "max_tokens") {
        failures.push(`lot ${i / BATCH + 1} : réponse tronquée`);
        continue;
      }
      const text = response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      const parsed = JSON.parse(text) as { events: Curated[] };
      const byId = new Map(batch.map((e) => [e.id, e]));

      for (const item of parsed.events ?? []) {
        if (!byId.has(item.id)) continue;
        const score = Math.min(Math.max(Math.round(Number(item.highlight_score) || 0), 0), 100);
        const { error: updateError } = await supabase
          .from("events")
          .update({
            summary_fr: String(item.summary_fr).trim().slice(0, 1200),
            category: CATEGORIES.includes(item.category) ? item.category : byId.get(item.id)!.category,
            ai_tags: (item.tags ?? []).map((t) => String(t).trim()).filter(Boolean).slice(0, 5),
            highlight_score: score,
            is_featured: score >= FEATURED_SCORE,
            curated_at: new Date().toISOString(),
          })
          .eq("id", item.id)
          .is("curated_at", null);
        if (updateError) failures.push(`${item.id}: ${updateError.message}`);
        else curated++;
      }
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) {
        failures.push("limite de débit atteinte, reprise à la prochaine heure");
        break;
      }
      if (err instanceof Anthropic.APIError) {
        failures.push(`lot ${i / BATCH + 1} : API ${err.status} ${err.message}`);
      } else {
        failures.push(`lot ${i / BATCH + 1} : ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return json({ success: failures.length === 0, curated, remaining: pending.length - curated, failures });
});
