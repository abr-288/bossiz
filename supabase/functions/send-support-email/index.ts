import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, bookingReference, subject, message } = await req.json();
    
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = Deno.env.get('SMTP_PORT');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPassword = Deno.env.get('SMTP_PASSWORD');
    const smtpFrom = Deno.env.get('SMTP_FROM');

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFrom) {
      console.log('SMTP configuration not complete, skipping email');
      return new Response(
        JSON.stringify({ success: true, message: 'Message received (email not configured)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending support email from:', email);

    // Send support email via SMTP relay
    const emailHtml = generateSupportEmailHtml(name, email, bookingReference, subject, message);

    const response = await fetch('https://api.smtprelay.com/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${smtpPassword}`,
      },
      body: JSON.stringify({
        from: smtpFrom,
        to: ['support@b-reserve.com'],
        subject: `Support Request: ${subject}`,
        html: emailHtml,
        replyTo: email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SMTP API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Support email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Support message sent successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-support-email:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generateSupportEmailHtml(name: string, email: string, bookingReference: string | undefined, subject: string, message: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .message-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Support Request</h1>
        </div>
        <div class="content">
          <div class="message-details">
            <h3>Contact Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${bookingReference ? `<p><strong>Booking Reference:</strong> ${bookingReference}</p>` : ''}
          </div>

          <div class="message-details">
            <h3>Subject</h3>
            <p>${subject}</p>
          </div>

          <div class="message-details">
            <h3>Message</h3>
            <p>${message}</p>
          </div>

          <p>Please respond to this support request as soon as possible.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 B-Reserve Support System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
