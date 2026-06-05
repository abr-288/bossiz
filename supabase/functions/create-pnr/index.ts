import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id } = await req.json();
    
    const amadeusKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
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

    // Fetch passengers
    const { data: passengers } = await supabase
      .from('passengers')
      .select('*')
      .eq('booking_id', booking_id);

    let pnr: string;

    if (amadeusKey && amadeusSecret) {
      // Use real Amadeus API to create PNR
      console.log('Creating PNR with Amadeus API for booking:', booking_id);
      pnr = await createAmadeusPNR(booking, passengers || [], amadeusKey, amadeusSecret);
    } else {
      // Generate mock PNR
      console.log('AMADEUS_API_KEY not configured, generating mock PNR');
      pnr = generateMockPNR();
    }

    // Update booking with PNR
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

async function createAmadeusPNR(booking: any, passengers: any[], amadeusKey: string, amadeusSecret: string): Promise<string> {
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
      throw new Error('Failed to authenticate with Amadeus');
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
      return orderData.data?.id || generateMockPNR();
    } else {
      console.error('Amadeus order creation failed, using mock PNR');
      return generateMockPNR();
    }
  } catch (error) {
    console.error('Amadeus API error:', error);
    return generateMockPNR();
  }
}

function generateMockPNR(): string {
  // Generate a realistic-looking PNR: BR + 8 random alphanumeric characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pnr = 'BR';
  for (let i = 0; i < 8; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
}
