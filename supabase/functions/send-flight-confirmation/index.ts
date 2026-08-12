import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();
    
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
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Fetch passengers
    const { data: passengers } = await supabase
      .from('passengers')
      .select('*')
      .eq('booking_id', bookingId);

    // Send flight confirmation email via le prestataire actif (Resend ou SMTP)
    const emailHtml = generateFlightConfirmationEmail(booking, passengers || []);

    const result = await sendEmail(supabase, {
      from: 'B-Reserve <onboarding@resend.dev>',
      to: [booking.customer_email],
      subject: `Flight Confirmation - ${booking.external_ref || 'Pending'}`,
      html: emailHtml,
    });

    if (!result.ok) {
      if (result.error === 'RESEND_API_KEY not configured') {
        console.log('Aucun prestataire email configuré, envoi ignoré');
        return new Response(
          JSON.stringify({ success: true, message: 'Email skipped (no provider configured)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Email send error:', result.error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Flight confirmation email sent to:', booking.customer_email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Flight confirmation email sent' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-flight-confirmation:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generateFlightConfirmationEmail(booking: any, passengers: any[]) {
  const passengerList = passengers.map(p => 
    `<li>${p.first_name} ${p.last_name} - ${p.document_type}: ${p.document_number}</li>`
  ).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .flight-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2563eb; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✈️ Flight Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${booking.customer_name},</p>
          <p>Your flight has been confirmed. Here are your flight details:</p>
          
          <div class="flight-details">
            <h3>Flight Information</h3>
            <p><strong>PNR/Reference:</strong> ${booking.external_ref || 'Pending'}</p>
            <p><strong>Route:</strong> ${booking.location}</p>
            <p><strong>Departure Date:</strong> ${booking.start_date}</p>
            ${booking.end_date ? `<p><strong>Return Date:</strong> ${booking.end_date}</p>` : ''}
            <p><strong>Total Price:</strong> ${booking.total_price} ${booking.currency}</p>
          </div>

          <div class="flight-details">
            <h3>Passengers</h3>
            <ul>${passengerList}</ul>
          </div>

          <p><strong>Important Information:</strong></p>
          <ul>
            <li>Please arrive at the airport at least 2 hours before departure</li>
            <li>Bring valid identification for all passengers</li>
            <li>Check baggage allowance with your airline</li>
            <li>Keep this confirmation email for your records</li>
          </ul>
          
          <p>Have a wonderful trip!</p>
          <p>Best regards,<br>The B-Reserve Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 B-Reserve. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
