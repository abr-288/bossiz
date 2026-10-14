import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const useTravelChatbot = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (messages: Message[]) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('travel-chatbot', {
        body: { messages }
      });

      if (functionError) throw functionError;
      if (!data?.reply) throw new Error(data?.error || 'Empty chatbot reply');

      return data.reply as string;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      console.error('Travel chatbot error:', err);
      // Une panne n'est pas une question mal posée : on laisse le widget
      // afficher son message d'indisponibilité au lieu de « reformulez ».
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
};
