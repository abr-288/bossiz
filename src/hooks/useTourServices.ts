import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { localizeRow } from "@/lib/translatableContent";
import type { Tables } from "@/integrations/supabase/types";

// Détails du circuit saisis par le partenaire (colonne JSON specifications).
interface TourSpecs {
  duration?: string;
  groupSizeMax?: number;
  meetingPoint?: string;
  included?: string;
  excluded?: string;
  languages?: string;
  difficulty?: string;
  category?: string;
}

// Service de type « tour » mis au format d'affichage des circuits.
const toTourService = (service: Tables<"services">) => {
  const specs = (service.specifications as TourSpecs | null) || {};
  return {
    id: service.id,
    name: service.name,
    description: service.description || '',
    location: service.location,
    price: Number(service.price_per_unit),
    currency: service.currency,
    rating: Number(service.rating) || 0,
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
    availableDates: service.available_dates || [],
    latitude: service.latitude,
    longitude: service.longitude,
    mapsUrl: service.maps_url,
  };
};

export type TourService = ReturnType<typeof toTourService>;

export const useTourServices = () => {
  const { i18n } = useTranslation();
  const [tours, setTours] = useState<TourService[]>([]);
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

      const transformedTours = (data || []).map((row) => toTourService(localizeRow(row, i18n.language)));

      setTours(transformedTours);
      setError(null);
    } catch (err) {
      console.error('Error fetching tour services:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  useEffect(() => {
    fetchTourServices();
  }, [fetchTourServices]);

  return { tours, loading, error, refetch: fetchTourServices };
};
