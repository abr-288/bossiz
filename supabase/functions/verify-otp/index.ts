import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashOtpCode } from "../_shared/otp.ts";
import { getClientIP, checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Le verrou par code (max_attempts) protège un code donné, mais pas contre un
// appelant qui tente des codes sur beaucoup de destinations différentes.
const IP_RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxRequests: 20 };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP, { ...IP_RATE_LIMIT, keyPrefix: 'verify-otp' });
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, IP_RATE_LIMIT, corsHeaders);
  }

  try {
    const { destination, code, purpose = 'login' } = await req.json();

    if (!destination || !code) {
      return new Response(
        JSON.stringify({ success: false, error: 'destination et code requis' }),
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

    const { data: otpRow, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('destination', destination)
      .eq('purpose', purpose)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !otpRow) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun code en attente pour cette destination' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (new Date(otpRow.expires_at).getTime() < Date.now()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ce code a expiré, demandez-en un nouveau' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
      );
    }

    if (otpRow.attempts >= otpRow.max_attempts) {
      return new Response(
        JSON.stringify({ success: false, error: 'Trop de tentatives, demandez un nouveau code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    const submittedHash = await hashOtpCode(code, destination);

    if (submittedHash !== otpRow.code_hash) {
      await supabase
        .from('otp_codes')
        .update({ attempts: otpRow.attempts + 1 })
        .eq('id', otpRow.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Code incorrect (${otpRow.max_attempts - otpRow.attempts - 1} tentative(s) restante(s))`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    await supabase
      .from('otp_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', otpRow.id);

    // Pour une connexion par email, on établit une vraie session Supabase
    // en générant un lien magique côté serveur (service_role) puis en
    // renvoyant le token_hash au frontend, qui l'échange via
    // supabase.auth.verifyOtp({ type: 'email', token, email }).
    if (otpRow.channel === 'email' && (purpose === 'login' || purpose === 'signup')) {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: destination,
      });

      if (linkError || !linkData?.properties?.hashed_token) {
        console.error('Error generating session link:', linkError);
        return new Response(
          JSON.stringify({ success: false, error: 'Code valide mais impossible de créer la session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: { email: destination, token_hash: linkData.properties.hashed_token },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, verified: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
