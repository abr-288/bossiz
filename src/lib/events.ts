import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Baby, Drama, Landmark, Music, PartyPopper, Sparkles, Trophy, type LucideIcon } from "lucide-react";

// Catalogue d'événements (migration 20261018030000) : importé de Ticketmaster
// par sync-events, présenté en français par l'agent IA (curate-events).

export type EventCategory = "concert" | "sport" | "theatre" | "festival" | "family" | "exhibition" | "other";

export const EVENT_CATEGORIES: { value: EventCategory; label: string; icon: LucideIcon }[] = [
  { value: "concert", label: "Concerts", icon: Music },
  { value: "sport", label: "Sport", icon: Trophy },
  { value: "theatre", label: "Spectacles", icon: Drama },
  { value: "festival", label: "Festivals", icon: PartyPopper },
  { value: "family", label: "En famille", icon: Baby },
  { value: "exhibition", label: "Expositions", icon: Landmark },
  { value: "other", label: "Autres", icon: Sparkles },
];

export const eventCategory = (value: string) =>
  EVENT_CATEGORIES.find((c) => c.value === value) ?? EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1];

/** booking_details d'une commande de billets achetés par la conciergerie. */
export interface EventOrderDetails {
  kind: "event_concierge";
  conciergeStatus: string;
  eventId: string;
  eventSlug: string;
  eventName: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  localDate: string;
  localTime: string | null;
  quantity: number;
  tier: string;
  unitPriceXof: number;
  subtotalXof: number;
  feeXof: number;
  feePercent: number;
  sourcePrice: string | null;
  ticketUrl: string | null;
  purchasedAt?: string;
  ticketsInfo?: string | null;
  ticketLinks?: string[];
  unavailableAt?: string;
  unavailableReason?: string | null;
}

export interface EventItem {
  id: string;
  source: "ticketmaster" | "bossiz";
  slug: string;
  name: string;
  info: string | null;
  summary_fr: string | null;
  ai_tags: string[];
  highlight_score: number | null;
  category: EventCategory;
  genre: string | null;
  status: "scheduled" | "cancelled" | "postponed" | "rescheduled" | "offsale";
  starts_at: string | null;
  local_date: string;
  local_time: string | null;
  timezone: string | null;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  price_min: number | null;
  price_max: number | null;
  price_currency: string | null;
  price_min_xof: number | null;
  price_max_xof: number | null;
  ticket_url: string | null;
  onsale_start: string | null;
  is_featured: boolean;
  is_published: boolean;
}

export const EVENT_STATUS_LABEL: Record<string, string> = {
  cancelled: "Annulé",
  postponed: "Reporté",
  rescheduled: "Date modifiée",
  offsale: "Vente terminée",
};

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["fr"], { type: "region" }) : null;

export const countryName = (code: string | null | undefined, fallback?: string | null) => {
  if (!code) return fallback ?? "";
  try {
    return regionNames?.of(code.toUpperCase()) ?? fallback ?? code;
  } catch {
    return fallback ?? code;
  }
};

export const countryFlag = (code: string | null | undefined) =>
  code && /^[A-Za-z]{2}$/.test(code)
    ? String.fromCodePoint(
        ...code
          .toUpperCase()
          .split("")
          .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
      )
    : "";

export const formatFcfa = (amount: number) => `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;

export const eventDate = (
  event: Pick<EventItem, "local_date">,
  options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" },
) => new Date(`${event.local_date}T00:00:00`).toLocaleDateString("fr-FR", options);

export function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export interface ConciergeSettings {
  enabled: boolean;
  feePercent: number;
  minFeeXof: number;
  maxTickets: number;
}

const DEFAULT_CONCIERGE: ConciergeSettings = { enabled: true, feePercent: 15, minFeeXof: 10000, maxTickets: 8 };

// Même calcul que le serveur (_shared/events.ts) ; le montant facturé est
// toujours recalculé par create-event-order.
export const conciergeFee = (subtotal: number, settings: ConciergeSettings) =>
  Math.max(Math.round((subtotal * settings.feePercent) / 100), settings.minFeeXof);

export function useConciergeSettings() {
  return useQuery({
    queryKey: ["site_config", "event_concierge"],
    queryFn: async (): Promise<ConciergeSettings> => {
      const { data } = await supabase
        .from("site_config")
        .select("config_value")
        .eq("config_key", "event_concierge")
        .maybeSingle();
      const value = (data?.config_value ?? {}) as Partial<ConciergeSettings>;
      return { ...DEFAULT_CONCIERGE, ...value };
    },
    staleTime: 5 * 60_000,
  });
}

// Achat possible par la conciergerie : prix connu, en vente, au moins 2 jours avant.
export function purchaseBlocker(event: EventItem, settings: ConciergeSettings | undefined): string | null {
  if (settings && !settings.enabled) return "L'achat de billets est momentanément indisponible.";
  if (event.source !== "ticketmaster") return "Billetterie bientôt disponible.";
  if (event.status === "cancelled") return "Cet événement est annulé.";
  if (event.status === "offsale") return "La vente des billets est terminée.";
  const minDate = isoDate(new Date(Date.now() + 2 * 86_400_000));
  if (event.local_date < minDate) return "Événement trop proche pour un achat par la conciergerie.";
  if (!event.price_min_xof) return "Prix non communiqué par l'organisateur.";
  return null;
}

export const EVENT_LIST_COLUMNS =
  "id, source, slug, name, summary_fr, ai_tags, highlight_score, category, genre, status, local_date, local_time, venue_name, city, country, country_code, image_url, price_min_xof, price_max_xof, is_featured";

export function useEventCountries() {
  return useQuery({
    queryKey: ["site_config", "events_sync", "countries"],
    queryFn: async (): Promise<string[]> => {
      const { data } = await supabase
        .from("site_config")
        .select("config_value")
        .eq("config_key", "events_sync")
        .maybeSingle();
      const countries = (data?.config_value as { countries?: string[] } | null)?.countries;
      return Array.isArray(countries) ? countries : [];
    },
    staleTime: 10 * 60_000,
  });
}
