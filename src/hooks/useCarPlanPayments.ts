import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Paiement des forfaits voiture (Pro, Flotte), activable depuis
// /admin/car-partner-plans. Désactivé : les loueurs publient leurs véhicules
// gratuitement et sans limite. La base applique la même règle via
// public.car_plan_payments_enabled() (migration 20261017010000).
export const CAR_PLAN_PAYMENTS_QUERY_KEY = ["site_config", "car_partner_plans"] as const;

export function useCarPlanPayments() {
  const query = useQuery({
    queryKey: CAR_PLAN_PAYMENTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_config")
        .select("config_value")
        .eq("config_key", "car_partner_plans")
        .maybeSingle();
      if (error) throw error;
      const value = data?.config_value as { paymentsEnabled?: boolean } | null;
      return value?.paymentsEnabled === true;
    },
    staleTime: 60_000,
  });

  return { paymentsEnabled: query.data ?? false, loading: query.isLoading };
}
