import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCarServices = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCarServices();
  }, []);

  const fetchCarServices = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('type', 'car')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform database services to match car display format
      const transformedCars = (data || []).map((service) => {
        const specs = service.specifications as any || {};
        return {
          id: service.id,
          name: service.name,
          category: specs.category || 'Standard',
          price: Number(service.price_per_unit),
          rating: Number(service.rating) || 0,
          reviews: service.total_reviews || 0,
          image: service.image_url || service.images?.[0] || '/placeholder.svg',
          seats: specs.seats || 5,
          transmission: specs.transmission || 'Automatique',
          fuel: specs.fuel || 'Essence',
          luggage: specs.luggage || 3,
          location: service.location,
          description: service.description
        };
      });

      setCars(transformedCars);
    } catch (err) {
      console.error('Error fetching car services:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  return { cars, loading, error, refetch: fetchCarServices };
};
