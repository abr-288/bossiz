import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AITravelAdvisorParams {
  destination: string;
  interests?: string;
  budget?: string;
  duration?: string;
}

export interface AITravelAdvisorResponse {
  success: boolean;
  recommendations?: string;
  error?: string;
}

export const useAITravelAdvisor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = async (params: AITravelAdvisorParams): Promise<AITravelAdvisorResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke("ai-travel-advisor", {
        body: params,
      });

      if (functionError) throw functionError;

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("AI Travel Advisor error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getRecommendations, loading, error };
};
