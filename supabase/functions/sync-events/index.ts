import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller, isStaff } from "../_shared/auth.ts";
import { loadRatesToXof, slugify, toXof } from "../_shared/events.ts";

// ============================================================
// EDGE FUNCTION: sync-events
// Importe les événements à venir de Ticketmaster (Discovery API) dans
// public.events, pays par pays (site_config 'events_sync'). Appelée chaque
// nuit par pg_cron et à la demande depuis /admin/events. Ne touche pas aux
// champs rédigés par l'agent IA ni aux choix de l'admin (mise à la une,
// publication). Un appel non-admin moins de 30 minutes après le précédent
// ne fait rien (quota Ticketmaster : 5 000 appels par jour).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const TM_API = "https://app.ticketmaster.com/discovery/v2/events.json";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface SyncConfig {
  countries: string[];
  perCountry: number;
  daysAhead: number;
  lastRunAt?: string;
  lastResult?: unknown;
}

const STATUS_MAP: Record<string, string> = {
  onsale: "scheduled",
  offsale: "offsale",
  cancelled: "cancelled",
  canceled: "cancelled",
  postponed: "postponed",
  rescheduled: "rescheduled",
};

// Événement de l'API Discovery de Ticketmaster : seuls les champs lus ici.
interface TmClassification {
  segment?: { name?: string };
  genre?: { name?: string };
  family?: boolean;
}

interface TmImage {
  url?: string;
  ratio?: string;
  width?: number;
  fallback?: boolean;
}

interface TmVenue {
  name?: string;
  postalCode?: string;
  address?: { line1?: string };
  city?: { name?: string };
  country?: { name?: string; countryCode?: string };
  location?: { latitude?: string; longitude?: string };
}

interface TmEvent {
  id?: string;
  name?: string;
  info?: string;
  pleaseNote?: string;
  url?: string;
  classifications?: TmClassification[];
  dates?: {
    start?: { localDate?: string; localTime?: string; dateTime?: string };
    status?: { code?: string };
    timezone?: string;
  };
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  images?: TmImage[];
  sales?: { public?: { startDateTime?: string } };
  _embedded?: { venues?: TmVenue[] };
}

function category(event: TmEvent): string {
  const c: TmClassification = event.classifications?.[0] ?? {};
  const segment = String(c.segment?.name ?? "").toLowerCase();
  const genre = String(c.genre?.name ?? "").toLowerCase();
  if (genre.includes("festival")) return "festival";
  if (c.family === true) return "family";
  if (segment === "music") return "concert";
  if (segment === "sports") return "sport";
  if (segment.includes("arts") || segment.includes("theatre")) return "theatre";
  if (genre.includes("exhibit") || genre.includes("museum")) return "exhibition";
  return "other";
}

