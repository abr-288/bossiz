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

    // Generate flight ticket by calling the generate-flight-ticket function
    const { data: ticketData, error: ticketError } = await supabase.functions.invoke('generate-flight-ticket', {
      body: { bookingId }
    });

    if (ticketError || !ticketData?.ticketUrl) {
      console.error('Failed to generate ticket:', ticketError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate ticket' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Send email with ticket attachment via le prestataire actif (Resend ou SMTP)
    const emailHtml = generateTicketEmailHtml(booking, passengers || []);

    const result = await sendEmail(supabase, {
      from: 'B-Reserve <noreply@b-reserve.com>',
      to: [booking.customer_email],
      subject: `Your Flight Ticket - ${booking.external_ref || 'Pending'}`,
      html: emailHtml,
      attachments: [
        {
          filename: `ticket-${booking.id}.pdf`,
          content: ticketData.ticketBase64, // Assuming the ticket function returns base64
        },
      ],
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

    console.log('Flight ticket email sent to:', booking.customer_email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Flight ticket email sent' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-ticket:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generateTicketEmailHtml(booking: any, passengers: any[]) {
  const passengerList = passengers.map((p, index) => 
    `<li>Passenger ${index + 1}: ${p.first_name} ${p.last_name} (${p.document_type}: ${p.document_number})</li>`
  ).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .ticket-details { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #dc2626; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✈️ Your Flight Ticket</h1>
        </div>
        <div class="content">
          <p>Dear ${booking.customer_name},</p>
          <p>Please find attached your flight ticket. Make sure to save it and bring it with you to the airport.</p>
          
          <div class="ticket-details">
            <h3>Flight Information</h3>
            <p><strong>PNR/Reference:</strong> ${booking.external_ref || 'Pending'}</p>
            <p><strong>Route:</strong> ${booking.location}</p>
            <p><strong>Departure Date:</strong> ${booking.start_date}</p>
            ${booking.end_date ? `<p><strong>Return Date:</strong> ${booking.end_date}</p>` : ''}
            <p><strong>Total Price:</strong> ${booking.total_price} ${booking.currency}</p>
          </div>

          <div class="ticket-details">
            <h3>Passengers</h3>
            <ul>${passengerList}</ul>
          </div>

          <p><strong>Important Information:</strong></p>
          <ul>
            <li>Print your ticket or save it on your mobile device</li>
            <li>Arrive at the airport at least 2 hours before departure</li>
            <li>Bring valid identification for all passengers</li>
            <li>Check baggage allowance with your airline</li>
            <li>Keep your PNR/reference number for check-in</li>
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
