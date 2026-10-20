import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorMessage";

// "request" : demande d'abonnement sur devis (subscription_requests) ;
// "paid" : abonnement payé en ligne (user_subscriptions).
type ReceiptKind = "request" | "paid";

const receiptBody = (id: string, kind: ReceiptKind) =>
  kind === "paid" ? { userSubscriptionId: id } : { subscriptionRequestId: id };

export const useSubscriptionReceipt = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReceipt = async (subscriptionRequestId: string, kind: ReceiptKind = "request") => {
    setIsGenerating(true);
    // Ouverte avant tout appel réseau : sinon le navigateur bloque la fenêtre
    // (elle n'est plus rattachée au clic de l'utilisateur).
    const receiptWindow = window.open("", "_blank");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("generate-subscription-receipt", {
        body: receiptBody(subscriptionRequestId, kind),
      });

      if (error) throw error;

      if (!data || !data.html) {
        throw new Error("No receipt data received");
      }

      if (!receiptWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      receiptWindow.document.write(data.html);
      receiptWindow.document.close();

      // Trigger print dialog after a short delay to ensure content is loaded
      setTimeout(() => {
        receiptWindow.print();
      }, 500);

      toast({
        title: "Reçu généré avec succès",
        description: `Abonnement ${data.receiptRef} - Utilisez Ctrl/Cmd+P pour imprimer`,
      });

      return true;
    } catch (error) {
      receiptWindow?.close();
      console.error("Error generating receipt:", error);
      toast({
        title: "Erreur",
        description: getErrorMessage(error) || "Impossible de générer le reçu",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReceipt = async (subscriptionRequestId: string, kind: ReceiptKind = "request") => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("generate-subscription-receipt", {
        body: receiptBody(subscriptionRequestId, kind),
      });

      if (error) throw error;

      if (!data || !data.html) {
        throw new Error("No receipt data received");
      }

      // Create a blob from the HTML and download it
      const blob = new Blob([data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu-abonnement-${data.receiptRef}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Reçu téléchargé",
        description: "Ouvrez le fichier dans votre navigateur pour l'imprimer en PDF",
      });

      return true;
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Erreur",
        description: getErrorMessage(error) || "Impossible de télécharger le reçu",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateReceipt,
    downloadReceipt,
    isGenerating,
  };
};
