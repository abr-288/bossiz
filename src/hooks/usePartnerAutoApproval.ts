import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Validation automatique des candidatures partenaires, activable depuis
// /admin/partner-applications. Activée : la fonction
// auto-approve-partner-applications valide chaque candidature restée en
// attente plus de delayMinutes (migration 20261017020000).
export const PARTNER_AUTO_APPROVAL_QUERY_KEY = ["site_config", "partner_applications"] as const;
export const DEFAULT_PARTNER_AUTO_APPROVAL_DELAY = 3;

export function usePartnerAutoApproval() {
  const query = useQuery({
    queryKey: PARTNER_AUTO_APPROVAL_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_config")
        .select("config_value")
        .eq("config_key", "partner_applications")
        .maybeSingle();
      if (error) throw error;
      const value = data?.config_value as { autoApprove?: boolean; delayMinutes?: number } | null;
      return {
        autoApprove: value?.autoApprove === true,
        delayMinutes: typeof value?.delayMinutes === "number" ? value.delayMinutes : DEFAULT_PARTNER_AUTO_APPROVAL_DELAY,
      };
    },
    staleTime: 60_000,
  });

  return {
    autoApprove: query.data?.autoApprove ?? false,
    delayMinutes: query.data?.delayMinutes ?? DEFAULT_PARTNER_AUTO_APPROVAL_DELAY,
    loading: query.isLoading,
  };
}
