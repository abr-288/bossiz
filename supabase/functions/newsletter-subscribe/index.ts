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
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = Deno.env.get('SMTP_PORT');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPassword = Deno.env.get('SMTP_PASSWORD');
    const smtpFrom = Deno.env.get('SMTP_FROM');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists
    const { data: existingSubscriber } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('email', email)
      .single();

    if (existingSubscriber) {
      return new Response(
        JSON.stringify({ success: true, message: 'Already subscribed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add to newsletter subscribers
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email,
        subscribed_at: new Date().toISOString(),
        status: 'active'
      });

    if (insertError) {
      console.error('Error inserting subscriber:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to subscribe' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Send confirmation email if SMTP is configured
    if (smtpHost && smtpUser && smtpPassword && smtpFrom) {
      try {
        await sendConfirmationEmail(email, smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom);
      } catch (emailError) {
        console.warn('Failed to send confirmation email:', emailError);
        // Don't fail the subscription if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully subscribed to newsletter' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in newsletter-subscribe:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function sendConfirmationEmail(
  email: string,
  smtpHost: string,
  smtpPort: string,
  smtpUser: string,
  smtpPassword: string,
  smtpFrom: string
) {
  // Using SMTP relay service (e.g., SendGrid, Mailgun, or direct SMTP)
  const response = await fetch('https://api.smtprelay.com/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${smtpPassword}`,
    },
    body: JSON.stringify({
      from: smtpFrom,
      to: email,
      subject: 'Welcome to B-Reserve Newsletter',
      html: `
        <h1>Welcome to B-Reserve!</h1>
        <p>Thank you for subscribing to our newsletter.</p>
        <p>You'll receive the latest travel deals, destination recommendations, and exclusive offers.</p>
        <p>Best regards,<br>The B-Reserve Team</p>
      `,
      text: `
        Welcome to B-Reserve!
        
        Thank you for subscribing to our newsletter.
        You'll receive the latest travel deals, destination recommendations, and exclusive offers.
        
        Best regards,
        The B-Reserve Team
      `
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send confirmation email');
  }
}
