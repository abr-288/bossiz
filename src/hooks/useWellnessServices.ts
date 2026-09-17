import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useWellnessServices = () => {
  const [wellnessServices, setWellnessServices] = useState<any[]>([]);
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
      setWellnessServices(data || []);
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

  return { wellnessServices, loading, error, refetch: fetchWellnessServices };
};
