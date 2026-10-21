import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SupportMessageData {
  name: string;
  email: string;
  bookingReference?: string;
  subject: string;
  message: string;
}

export const useSupportMessage = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (data: SupportMessageData) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-support-email", {
        body: data,
      });

      if (error) throw error;

      toast({
        title: "Message envoyé",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });

      return true;
    } catch (error) {
      console.error("Error sending support message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};
