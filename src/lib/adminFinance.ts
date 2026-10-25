import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Tableau de bord admin et page Commissions : les chiffres viennent des
// fonctions SQL admin_dashboard et admin_finance_transactions, calculées sur
// les mêmes lignes que la rubrique Finances des partenaires.

export type FinanceTransaction = Database["public"]["Functions"]["admin_finance_transactions"]["Returns"][number];

// ---------------------------------------------------------------------------
// Périodes
// ---------------------------------------------------------------------------
// "all" (depuis le début) n'existe que sur la page Commissions.
export type PeriodPreset = "today" | "7d" | "30d" | "month" | "last_month" | "year" | "all" | "custom";

export interface Period {
  preset: PeriodPreset;
  from: string;
  to: string;
}

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Aujourd'hui",
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  month: "Ce mois-ci",
  last_month: "Mois dernier",
  year: "Cette année",
  all: "Depuis le début",
  custom: "Période personnalisée",
};

// Date locale au format AAAA-MM-JJ (pas toISOString, qui passe en UTC).
export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function periodFromPreset(preset: Exclude<PeriodPreset, "custom">, now = new Date()): Period {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = (n: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);
  switch (preset) {
    case "today":
      return { preset, from: isoDay(today), to: isoDay(today) };
    case "7d":
      return { preset, from: isoDay(daysAgo(6)), to: isoDay(today) };
    case "30d":
      return { preset, from: isoDay(daysAgo(29)), to: isoDay(today) };
    case "month":
      return { preset, from: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)), to: isoDay(today) };
    case "last_month":
      return {
        preset,
        from: isoDay(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        to: isoDay(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
    case "year":
      return { preset, from: isoDay(new Date(today.getFullYear(), 0, 1)), to: isoDay(today) };
    case "all":
      return { preset, from: "", to: "" };
  }
}

export const formatDay = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) =>
  iso
    ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...opts,
      })
    : "—";

export const formatXof = (amount: number | string | null | undefined) =>
  `${Math.round(Number(amount ?? 0)).toLocaleString("fr-FR")} FCFA`;

