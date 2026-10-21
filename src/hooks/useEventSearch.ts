import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EventSearchParams {
  location: string;
  date?: string;
  category?: string;
}

/** Événement renvoyé par l'Edge Function search-events. */
export interface EventResult {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  date: string;
  endDate: string;
  price: string;
  currency: string;
  image: string;
  category: string;
  link: string;
  source: string;
}

export interface EventSearchResponse {
  success: boolean;
  events: EventResult[];
  error?: string;
}

export const useEventSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchEvents = async (params: EventSearchParams): Promise<EventSearchResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke("search-events", {
        body: params,
      });

      if (functionError) throw functionError;

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("Event search error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { searchEvents, loading, error };
};