function bestImage(images: TmImage[] | undefined): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const sorted = [...images]
    .filter((img) => img?.url)
    .sort((a, b) => {
      const score = (img: { ratio?: string; width?: number; fallback?: boolean }) =>
        (img.ratio === "16_9" ? 1_000_000 : 0) + (img.fallback ? -500_000 : 0) + Math.min(img.width ?? 0, 2048);
      return score(b) - score(a);
    });
  return sorted[0]?.url ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey = Deno.env.get("TICKETMASTER_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  if (!apiKey) return json({ success: false, error: "Secret TICKETMASTER_API_KEY manquant" }, 503);

  const caller = await getCaller(req, supabase);

  // Appelée soit par un admin depuis /admin/events (isStaff), soit par pg_cron
  // qui présente le secret partagé x-cron-secret. Sinon : refus (évite qu'un
  // tiers déclenche des imports Ticketmaster sur la base).
  const cronSecret = Deno.env.get("CRON_SECRET");
  const hasCronSecret = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  if (!isStaff(caller) && !hasCronSecret) {
    return json({ success: false, error: "Accès refusé" }, 401);
  }

  const { data: configRow } = await supabase.from("site_config").select("config_value").eq("config_key", "events_sync").maybeSingle();
  const stored = (configRow?.config_value ?? {}) as Partial<SyncConfig>;
  const config: SyncConfig = {
    countries: Array.isArray(stored.countries) ? stored.countries.map((c) => String(c).toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)) : ["FR", "GB", "US"],
    perCountry: Math.min(Math.max(Number(stored.perCountry) || 200, 20), 800),
    daysAhead: Math.min(Math.max(Number(stored.daysAhead) || 180, 7), 365),
  };

  if (!isStaff(caller) && stored.lastRunAt && Date.now() - new Date(stored.lastRunAt).getTime() < 30 * 60 * 1000) {
    return json({ success: true, skipped: "Synchronisation déjà faite il y a moins de 30 minutes" });
  }

  const rates = await loadRatesToXof();
  const now = new Date();
  const start = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  const end = new Date(now.getTime() + config.daysAhead * 86_400_000).toISOString().replace(/\.\d{3}Z$/, "Z");

  const perCountry: Record<string, number> = {};
  const errors: string[] = [];
  let total = 0;

  for (const country of config.countries) {
    let fetched = 0;
    // Ticketmaster limite la pagination profonde : size × page < 1000.
    for (let page = 0; fetched < config.perCountry && page < 5; page++) {
      const params = new URLSearchParams({
        apikey: apiKey,
        countryCode: country,
        size: String(Math.min(200, config.perCountry - fetched)),
        page: String(page),
        sort: "relevance,desc",
        startDateTime: start,
        endDateTime: end,
        locale: "*",
      });
      const res = await fetch(`${TM_API}?${params}`);
      await sleep(250); // 5 requêtes par seconde au maximum
      if (!res.ok) {
        errors.push(`${country}: HTTP ${res.status}`);
        break;
      }
      const data = await res.json();
      const items: TmEvent[] = data?._embedded?.events ?? [];
      if (items.length === 0) break;

      const rows = items
        .map((event) => {
          const venue: TmVenue = event._embedded?.venues?.[0] ?? {};
          const localDate = event.dates?.start?.localDate;
          if (!event.id || !event.name || !localDate) return null;
          const price = Array.isArray(event.priceRanges) ? event.priceRanges[0] : null;
          const priceMin = price?.min ?? null;
          const priceMax = price?.max ?? price?.min ?? null;
          const info = [event.info, event.pleaseNote].filter(Boolean).join("\n\n").slice(0, 4000) || null;
          const lat = Number(venue.location?.latitude);
          const lon = Number(venue.location?.longitude);
          const idSuffix = String(event.id).toLowerCase().replace(/[^a-z0-9]/g, "").slice(-6) || "tm";
          return {
            source: "ticketmaster",
            external_id: String(event.id),
            slug: `${slugify(event.name) || "evenement"}-${localDate}-${idSuffix}`,
            name: String(event.name).slice(0, 300),
            info,
            category: category(event),
            genre: event.classifications?.[0]?.genre?.name && event.classifications[0].genre.name !== "Undefined"
              ? event.classifications[0].genre.name
              : null,
            status: STATUS_MAP[String(event.dates?.status?.code ?? "onsale").toLowerCase()] ?? "scheduled",
            starts_at: event.dates?.start?.dateTime ?? null,
            local_date: localDate,
            local_time: event.dates?.start?.localTime?.slice(0, 5) ?? null,
            timezone: event.dates?.timezone ?? null,
            venue_name: venue.name ?? null,
            venue_address: [venue.address?.line1, venue.postalCode, venue.city?.name].filter(Boolean).join(", ") || null,
            city: venue.city?.name ?? null,
            country: venue.country?.name ?? null,
            country_code: venue.country?.countryCode ?? country,
            latitude: Number.isFinite(lat) ? lat : null,
            longitude: Number.isFinite(lon) ? lon : null,
            image_url: bestImage(event.images),
            price_min: priceMin,
            price_max: priceMax,
            price_currency: price?.currency ?? null,
            price_min_xof: toXof(priceMin, price?.currency, rates),
            price_max_xof: toXof(priceMax, price?.currency, rates),
            ticket_url: event.url ?? null,
            onsale_start: event.sales?.public?.startDateTime ?? null,
            synced_at: new Date().toISOString(),
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
        // Un même événement deux fois dans un lot ferait échouer l'upsert.
        .filter((row, index, all) => all.findIndex((r) => r.external_id === row.external_id) === index);

      if (rows.length > 0) {
        const { error } = await supabase.from("events").upsert(rows, { onConflict: "source,external_id" });
        if (error) {
          errors.push(`${country}: ${error.message}`);
          break;
        }
      }
      fetched += items.length;
      const totalPages = Number(data?.page?.totalPages ?? 0);
      if (page + 1 >= totalPages) break;
    }
    perCountry[country] = fetched;
    total += fetched;
  }

  const lastResult = { at: new Date().toISOString(), total, perCountry, errors };
  await supabase
    .from("site_config")
    .update({ config_value: { ...stored, ...config, lastRunAt: lastResult.at, lastResult } })
    .eq("config_key", "events_sync");

  return json({ success: errors.length === 0, ...lastResult });
});
