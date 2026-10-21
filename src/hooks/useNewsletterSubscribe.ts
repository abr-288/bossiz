import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useNewsletterSubscribe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke("newsletter-subscribe", {
        body: { email },
      });

      if (functionError) throw functionError;

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("Newsletter subscription error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, error };
};
