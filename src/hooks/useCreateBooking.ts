import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Passenger {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  document_type?: string;
  document_number?: string;
  nationality?: string;
}

interface CreateBookingParams {
  service_id?: string;
  service_type: string;
  service_name: string;
  service_description?: string;
  location: string;
  start_date: string;
  end_date?: string;
  guests: number;
  total_price: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: string;
  passengers: Passenger[];
  booking_details?: any;
  // Present only for service types backed by a signed search offer (hotel, car)
  unit_price?: number;
  offer_signature?: string;
  offer_expires_at?: string;
  // Flights only: real base_fare from the signed checkout price breakdown
  supplier_cost?: number;
  // Present when the employee chose "bill to my company" - the booking is
  // created as usual but payment is settled later by the company's billing
  // admin from /company/dashboard instead of immediately by this user.
  company_id?: string;
}

export const useCreateBooking = () => {
  const [loading, setLoading] = useState(false);

  const createBooking = async (params: CreateBookingParams) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Vous devez être connecté pour réserver");
        return null;
      }

      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: params,
      });

      if (error) {
        console.error('Booking error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create booking');
      }

      toast.success("Réservation créée avec succès !");
      return data.booking_id;
    } catch (error: any) {
      console.error('Create booking error:', error);
      toast.error(error.message || "Erreur lors de la création de la réservation");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createBooking, loading };
};
