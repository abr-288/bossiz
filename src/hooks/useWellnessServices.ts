import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { OpeningHours } from "@/hooks/useRestaurants";

/** Soin proposé (colonne JSON treatments). */
export interface WellnessTreatment {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  duration_minutes?: number;
}

export type WellnessService = Omit<Tables<"wellness_services">, "opening_hours" | "treatments"> & {
  opening_hours: OpeningHours;
  treatments: WellnessTreatment[];
};

export const toWellnessService = (row: Tables<"wellness_services">): WellnessService => ({
  ...row,
  opening_hours: (row.opening_hours ?? {}) as unknown as OpeningHours,
  treatments: Array.isArray(row.treatments) ? (row.treatments as unknown as WellnessTreatment[]) : [],
});
import { useLocalizedRows } from "@/lib/translatableContent";

export const useWellnessServices = () => {
  const [wellnessServices, setWellnessServices] = useState<WellnessService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWellnessServices = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('wellness_services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setWellnessServices((data || []).map(toWellnessService));
      setError(null);
    } catch (err) {
      console.error('Error fetching wellness services:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWellnessServices();
  }, [fetchWellnessServices]);

  const localized = useLocalizedRows(wellnessServices);
  return { wellnessServices: localized, loading, error, refetch: fetchWellnessServices };
};
