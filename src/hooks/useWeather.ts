import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

export const useWeather = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeather = async (city: string): Promise<WeatherData | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke("get-weather", {
        body: { city },
      });

      if (functionError) throw functionError;

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch weather");
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("Weather error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getWeather, loading, error };
};
