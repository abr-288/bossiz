import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, sendSms } from "../_shared/integrations.ts";
import { generateOtpCode, hashOtpCode, otpEmailHtml } from "../_shared/otp.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, channel, purpose = 'login' } = await req.json();

    if (!destination || !channel || !['email', 'sms'].includes(channel)) {
      return new Response(
        JSON.stringify({ success: false, error: 'destination et channel (email|sms) requis' }),
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

    // Anti-spam : refuse une nouvelle demande si une demande récente et
    // encore valide existe déjà pour cette destination.
    const { data: recent } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('destination', destination)
      .eq('purpose', purpose)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const secondsSinceLast = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Veuillez patienter ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s avant de redemander un code`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
    }

    const code = generateOtpCode();
    const codeHash = await hashOtpCode(code, destination);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from('otp_codes').insert({
      destination,
      channel,
      code_hash: codeHash,
      purpose,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Impossible de générer le code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (channel === 'email') {
      const result = await sendEmail(supabase, {
        to: [destination],
        subject: 'Votre code de connexion B-Reserve',
        html: otpEmailHtml(code),
      });
      if (!result.ok) {
        console.error('Failed to send OTP email:', result.error);
        return new Response(
          JSON.stringify({ success: false, error: "Échec de l'envoi de l'email (vérifiez le prestataire email dans /admin/integrations)" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }
    } else {
      const result = await sendSms(supabase, {
        to: destination,
        message: `Votre code de connexion B-Reserve : ${code} (valable ${OTP_TTL_MINUTES} min)`,
      });
      if (!result.ok) {
        console.error('Failed to send OTP SMS:', result.error);
        return new Response(
          JSON.stringify({ success: false, error: "Échec de l'envoi du SMS (vérifiez le prestataire actif dans /admin/integrations)" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Code envoyé' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-otp:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
