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
    const { subscriptionRequestId, planName, planPrice, customerName, customerEmail, customerPhone, paymentMethod, transactionId } = await req.json();
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email');
      return new Response(
        JSON.stringify({ success: true, message: 'Email skipped (API key not configured)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending subscription confirmation email to:', customerEmail);

    const emailHtml = generateSubscriptionConfirmationEmail(planName, planPrice, customerName, transactionId, paymentMethod);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'B-Reserve <noreply@b-reserve.com>',
        to: [customerEmail],
        subject: `Subscription Confirmed - ${planName}`,
        html: emailHtml,
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

    console.log('Subscription confirmation email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription confirmation email sent' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-subscription-confirmation:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generateSubscriptionConfirmationEmail(planName: string, planPrice: string, customerName: string, transactionId: string, paymentMethod: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .subscription-details { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #7c3aed; }
        .plan-name { font-size: 24px; font-weight: bold; color: #7c3aed; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Subscription Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          <p>Your subscription has been successfully activated. Here are your subscription details:</p>
          
          <div class="subscription-details">
            <p class="plan-name">${planName}</p>
            <p><strong>Price:</strong> ${planPrice}</p>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          </div>

          <p><strong>What's Next?</strong></p>
          <ul>
            <li>You now have access to all premium features</li>
            <li>Enjoy exclusive travel deals and discounts</li>
            <li>Priority customer support</li>
            <li>Early access to new features</li>
          </ul>

          <p>You can manage your subscription anytime from your account settings.</p>
          
          <p>Thank you for choosing B-Reserve!</p>
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
