import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyOfferSignature } from "../_shared/priceSignature.ts";
import { RETAIL_MARKUP_PERCENTAGE } from "../_shared/pricing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Service types whose search results come from a signed offer (see
// _shared/priceSignature.ts): the price is never trusted from the request
// body, it's recomputed here from the server-signed unit_price.
const SIGNED_OFFER_SERVICE_TYPES = new Set(['hotel', 'car']);

// Service types backed by their own curated catalog table (not the generic
// "services" table): when a service_id is supplied for these, the row's own
// price_per_unit is the source of truth.
const CATALOG_TABLE_BY_SERVICE_TYPE: Record<string, string> = {
  stay: 'stays',
  activity: 'activities',
};

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

interface Passenger {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  document_type?: string;
  document_number?: string;
  nationality?: string;
}

interface BookingRequest {
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
  // Flights only: the real base_fare from the signed prebook/checkout price
  // breakdown (supplier cost excluding taxes/service fee), for reconciliation.
  supplier_cost?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CREATE BOOKING START ===');
    
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: BookingRequest = await req.json();
    
    // Security: Only log non-sensitive metadata
    console.log('Processing booking - Service type:', requestData.service_type);
    console.log('Passenger count:', requestData.passengers.length);

    // Validate input
    if (!requestData.service_type || !requestData.service_name || 
        !requestData.start_date || requestData.total_price === undefined ||
        !requestData.currency || !requestData.customer_name || 
        !requestData.customer_email || !requestData.customer_phone) {
      throw new Error('Missing required fields');
    }

    if (requestData.passengers.length === 0) {
      throw new Error('At least one passenger is required');
    }

    // ==============================================================
    // SECURITY: never trust requestData.total_price as-is.
    // - hotel/car: price comes from a search result signed server-side
    //   by search-hotels/car-rental; verify the signature and recompute
    //   the total from the signed unit_price, ignore whatever total the
    //   client sent.
    // - any type with an existing service_id: recompute from the
    //   service's own stored price_per_unit, never the client's total.
    // ==============================================================
    let verifiedTotalPrice = requestData.total_price;
    // Supplier cost tracking, for revenue/margin reconciliation - see
    // supabase/migrations/20260801000002_add_supplier_cost_tracking.sql.
    let verifiedSupplierCost: number | null = null;

    if (SIGNED_OFFER_SERVICE_TYPES.has(requestData.service_type)) {
      const { unit_price: unitPrice, offer_signature: offerSignature, offer_expires_at: offerExpiresAt } = requestData;

      if (unitPrice === undefined || !offerSignature || !offerExpiresAt) {
        throw new Error('Missing signed price offer for this service type');
      }

      const isValidSignature = await verifyOfferSignature(
        {
          service_type: requestData.service_type,
          service_name: requestData.service_name,
          location: requestData.location,
          unit_price: unitPrice,
          currency: requestData.currency,
          expires_at: offerExpiresAt,
        },
        offerSignature
      );

      if (!isValidSignature) {
        console.error('❌ Price offer signature invalid - possible tampering');
        throw new Error('Price verification failed. Please search again.');
      }

      if (new Date(offerExpiresAt).getTime() < Date.now()) {
        throw new Error('This price offer has expired. Please search again.');
      }

      // Cars are booked with pickup/dropoff times, not just dates (see
      // CarBookingDialog): reproduce that exact duration calculation here
      // so the server-verified total always matches what was shown to the
      // user, instead of a coarser date-only diff.
      let units: number;
      if (requestData.service_type === 'car' && requestData.booking_details?.pickupTime && requestData.booking_details?.dropoffTime) {
        const start = new Date(`${requestData.start_date}T${requestData.booking_details.pickupTime}`);
        const end = new Date(`${requestData.end_date}T${requestData.booking_details.dropoffTime}`);
        units = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        units = daysBetween(requestData.start_date, requestData.end_date || requestData.start_date);
      }

      const multiplier = requestData.service_type === 'hotel' ? (requestData.booking_details?.rooms || 1) : 1;
      verifiedTotalPrice = unitPrice * units * multiplier;

      // Back out the known retail markup to get what the supplier actually
      // charges us for this booking.
      verifiedSupplierCost = Math.round((unitPrice / (1 + RETAIL_MARKUP_PERCENTAGE)) * units * multiplier);

      console.log('✅ Price offer verified - server-computed total:', verifiedTotalPrice, '- supplier cost:', verifiedSupplierCost);
    } else if (requestData.service_type === 'flight' && typeof requestData.supplier_cost === 'number') {
      // Already server-computed and signed via prebook/checkout - trusted as-is.
      verifiedSupplierCost = requestData.supplier_cost;
    }

