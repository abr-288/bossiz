import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorMessage";

export const useBookingPDF = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async (bookingId: string) => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("generate-booking-pdf", {
        body: { bookingId },
      });

      if (error) throw error;

      if (!data || !data.html) {
        throw new Error("No PDF data received");
      }

      // Create a new window with the PDF HTML
      const pdfWindow = window.open("", "_blank");
      if (!pdfWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      pdfWindow.document.write(data.html);
      pdfWindow.document.close();

      // Trigger print dialog after a short delay to ensure content is loaded
      setTimeout(() => {
        pdfWindow.print();
      }, 500);

      toast({
        title: "PDF généré avec succès",
        description: `Réservation ${data.bookingRef} - Utilisez Ctrl/Cmd+P pour imprimer`,
      });

      return true;
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erreur",
        description: getErrorMessage(error) || "Impossible de générer le PDF",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async (bookingId: string) => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("generate-booking-pdf", {
        body: { bookingId },
      });

      if (error) throw error;

      if (!data || !data.html) {
        throw new Error("No PDF data received");
      }

      // Create a blob from the HTML and download it
      const blob = new Blob([data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reservation-${data.bookingRef}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF téléchargé",
        description: "Ouvrez le fichier dans votre navigateur pour l'imprimer en PDF",
      });

      return true;
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Erreur",
        description: getErrorMessage(error) || "Impossible de télécharger le PDF",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    downloadPDF,
    isGenerating,
  };
};
