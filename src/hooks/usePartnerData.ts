import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Fn = Database["public"]["Functions"];

export type PartnerOrder = Fn["agency_orders"]["Returns"][number];
export type FinanceTransaction = Fn["agency_finance_transactions"]["Returns"][number];
export type PartnerCustomer = Fn["agency_customers"]["Returns"][number];
export type PartnerReview = Fn["agency_reviews"]["Returns"][number];
export type CommissionRateChange = Fn["agency_commission_rate_history"]["Returns"][number];

export interface FinanceSummary {
  transactions: number;
  gross: number;
  commission: number;
  net: number;
  paid_out: number;
  pending_payout: number;
  due_to_bossiz: number;
}

// Période [from, to] en dates locales AAAA-MM-JJ, bornes incluses ; null =
// sans limite.
export interface FinancePeriod {
  from: string | null;
  to: string | null;
}

const toNumber = (value: unknown) => (typeof value === "number" ? value : Number(value ?? 0) || 0);

export function parseFinanceSummary(value: unknown): FinanceSummary {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    transactions: toNumber(v.transactions),
    gross: toNumber(v.gross),
    commission: toNumber(v.commission),
    net: toNumber(v.net),
    paid_out: toNumber(v.paid_out),
    pending_payout: toNumber(v.pending_payout),
    due_to_bossiz: toNumber(v.due_to_bossiz),
  };
}

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function monthPeriod(offset = 0, now = new Date()): FinancePeriod {
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from: isoDate(start), to: isoDate(end) };
}

export function yearPeriod(now = new Date()): FinancePeriod {
  return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
}

const rpcPeriod = (period: FinancePeriod) => ({ p_from: period.from, p_to: period.to });

export function usePartnerOrders() {
  return useQuery({
    queryKey: ["partner-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("agency_orders");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

// Même fonction SQL pour le tableau de bord et la rubrique Finances : les
// totaux affichés sont identiques par construction.
export function useFinanceSummary(period: FinancePeriod) {
  return useQuery({
    queryKey: ["partner-finance-summary", period.from, period.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("agency_finance_summary", rpcPeriod(period));
      if (error) throw error;
      return parseFinanceSummary(data);
    },
  });
}

export function useFinanceTransactions(period: FinancePeriod) {
  return useQuery({
    queryKey: ["partner-finance-transactions", period.from, period.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("agency_finance_transactions", rpcPeriod(period));
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCommissionRateHistory() {
  return useQuery({
    queryKey: ["partner-commission-rates"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("agency_commission_rate_history");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePartnerReviews() {
  return useQuery({
    queryKey: ["partner-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("agency_reviews");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePartnerCustomers() {
  return useQuery({
    queryKey: ["partner-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("agency_customers");
      if (error) throw error;
      return data ?? [];
    },
  });
}
