// Utilitaires des événements (sync-events, create-event-order).

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Taux de secours si le service de taux en direct ne répond pas.
const FALLBACK_TO_XOF: Record<string, number> = {
  XOF: 1,
  EUR: 655.957,
  USD: 602.123,
  GBP: 785.234,
  CHF: 703.891,
};

// Taux « 1 unité = X FCFA » pour toutes les devises connues du service
// exchangerate-api (gratuit, sans clé), sinon les taux fixes ci-dessus.
export async function loadRatesToXof(): Promise<Record<string, number>> {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/XOF", { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rates: Record<string, number> = { XOF: 1 };
    for (const [code, perXof] of Object.entries(data.rates ?? {})) {
      const value = Number(perXof);
      if (value > 0) rates[code] = 1 / value;
    }
    return rates;
  } catch (error) {
    console.error("Taux de change indisponibles, taux fixes utilisés:", error instanceof Error ? error.message : error);
    return FALLBACK_TO_XOF;
  }
}

// Montant converti en FCFA, ou null si la devise est inconnue (jamais 1:1).
export function toXof(amount: number | null | undefined, currency: string | null | undefined, rates: Record<string, number>): number | null {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount)) || !currency) return null;
  const rate = rates[currency.toUpperCase()];
  return rate ? Math.round(Number(amount) * rate) : null;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

/** booking_details d'une commande de billets par la conciergerie (champs lus). */
export interface EventOrderDetails {
  kind?: string;
  conciergeStatus?: string;
  eventName?: string;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
  localDate?: string;
  localTime?: string | null;
  quantity?: number;
  tier?: string;
  feeXof?: number;
  [key: string]: unknown;
}

export interface ConciergeConfig {
  enabled: boolean;
  feePercent: number;
  minFeeXof: number;
  maxTickets: number;
}

export async function loadConciergeConfig(supabase: SupabaseClient): Promise<ConciergeConfig> {
  const { data } = await supabase.from("site_config").select("config_value").eq("config_key", "event_concierge").maybeSingle();
  const value = (data?.config_value ?? {}) as Partial<ConciergeConfig>;
  return {
    enabled: value.enabled !== false,
    feePercent: Number.isFinite(Number(value.feePercent)) ? Math.min(Math.max(Number(value.feePercent), 0), 100) : 15,
    minFeeXof: Number.isFinite(Number(value.minFeeXof)) ? Math.max(Number(value.minFeeXof), 0) : 10000,
    maxTickets: Number.isFinite(Number(value.maxTickets)) ? Math.min(Math.max(Math.round(Number(value.maxTickets)), 1), 20) : 8,
  };
}

// Frais de service de la conciergerie sur un sous-total de billets.
export function conciergeFee(subtotalXof: number, config: ConciergeConfig): number {
  return Math.max(Math.round(subtotalXof * config.feePercent / 100), config.minFeeXof);
}
