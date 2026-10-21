import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FlightHotelSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children?: number;
  rooms?: number;
  travelClass?: string;
}

export const useFlightHotelSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPackages = async (params: FlightHotelSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke("search-flight-hotel-packages", {
        body: params,
      });

      if (functionError) throw functionError;

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("Flight + Hotel search error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { searchPackages, loading, error };
};
