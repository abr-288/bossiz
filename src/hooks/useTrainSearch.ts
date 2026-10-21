import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TrainSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  travelClass?: string;
}

export const useTrainSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTrains = async (params: TrainSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke("search-trains", {
        body: params,
      });

      if (functionError) throw functionError;

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("Train search error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { searchTrains, loading, error };
};