    // Catalog-backed types (stay, activity) live in their own table, not in
    // `services`. Verify the price against that table, but note their id
    // can NOT be reused as bookings.service_id below: that column has a hard
    // foreign key to public.services, so a fresh services row still has to
    // be created for them (using this verified price, never the client's).
    const catalogTable = CATALOG_TABLE_BY_SERVICE_TYPE[requestData.service_type];

    if (requestData.service_id && catalogTable) {
      const { data: catalogRow, error: catalogError } = await supabase
        .from(catalogTable)
        .select('price_per_unit')
        .eq('id', requestData.service_id)
        .single();

      if (catalogError || !catalogRow) {
        console.error(`Referenced ${catalogTable} row not found - Code:`, catalogError?.code);
        throw new Error('Referenced service not found');
      }

      verifiedTotalPrice = catalogRow.price_per_unit * requestData.guests;
      console.log(`✅ ${catalogTable} price verified - server-computed total:`, verifiedTotalPrice);
    }

    // Create or get service. A service_id pointing at a catalog table is
    // never reused directly here (see above) - only a service_id that
    // already refers to the generic `services` table can be reused as-is.
    let serviceId = (requestData.service_id && !catalogTable) ? requestData.service_id : undefined;

    if (serviceId) {
      // A service_id was supplied that refers to the generic services table:
      // its own stored price is the source of truth, never the client's total.
      const { data: existingService, error: existingServiceError } = await supabase
        .from('services')
        .select('price_per_unit')
        .eq('id', serviceId)
        .single();

      if (existingServiceError || !existingService) {
        console.error('Referenced service not found - Code:', existingServiceError?.code);
        throw new Error('Referenced service not found');
      }

      verifiedTotalPrice = existingService.price_per_unit * requestData.guests;
      console.log('✅ Existing service price verified - server-computed total:', verifiedTotalPrice);
    }

    if (!serviceId) {
      console.log('Creating service...');
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .insert({
          type: requestData.service_type,
          name: requestData.service_name,
          description: requestData.service_description || requestData.service_name,
          location: requestData.location,
          price_per_unit: verifiedTotalPrice / requestData.guests,
          currency: requestData.currency,
          available: true,
        })
        .select()
        .single();

      if (serviceError) {
        // Security: Don't log full error details
        console.error('Service creation failed - Code:', serviceError.code);
        throw new Error('Failed to create service');
      }

      serviceId = service.id;
      console.log('Service created successfully');
    }

    // Create booking
    console.log('Creating booking...');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        service_id: serviceId,
        status: 'pending',
        payment_status: 'pending',
        start_date: requestData.start_date,
        end_date: requestData.end_date || requestData.start_date,
        guests: requestData.guests,
        total_price: verifiedTotalPrice,
        currency: requestData.currency,
        supplier_cost: verifiedSupplierCost,
        supplier_cost_currency: verifiedSupplierCost !== null ? requestData.currency : null,
        customer_name: requestData.customer_name,
        customer_email: requestData.customer_email,
        customer_phone: requestData.customer_phone,
        notes: requestData.notes,
        booking_details: requestData.booking_details,
      })
      .select()
      .single();

    if (bookingError) {
      // Security: Don't log full error details
      console.error('Booking creation failed - Code:', bookingError.code);
      throw new Error('Failed to create booking');
    }

    console.log('Booking created successfully');

    // Create passengers
    console.log('Creating passengers...');
    const passengersData = requestData.passengers.map((p) => ({
      booking_id: booking.id,
      first_name: p.first_name,
      last_name: p.last_name,
      date_of_birth: p.date_of_birth || null,
      document_type: p.document_type || null,
      document_number: p.document_number || null,
      nationality: p.nationality || null,
    }));

    const { data: passengers, error: passengersError } = await supabase
      .from('passengers')
      .insert(passengersData)
      .select();

    if (passengersError) {
      // Security: Don't log full error details
      console.error('Passengers creation failed - Code:', passengersError.code);
      // Don't fail the whole booking if passengers fail
      console.warn('Continuing without passengers...');
    } else {
      console.log('Passengers created:', passengers.length);
    }

    console.log('=== CREATE BOOKING SUCCESS ===');

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        status: booking.status,
        message: 'Booking created successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Security: Only log error type, not full error details
    console.error('❌ ERROR in create-booking:', error instanceof Error ? error.constructor.name : 'Unknown');
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});