import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HotelSearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  partnerOnly?: boolean;
}

export const useHotelSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchHotels = async (params: HotelSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('search-hotels', {
        body: params
      });

      if (functionError) throw functionError;
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      console.error('Hotel search error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { searchHotels, loading, error };
};
