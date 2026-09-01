// Hook pour la gestion des paiements
// Gère le traitement des paiements via CinetPay et la validation des données
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { paymentSchema, type PaymentInput } from "@/lib/validationSchemas";
import { validateWithSchema, getUserFriendlyErrorMessage } from "@/lib/formHelpers";
import { useTranslation } from "react-i18next";

export const usePayment = () => {
  const [processing, setProcessing] = useState(false); // État de traitement du paiement
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({}); // Erreurs de validation
  const [generalError, setGeneralError] = useState<string | null>(null); // Erreur générale
  const { toast } = useToast();
  const { t } = useTranslation();
  const processingRef = useRef(false);

  // Fonction pour traiter un paiement
  const processPayment = async (
    bookingId: string, // ID de la réservation
    booking: any, // Données de la réservation
    paymentData: PaymentInput // Données de paiement
  ) => {
    setValidationErrors({});
    setGeneralError(null);

    // Validation des données de paiement
    const validation = validateWithSchema(paymentSchema, paymentData);

    if (validation.success === false) {
      setValidationErrors(validation.errors);
      toast({
        title: t('validation.errorTitle'),
        description: t('validation.errorDescription'),
        variant: "destructive",
      });
      
      // Focus sur le premier champ en erreur
      const firstErrorField = Object.keys(validation.errors)[0];
      document.getElementById(firstErrorField)?.focus();
      return { success: false };
    }

    const validatedData = validation.data;

    // Empêcher les traitements multiples
    if (processingRef.current) return { success: false };

    processingRef.current = true;
    setProcessing(true);

    // Timeout de 30 secondes pour le traitement du paiement
    const timeoutId = setTimeout(() => {
      processingRef.current = false;
      setProcessing(false);
      setGeneralError(t('payment.errors.timeoutDescription'));
      toast({
        title: t('payment.errors.timeoutTitle'),
        description: t('payment.errors.timeoutDescription'),
        variant: "destructive",
      });
    }, 30000);

    try {
      // Vérification de l'état actuel de la réservation
      const { data: currentBooking, error: checkError } = await supabase
        .from("bookings")
        .select("payment_status, status")
        .eq("id", bookingId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!currentBooking) {
        throw new Error("Réservation introuvable");
      }

      if (currentBooking.payment_status === "paid") {
        throw new Error("Cette réservation a déjà été payée");
      }

      if (currentBooking.status === "cancelled") {
        throw new Error("Cette réservation a été annulée et ne peut être payée");
      }

      // XOF - devise unique de la plateforme
      // Appel de la fonction Supabase pour traiter le paiement
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          bookingId: bookingId,
          amount: booking.total_price,
          currency: "XOF",
          paymentMethod: validatedData.paymentMethod,
          customerInfo: {
            name: validatedData.customerName,
            email: validatedData.customerEmail,
            phone: validatedData.customerPhone,
            address: validatedData.customerAddress,
            city: validatedData.customerCity,
          },
        },
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error("Payment error:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Échec de la création du paiement");
      }

      if (!data.payment_url) {
        throw new Error("URL de paiement non reçue");
      }

      return { success: true, paymentUrl: data.payment_url };
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Payment error:", error);
      
      const userMessage = getUserFriendlyErrorMessage(error);
      setGeneralError(userMessage);
      
      toast({
        title: t('payment.errors.paymentErrorTitle'),
        description: userMessage,
        variant: "destructive",
      });
      processingRef.current = false;
      setProcessing(false);
      return { success: false };
    } finally {
      clearTimeout(timeoutId);
      processingRef.current = false;
      setProcessing(false);
    }
  };

  return {
    processing,
    validationErrors,
    generalError,
    processPayment,
    setValidationErrors,
  };
};
