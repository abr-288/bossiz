import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorMessage";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  bookingId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
}

export const useInvoiceEmail = () => {
  const [loading, setLoading] = useState(false);

  const sendInvoice = async (invoiceData: InvoiceData) => {
    setLoading(true);
    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const invoiceDate = new Date().toISOString();

      const { data, error } = await supabase.functions.invoke("send-invoice-email", {
        body: {
          ...invoiceData,
          invoiceNumber,
          invoiceDate,
        },
      });

      if (error) throw error;

      toast.success("Facture envoyée par email avec succès");
      return { success: true, invoiceNumber };
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Erreur lors de l'envoi de la facture");
      return { success: false, error: getErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  return { sendInvoice, loading };
};