// Variation en % par rapport à la période précédente (null si rien avant).
export function change(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

// ---------------------------------------------------------------------------
// Activités
// ---------------------------------------------------------------------------
export const ACTIVITY_LABELS: Record<string, string> = {
  hotel: "Hôtels",
  flight: "Vols",
  car: "Location de voitures",
  activity: "Activités et circuits",
  stay: "Séjours",
  event: "Événements",
  flight_hotel: "Vol + hôtel",
  train: "Trains",
  restaurant: "Restaurants",
  wellness: "Bien-être",
  artisan: "Artisans",
  subscription: "Abonnements",
  impact: "Bossiz Impact",
  other: "Autres",
};

export const activityLabel = (key: string) => ACTIVITY_LABELS[key] ?? key;

// Type d'une ligne de commission (page Commissions).
export const SOURCE_LABELS: Record<string, string> = {
  restaurant_reservation: "Restaurant",
  wellness_booking: "Bien-être",
  artisan_order: "Artisan",
  hotel_on_site: "Hôtel payé sur place",
};

export const sourceLabel = (sourceType: string) => SOURCE_LABELS[sourceType] ?? "Réservation";

// ---------------------------------------------------------------------------
// Reversements : un seul statut lisible au lieu de status + payout_status.
// ---------------------------------------------------------------------------
export type PayoutKey = "scheduled" | "manual" | "in_progress" | "blocked" | "paid" | "cancelled";

export const PAYOUT_FILTERS: { key: PayoutKey; label: string }[] = [
  { key: "manual", label: "À verser manuellement" },
  { key: "scheduled", label: "Programmé (Jèko)" },
  { key: "in_progress", label: "Virement en cours" },
  { key: "blocked", label: "Bloqué" },
  { key: "paid", label: "Versé" },
  { key: "cancelled", label: "Annulé" },
];

export interface PayoutState {
  key: PayoutKey;
  label: string;
  tone: "default" | "secondary" | "destructive" | "outline";
  hint?: string;
}

export function payoutState(
  t: Pick<FinanceTransaction, "status" | "payout_status" | "payout_due_at" | "payout_error">,
): PayoutState {
  if (t.status === "cancelled") return { key: "cancelled", label: "Annulé", tone: "outline", hint: "Commande annulée" };
  if (t.status === "paid" || t.payout_status === "paid") return { key: "paid", label: "Versé", tone: "default" };
  switch (t.payout_status) {
    case "ready":
      return {
        key: "scheduled",
        label: "Programmé",
        tone: "secondary",
        hint: t.payout_due_at ? `Versement automatique le ${formatDay(t.payout_due_at)}` : "Versement automatique Jèko",
      };
    case "processing":
      return {
        key: "in_progress",
        label: "Virement en cours",
        tone: "secondary",
        hint: "Transfert en cours chez Jèko",
      };
    case "awaiting_details":
      return {
        key: "blocked",
        label: "Bloqué",
        tone: "destructive",
        hint: t.payout_error || "Coordonnées de versement du partenaire manquantes",
      };
    case "failed":
      return { key: "blocked", label: "Bloqué", tone: "destructive", hint: t.payout_error || "Échec du virement Jèko" };
    case "needs_review":
      return {
        key: "blocked",
        label: "Bloqué",
        tone: "destructive",
        hint: t.payout_error || "Statut à vérifier dans le tableau de bord Jèko",
      };
    default:
      return {
        key: "manual",
        label: "À verser manuellement",
        tone: "secondary",
        hint: "Hors versement automatique : à virer puis marquer comme versé",
      };
  }
}

// Même règle qu'avant la refonte : pas de saisie manuelle quand Jèko gère le
// versement (programmé, en cours ou à vérifier).
export const canMarkPaid = (t: Pick<FinanceTransaction, "status" | "payout_status" | "collection">) =>
  t.collection === "online" &&
  t.status === "pending" &&
  !["ready", "processing", "needs_review"].includes(t.payout_status ?? "");

// Commissions des hôtels payés sur place (dues par le partenaire à Bossiz).
export const ONSITE_STATUS: Record<string, { label: string; tone: PayoutState["tone"] }> = {
  to_invoice: { label: "À facturer", tone: "secondary" },
  issued: { label: "Facturée, à encaisser", tone: "secondary" },
  paid: { label: "Encaissée", tone: "default" },
};

// ---------------------------------------------------------------------------
// Tableau de bord
// ---------------------------------------------------------------------------
export interface ActivityRow {
  activity: string;
  orders: number;
  pending: number;
  volume: number;
  gain: number;
  prev_orders: number;
  prev_volume: number;
  prev_gain: number;
}

export interface DashboardData {
  from: string;
  to: string;
  prev_from: string;
  prev_to: string;
  granularity: "day" | "month";
  totals: {
    orders: number;
    pending: number;
    volume: number;
    gain: number;
    gain_subscriptions: number;
    impact: number;
    collected: number;
    prev_orders: number;
    prev_volume: number;
    prev_gain: number;
    prev_impact: number;
    prev_collected: number;
  };
  activities: ActivityRow[];
  series: { period: string; volume: number; gain: number; orders: number }[];
  balances: { due_to_partners: number; payout_issues: number; onsite_to_collect: number };
  tasks: { key: string; count: number }[];
}

const num = (v: unknown) => Number(v ?? 0);
const numbers = <T extends string>(o: unknown, keys: readonly T[]) =>
  Object.fromEntries(keys.map((k) => [k, num((o as Record<string, unknown> | null)?.[k])])) as Record<T, number>;

export function parseDashboard(raw: unknown): DashboardData {
  const v = (raw ?? {}) as Record<string, unknown>;
  const list = (x: unknown) => (Array.isArray(x) ? x : []) as Record<string, unknown>[];
  return {
    from: String(v.from ?? ""),
    to: String(v.to ?? ""),
    prev_from: String(v.prev_from ?? ""),
    prev_to: String(v.prev_to ?? ""),
    granularity: v.granularity === "month" ? "month" : "day",
    totals: numbers(v.totals, [
      "orders",
      "pending",
      "volume",
      "gain",
      "gain_subscriptions",
      "impact",
      "collected",
      "prev_orders",
      "prev_volume",
      "prev_gain",
      "prev_impact",
      "prev_collected",
    ] as const),
    activities: list(v.activities).map((a) => ({
      activity: String(a.activity),
      ...numbers(a, ["orders", "pending", "volume", "gain", "prev_orders", "prev_volume", "prev_gain"] as const),
    })),
    series: list(v.series).map((s) => ({
      period: String(s.period),
      ...numbers(s, ["volume", "gain", "orders"] as const),
    })),
    balances: numbers(v.balances, ["due_to_partners", "payout_issues", "onsite_to_collect"] as const),
    tasks: list(v.tasks).map((t) => ({ key: String(t.key), count: num(t.count) })),
  };
}

export const TASKS: Record<string, { label: (n: number) => string; href: string }> = {
  partner_applications: {
    label: (n) => (n > 1 ? `${n} candidatures partenaires à examiner` : "1 candidature partenaire à examiner"),
    href: "/admin/partner-applications",
  },
  paid_bookings_to_confirm: {
    label: (n) => (n > 1 ? `${n} réservations payées à confirmer` : "1 réservation payée à confirmer"),
    href: "/admin/bookings",
  },
  reviews: {
    label: (n) => (n > 1 ? `${n} avis clients à modérer` : "1 avis client à modérer"),
    href: "/admin/reviews",
  },
  support_tickets: {
    label: (n) => (n > 1 ? `${n} demandes de support partenaire ouvertes` : "1 demande de support partenaire ouverte"),
    href: "/admin/support",
  },
  payout_issues: {
    label: (n) => (n > 1 ? `${n} reversements partenaires bloqués` : "1 reversement partenaire bloqué"),
    href: "/admin/commissions?tab=payouts&status=blocked",
  },
  onsite_invoices_overdue: {
    label: (n) => (n > 1 ? `${n} factures hôtels sur place en retard` : "1 facture hôtel sur place en retard"),
    href: "/admin/hotel-commissions",
  },
  artisan_requests_waiting: {
    label: (n) =>
      n > 1 ? `${n} demandes artisan sans réponse depuis 48 h` : "1 demande artisan sans réponse depuis 48 h",
    href: "/admin/agencies",
  },
};

export function useAdminDashboard(period: Period) {
  return useQuery({
    queryKey: ["admin-dashboard", period.from, period.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard", { p_from: period.from, p_to: period.to });
      if (error) throw error;
      return parseDashboard(data);
    },
    staleTime: 60_000,
  });
}

export function useAdminFinanceTransactions(period: Period) {
  return useQuery({
    queryKey: ["admin-finance-transactions", period.from, period.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_finance_transactions", {
        p_from: period.from || null,
        p_to: period.to || null,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}
