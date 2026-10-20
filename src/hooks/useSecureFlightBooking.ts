import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FlightOffer } from "@/hooks/useFlightSearch";
import type { BookingPreferences } from "@/components/booking-steps/PreferencesStep";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorMessage";

// ============================================================
// SECURE FLIGHT BOOKING HOOK
// Implements the mandatory pre-booking → checkout → payment flow
// ============================================================

export interface FlightData {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  airline: string;
  airline_code: string;
  flight_number: string;
  price: number;
  stops: number;
  fare: string;
  provider?: string;
  baggage?: FlightOffer["baggage"];
}

export interface PassengerData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  document_type: string;
  document_number: string;
}

export interface PriceBreakdown {
  base_fare: number;
  taxes: number;
  service_fee: number;
  total_amount: number;
  currency: string;
}

export interface PrebookingResult {
  success: boolean;
  prebooking_id?: string;
  booking_reference?: string;
  price_breakdown?: PriceBreakdown;
  expires_at?: string;
  expires_in_seconds?: number;
  price_signature?: string;
  error?: string;
}

export interface CheckoutResult {
  success: boolean;
  checkout?: {
    prebooking_id: string;
    booking_reference: string;
    status: string;
    flight: FlightData;
    passengers: PassengerData[];
    adults_count: number;
    children_count: number;
    price_breakdown: PriceBreakdown;
    expires_at: string;
    expires_in_seconds: number;
    checkout_signature: string;
  };
  error?: string;
  code?: string;
}

export const useSecureFlightBooking = () => {
  const [loading, setLoading] = useState(false);
  const [prebookingData, setPrebookingData] = useState<PrebookingResult | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * STEP 1: Pre-book the flight
   * This locks the fare and generates a booking reference
   * MUST be called before checkout/payment
   */
  const prebook = useCallback(async (
    flightData: FlightData,
    passengers: PassengerData[],
    adultsCount: number,
    childrenCount: number,
    options?: Record<string, number>,
    preferences?: BookingPreferences
  ): Promise<PrebookingResult> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Starting pre-booking...');
      
      const { data, error: fnError } = await supabase.functions.invoke('prebook', {
        body: {
          flight_data: flightData,
          passengers,
          adults_count: adultsCount,
          children_count: childrenCount,
          selected_options: options,
          selected_preferences: preferences,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Pre-booking failed');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Pre-booking failed');
      }

      const result: PrebookingResult = {
        success: true,
        prebooking_id: data.prebooking_id,
        booking_reference: data.booking_reference,
        price_breakdown: data.price_breakdown,
        expires_at: data.expires_at,
        expires_in_seconds: data.expires_in_seconds,
        price_signature: data.price_signature,
      };

      setPrebookingData(result);
      console.log('✅ Pre-booking successful:', result.booking_reference);
      
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Failed to pre-book flight';
      setError(errorMessage);
      console.error('❌ Pre-booking error:', errorMessage);
      
      toast.error("Échec de la pré-réservation", {
        description: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * STEP 2: Checkout - validate pre-booking and get signed price summary
   * MUST be called before payment
   */
  const checkout = useCallback(async (
    prebookingId?: string,
    bookingReference?: string
  ): Promise<CheckoutResult> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use stored prebooking if not provided
      const id = prebookingId || prebookingData?.prebooking_id;
      const ref = bookingReference || prebookingData?.booking_reference;
      
      if (!id && !ref) {
        throw new Error('No pre-booking found. Please start the booking process again.');
      }

      console.log('📋 Starting checkout...');
      
      const { data, error: fnError } = await supabase.functions.invoke('checkout', {
        body: {
          prebooking_id: id,
          booking_reference: ref,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Checkout failed');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Checkout failed');
      }

      const result: CheckoutResult = {
        success: true,
        checkout: data.checkout,
      };

      setCheckoutData(result);
      console.log('✅ Checkout successful');
      
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Checkout failed';
      setError(errorMessage);
      console.error('❌ Checkout error:', errorMessage);
      
      // Handle specific error codes
      if (getErrorMessage(err)?.includes('EXPIRED')) {
        toast.error("Pré-réservation expirée", {
          description: "Votre réservation a expiré. Veuillez recommencer.",
        });
      } else {
        toast.error("Échec du checkout", {
          description: errorMessage,
        });
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [prebookingData]);

  /**
   * Check if prebooking is still valid (not expired)
   */
  const isPrebookingValid = useCallback((): boolean => {
    if (!prebookingData?.expires_at) return false;
    return new Date() < new Date(prebookingData.expires_at);
  }, [prebookingData]);

  /**
   * Get remaining time in seconds
   */
  const getRemainingSeconds = useCallback((): number => {
    if (!prebookingData?.expires_at) return 0;
    const remaining = Math.floor(
      (new Date(prebookingData.expires_at).getTime() - Date.now()) / 1000
    );
    return Math.max(0, remaining);
  }, [prebookingData]);

  /**
   * Reset the booking state
   */
  const reset = useCallback(() => {
    setPrebookingData(null);
    setCheckoutData(null);
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    prebookingData,
    checkoutData,
    
    // Actions
    prebook,
    checkout,
    reset,
    
    // Helpers
    isPrebookingValid,
    getRemainingSeconds,
  };
};
