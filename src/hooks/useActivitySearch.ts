import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Activity {
  id: string;
  name: string;
  description: string | null;
  location: string;
  image_url: string | null;
  duration: string;
  category: string;
  rating: number;
  reviews: number;
  price_per_unit: number;
  currency: string;
  highlights: string[];
  included: string[];
  available: boolean;
  featured: boolean;
  available_dates: string[];
  latitude: number | null;
  longitude: number | null;
  maps_url: string | null;
}

export const useActivitySearch = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchActivities = async (filters?: {
    location?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('available', true)
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.minPrice) {
        query = query.gte('price_per_unit', filters.minPrice);
      }

      if (filters?.maxPrice) {
        query = query.lte('price_per_unit', filters.maxPrice);
      }

      const { data, error } = await query;

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Error searching activities:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les activités',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    activities,
    loading,
    searchActivities,
  };
};
