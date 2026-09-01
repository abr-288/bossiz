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
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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
      });

    if (insertError) {
      console.error('Error inserting subscriber:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to subscribe' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Send confirmation email if a provider is configured
    try {
      const result = await sendConfirmationEmail(supabase, email);
      if (!result.ok) {
        console.warn('Failed to send confirmation email:', result.error);
      }
    } catch (emailError) {
      console.warn('Failed to send confirmation email:', emailError);
      // Don't fail the subscription if email fails
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

function sendConfirmationEmail(supabase: ReturnType<typeof createClient>, email: string) {
  return sendEmail(supabase, {
    from: 'B-Reserve <noreply@bossiz.com>',
    to: [email],
    subject: 'Bienvenue à la newsletter B-Reserve',
    html: `
      <h1>Bienvenue chez B-Reserve !</h1>
      <p>Merci de vous être inscrit à notre newsletter.</p>
      <p>Vous recevrez nos meilleures offres de voyage, recommandations de destinations et promotions exclusives.</p>
      <p>À bientôt,<br>L'équipe B-Reserve</p>
    `,
    text: `
      Bienvenue chez B-Reserve !

      Merci de vous être inscrit à notre newsletter.
      Vous recevrez nos meilleures offres de voyage, recommandations de destinations et promotions exclusives.

      À bientôt,
      L'équipe B-Reserve
    `,
  });
}
