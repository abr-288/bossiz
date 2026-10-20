import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  travelClass?: string;
}

export interface FlightOfferSegment {
  departure?: { iataCode?: string; at?: string };
  arrival?: { iataCode?: string; at?: string };
  carrierCode?: string;
  carrierName?: string;
  number?: string;
  flightNumber?: string;
  duration?: string;
}

/** Offre de vol renvoyée par l'Edge Function search-flights (format Amadeus). */
export interface FlightOffer {
  id?: string;
  itineraries?: Array<{ segments?: FlightOfferSegment[]; duration?: string }>;
  price?: number | { grandTotal?: string; total?: string; currency?: string };
  validatingAirlineCodes?: string[];
  carrierName?: string;
  travelerPricings?: Array<{ fareDetailsBySegment?: Array<{ cabin?: string }> }>;
  baggage?: {
    cabin: { pieces: number; weightKg: number; included: boolean };
    checked: { pieces: number; weightKg: number; included: boolean };
    personalItem: boolean;
  };
  source?: string;
  deepLink?: string;
}

export interface FlightSearchResponse {
  success: boolean;
  data?: FlightOffer[];
  error?: string;
}

export const useFlightSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = useCallback(async (params: FlightSearchParams): Promise<FlightSearchResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('search-flights', {
        body: params
      });

      if (functionError) throw functionError;
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      console.error('Flight search error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchFlights, loading, error };
};
