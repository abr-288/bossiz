import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Programme de fidélité « Smiles Bossiz+ » : les calculs (gains, niveaux,
// plafonds) sont faits côté base ; ce hook ne fait que lire.

export interface LoyaltyTier {
  code: string;
  name: string;
  min_points: number;
  multiplier: number;
}

export interface LoyaltySettings {
  points_per_100_xof: number;
  point_value_xof: number;
  daily_checkin_points: number;
  streak_days: number;
  streak_bonus_points: number;
  referral_referrer_points: number;
  referral_referee_points: number;
  min_redeem_points: number;
  max_redeem_ratio: number;
}

export interface LoyaltySummary {
  balance: number;
  pending: number;
  lifetime: number;
  tier: LoyaltyTier | null;
  next_tier: LoyaltyTier | null;
  referral_code: string;
  referred: boolean;
  referrals: number;
  streak: number;
  checked_in_today: boolean;
  settings: LoyaltySettings;
}

export interface LoyaltyTransaction {
  id: string;
  kind: string;
  points: number;
  status: string;
  description: string | null;
  created_at: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { code: "bronze", name: "Bronze", min_points: 0, multiplier: 1 },
  { code: "silver", name: "Argent", min_points: 5000, multiplier: 1.25 },
  { code: "gold", name: "Or", min_points: 20000, multiplier: 1.5 },
  { code: "platinum", name: "Platine", min_points: 50000, multiplier: 2 },
];

export const fetchLoyaltySummary = async (): Promise<LoyaltySummary | null> => {
  const { data, error } = await supabase.rpc("loyalty_get_summary");
  if (error || !data) return null;
  return data as unknown as LoyaltySummary;
};

// Smiles utilisables sur un paiement : mêmes règles que process-payment
// (minimum, part maximale du montant, au moins 100 XOF restant à payer).
export const maxRedeemablePoints = (summary: LoyaltySummary, amountXof: number): number => {
  const { point_value_xof: value, max_redeem_ratio: ratio, min_redeem_points: min } = summary.settings;
  if (!value || amountXof <= 100) return 0;
  const max = Math.min(
    summary.balance,
    Math.floor((amountXof * Number(ratio)) / value),
    Math.floor((amountXof - 100) / value),
  );
  return max >= min ? max : 0;
};

export function useLoyalty() {
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [nextSummary, { data: rows }] = await Promise.all([
      fetchLoyaltySummary(),
      supabase
        .from("loyalty_transactions")
        .select("id, kind, points, status, description, created_at")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(60),
    ]);
    setSummary(nextSummary);
    setTransactions((rows as LoyaltyTransaction[] | null) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const checkIn = useCallback(async () => {
    const { data, error } = await supabase.rpc("loyalty_daily_checkin");
    await refresh();
    return error ? null : (data as { awarded: boolean; points?: number; bonus?: number; streak: number });
  }, [refresh]);

  return { summary, transactions, loading, refresh, checkIn };
}
