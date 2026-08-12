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

    if (!booking.external_ref) {
      console.error('PNR not yet created for booking:', bookingId);
      return new Response(
        JSON.stringify({ success: false, error: 'PNR not yet created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch passengers
    const { data: passengers } = await supabase
      .from('passengers')
      .select('*')
      .eq('booking_id', bookingId);

    // Send PNR confirmation email via le prestataire actif (Resend ou SMTP)
    const emailHtml = generatePNRConfirmationEmail(booking, passengers || []);

    const result = await sendEmail(supabase, {
      from: 'B-Reserve <onboarding@resend.dev>',
      to: [booking.customer_email],
      subject: `PNR Confirmation - ${booking.external_ref}`,
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

    console.log('PNR confirmation email sent to:', booking.customer_email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'PNR confirmation email sent' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-pnr-confirmation:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generatePNRConfirmationEmail(booking: any, passengers: any[]) {
  const passengerList = passengers.map(p => 
    `<li>${p.first_name} ${p.last_name}</li>`
  ).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .pnr-details { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #059669; }
        .pnr-number { font-size: 32px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ PNR Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${booking.customer_name},</p>
          <p>Your booking has been confirmed with the airline. Your PNR (Passenger Name Record) is:</p>
          
          <div class="pnr-details">
            <div class="pnr-number">${booking.external_ref}</div>
            <p style="text-align: center;">Please save this PNR for future reference</p>
          </div>

          <div class="pnr-details">
            <h3>Booking Details</h3>
            <p><strong>Service:</strong> ${booking.service_name}</p>
            <p><strong>Route:</strong> ${booking.location}</p>
            <p><strong>Departure Date:</strong> ${booking.start_date}</p>
            ${booking.end_date ? `<p><strong>Return Date:</strong> ${booking.end_date}</p>` : ''}
          </div>

          <div class="pnr-details">
            <h3>Passengers</h3>
            <ul>${passengerList}</ul>
          </div>

          <p><strong>Important:</strong></p>
          <ul>
            <li>Use your PNR to check-in online or at the airport</li>
            <li>Keep your PNR safe - it's required for any changes to your booking</li>
            <li>Arrive at the airport at least 2 hours before departure</li>
            <li>Bring valid identification for all passengers</li>
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
