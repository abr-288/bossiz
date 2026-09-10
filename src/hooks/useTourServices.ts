import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTourServices = () => {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTourServices = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('type', 'tour')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedTours = (data || []).map((service) => {
        const specs = (service.specifications as any) || {};
        return {
          id: service.id,
          name: service.name,
          description: service.description || '',
          location: service.location,
          price: Number(service.price_per_unit),
          currency: service.currency,
          rating: Number(service.rating) || 4.5,
          reviews: service.total_reviews || 0,
          image: service.image_url || service.images?.[0] || '/placeholder.svg',
          duration: specs.duration || '',
          groupSizeMax: specs.groupSizeMax || 10,
          meetingPoint: specs.meetingPoint || '',
          included: specs.included || '',
          excluded: specs.excluded || '',
          languages: specs.languages || '',
          difficulty: specs.difficulty || 'Facile',
          category: specs.category || 'Culture & Patrimoine',
        };
      });

      setTours(transformedTours);
      setError(null);
    } catch (err) {
      console.error('Error fetching tour services:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTourServices();
  }, [fetchTourServices]);

  return { tours, loading, error, refetch: fetchTourServices };
};
