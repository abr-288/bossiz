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
    const { bookingId } = await req.json();
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email');
      return new Response(
        JSON.stringify({ success: true, message: 'Email skipped (API key not configured)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Generate PDF by calling the generate-booking-pdf function
    const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-booking-pdf', {
      body: { bookingId }
    });

    if (pdfError || !pdfData?.pdfUrl) {
      console.error('Failed to generate PDF:', pdfError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate PDF' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Send email with PDF attachment via Resend
    const emailHtml = generateBookingPDFEmailHtml(booking, passengers || []);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'B-Reserve <noreply@b-reserve.com>',
        to: [booking.customer_email],
        subject: `Your Booking PDF - ${booking.id}`,
        html: emailHtml,
        attachments: [
          {
            filename: `booking-${booking.id}.pdf`,
            content: pdfData.pdfBase64, // Assuming the PDF function returns base64
            type: 'application/pdf'
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Booking PDF email sent to:', booking.customer_email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Booking PDF email sent' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-booking-pdf-email:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generateBookingPDFEmailHtml(booking: any, passengers: any[]) {
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
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .booking-details { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Your Booking PDF</h1>
        </div>
        <div class="content">
          <p>Dear ${booking.customer_name},</p>
          <p>Please find attached your booking confirmation in PDF format.</p>
          
          <div class="booking-details">
            <h3>Booking Information</h3>
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <p><strong>Service:</strong> ${booking.service_name}</p>
            <p><strong>Location:</strong> ${booking.location}</p>
            <p><strong>Start Date:</strong> ${booking.start_date}</p>
            ${booking.end_date ? `<p><strong>End Date:</strong> ${booking.end_date}</p>` : ''}
            <p><strong>Total Price:</strong> ${booking.total_price} ${booking.currency}</p>
          </div>

          <div class="booking-details">
            <h3>Passengers</h3>
            <ul>${passengerList}</ul>
          </div>

          <p><strong>Important:</strong></p>
          <ul>
            <li>Save the PDF for your records</li>
            <li>Bring a printed copy or digital version when traveling</li>
            <li>Keep your booking ID handy for any changes or inquiries</li>
          </ul>
          
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
