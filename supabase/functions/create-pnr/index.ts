import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { refundBookingPayment } from "../_shared/cinetpayRefund.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // ================================================================
    // AUTH: this endpoint can trigger a real ticket purchase/refund, so it
    // is never left open. Two legitimate callers:
    // - payment-callback, server-to-server, presenting the service role
    //   key itself as the bearer token.
    // - an admin, manually re-triggering ticketing from the admin UI.
    // ================================================================
    const authHeader = req.headers.get('Authorization') || '';
    const isInternalCall = authHeader === `Bearer ${supabaseServiceKey}`;

    if (!isInternalCall) {
      const callerSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user }, error: userError } = await callerSupabase.auth.getUser();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      const { data: isAdmin } = await callerSupabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }

    const { booking_id } = await req.json();

    const amadeusKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch booking details, joined to services to know what we're actually
    // ticketing - a hotel/car/stay booking has nothing to do here.
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, services(type)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (booking.services?.type !== 'flight') {
      // Nothing to ticket with a GDS for non-flight services - payment-callback
      // already confirms these directly.
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Not a flight booking' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if payment is completed
    if (booking.payment_status !== 'paid') {
      console.error('Payment not completed for booking:', booking_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Payment not completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Idempotency: a real PNR was already issued for this booking (e.g. a
    // retried call) - don't re-issue or re-charge the supplier.
    if (booking.external_ref && booking.status === 'confirmed') {
      console.log('PNR already issued for booking, skipping:', booking_id, booking.external_ref);
      return new Response(
        JSON.stringify({ success: true, pnr: booking.external_ref, booking_id, status: 'confirmed', already_issued: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch passengers
    const { data: passengers } = await supabase
      .from('passengers')
      .select('*')
      .eq('booking_id', booking_id);

    // ================================================================
    // CRITICAL: a real ticket requires a real, confirmed order with the
    // GDS/airline. If Amadeus isn't configured, or the order call fails,
    // this booking must NOT be silently confirmed with a fabricated PNR -
    // that would be charging a customer for a flight that doesn't exist.
    // Instead, the payment is automatically refunded and the booking is
    // cancelled, with the failure clearly logged for manual follow-up.
    // ================================================================
    let pnr: string | null = null;

    if (amadeusKey && amadeusSecret) {
      console.log('Creating PNR with Amadeus API for booking:', booking_id);
      pnr = await createAmadeusPNR(booking, passengers || [], amadeusKey, amadeusSecret);
    } else {
      console.error('❌ AMADEUS_API_KEY not configured - cannot issue a real ticket for booking:', booking_id);
    }

    if (!pnr) {
      console.error('❌ Supplier ticketing failed for booking:', booking_id, '- refunding automatically');
      const refundResult = await refundBookingPayment(
        supabase,
        booking_id,
        'Émission du billet impossible auprès du fournisseur (Amadeus non configuré ou échec de la commande)'
      );

      if (!refundResult.success) {
        console.error('❌ Automatic refund ALSO failed for booking:', booking_id, refundResult.error);
        // Leave the booking in 'pending'/'paid' rather than silently
        // confirming it - this state needs manual admin intervention, but
        // at least it's honestly "unresolved" rather than falsely "confirmed".
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Émission du billet impossible et le remboursement automatique a également échoué. Intervention manuelle requise.',
            booking_id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Émission du billet impossible auprès du fournisseur. Le client a été automatiquement remboursé.',
          booking_id,
          refunded: refundResult.refunded,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Update booking with the real PNR
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        external_ref: pnr,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking_id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update booking' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('PNR created successfully:', pnr);

    // Only now - with a real, confirmed PNR - send the flight-specific
    // confirmation email (includes the real PNR) and generate the invoice
    // (deferred from payment-callback).
    fetch(`${supabaseUrl}/functions/v1/send-flight-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
      body: JSON.stringify({ bookingId: booking_id }),
    }).catch(e => console.warn('⚠️ Email non envoyé:', e.message));

    supabase.functions.invoke('generate-invoice', { body: { bookingId: booking_id } })
      .catch(() => console.warn('⚠️ Facture non générée'));

    return new Response(
      JSON.stringify({
        success: true,
        pnr,
        booking_id,
        status: 'confirmed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-pnr:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Returns a real Amadeus order id on success, or null on ANY failure - the
// caller must never fall back to a fabricated PNR.
async function createAmadeusPNR(booking: any, passengers: any[], amadeusKey: string, amadeusSecret: string): Promise<string | null> {
  try {
    // Get Amadeus access token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${amadeusKey}&client_secret=${amadeusSecret}`,
    });

    if (!tokenResponse.ok) {
      console.error('Failed to authenticate with Amadeus:', tokenResponse.status);
      return null;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Create PNR using Amadeus Order API
    // This is a simplified example - actual implementation would require more detailed flight booking data
    const orderResponse = await fetch('https://test.api.amadeus.com/v1/booking/flight-orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'flight-order',
          flightOffers: booking.booking_details?.flightOffers || [],
          travelers: passengers.map(p => ({
            id: p.id,
            dateOfBirth: p.date_of_birth,
            name: {
              firstName: p.first_name,
              lastName: p.last_name
            },
            gender: 'MALE', // Would need to be in passenger data
            contact: {
              emailAddress: booking.customer_email,
              phones: [{
                deviceType: 'MOBILE',
                countryCallingCode: '225',
                number: booking.customer_phone.replace(/\D/g, '')
              }]
            },
            documents: [{
              documentType: p.document_type?.toUpperCase(),
              birthPlace: 'Unknown', // Would need to be in passenger data
              issuanceLocation: 'Unknown',
              issuanceDate: '2020-01-01',
              number: p.document_number,
              expiryDate: '2030-01-01',
              issuingCountryCode: p.nationality?.substring(0, 2).toUpperCase() || 'US',
              validityPeriod: '2020-01-01/2030-01-01'
            }]
          }))
        }
      }),
    });

    if (orderResponse.ok) {
      const orderData = await orderResponse.json();
      return orderData.data?.id || null;
    } else {
      const errorText = await orderResponse.text();
      console.error('Amadeus order creation failed:', orderResponse.status, errorText.substring(0, 300));
      return null;
    }
  } catch (error) {
    console.error('Amadeus API error:', error);
    return null;
  }
}
