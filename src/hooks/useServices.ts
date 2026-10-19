import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalizedRows } from "@/lib/translatableContent";

type ServiceType = "car" | "event" | "flight" | "flight_hotel" | "hotel" | "tour";

export const useServices = (type?: ServiceType) => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, [type]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('services')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const localized = useLocalizedRows(services);
  return { services: localized, loading, error, refetch: fetchServices };
};
