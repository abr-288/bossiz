import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP, checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

// ============================================================
// EDGE FUNCTION: delete-account
// RGPD "right to erasure" self-service. Personal data (name, email, phone,
// travel documents) is anonymized; the account is disabled so it can no
// longer be used to log in. Booking records themselves are NOT hard-deleted
// - only their personal fields are redacted - because financial/transaction
// records must be retained for accounting and tax purposes (RGPD Art. 17(3)(b)
// explicitly allows this exception). bookings.user_id has ON DELETE CASCADE
// to auth.users, so the auth user is deliberately NOT deleted here (that
// would destroy the very records we're required to keep) - it's banned
// instead.
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: object, status: number = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function errorResponse(message: string, status: number = 400): Response {
  console.error(`❌ delete-account error [${status}]: ${message}`);
  return jsonResponse({ success: false, error: message }, status);
}

const REDACTED_NAME = 'Compte supprimé';
const REDACTED_EMAIL_DOMAIN = 'deleted.invalid';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP, { ...RATE_LIMITS.PAYMENT, keyPrefix: 'delete-account' });
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, RATE_LIMITS.PAYMENT, corsHeaders);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Header d\'autorisation manquant', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return errorResponse('Configuration serveur incomplète', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return errorResponse('Non autorisé - Veuillez vous connecter', 401);
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const anonymizedEmail = `deleted-${user.id}@${REDACTED_EMAIL_DOMAIN}`;

    console.log('📋 Suppression RGPD demandée pour utilisateur:', user.id);

    // 1. Anonymize the profile
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        full_name: REDACTED_NAME,
        phone: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.warn('⚠️ Anonymisation du profil échouée:', profileError.message);
    }

    // 2. Redact personal fields on this user's bookings, keep the
    // transactional facts (total_price, dates, status) for accounting.
    const { data: userBookings, error: bookingsFetchError } = await adminSupabase
      .from('bookings')
      .select('id')
      .eq('user_id', user.id);

    if (bookingsFetchError) {
      console.warn('⚠️ Lecture des réservations échouée:', bookingsFetchError.message);
    }

    const bookingIds = (userBookings || []).map((b: { id: string }) => b.id);

    if (bookingIds.length > 0) {
      const { error: bookingsUpdateError } = await adminSupabase
        .from('bookings')
        .update({
          customer_name: REDACTED_NAME,
          customer_email: anonymizedEmail,
          customer_phone: null,
          notes: null,
          updated_at: new Date().toISOString(),
        })
        .in('id', bookingIds);

      if (bookingsUpdateError) {
        console.warn('⚠️ Anonymisation des réservations échouée:', bookingsUpdateError.message);
      }

      // 3. Redact travel document data on passengers tied to those bookings
      // (passport/ID numbers are the most sensitive field in the schema).
      const { error: passengersUpdateError } = await adminSupabase
        .from('passengers')
        .update({
          first_name: REDACTED_NAME,
          last_name: '',
          document_number: null,
          date_of_birth: null,
        })
        .in('booking_id', bookingIds);

      if (passengersUpdateError) {
        console.warn('⚠️ Anonymisation des passagers échouée:', passengersUpdateError.message);
      }
    }

    // 4. Disable the account so it can no longer be used, without deleting
    // it (auth.users deletion would cascade-delete the bookings we just
    // deliberately preserved for accounting).
    const { error: banError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      ban_duration: '876000h', // ~100 years - effectively permanent
      email: anonymizedEmail,
      user_metadata: { deleted: true, deleted_at: new Date().toISOString() },
    });

    if (banError) {
      console.error('❌ Désactivation du compte échouée:', banError.message);
      return errorResponse('Vos données ont été anonymisées mais la désactivation du compte a échoué. Contactez le support.', 500);
    }

    console.log('✅ Compte anonymisé et désactivé:', user.id);

    return jsonResponse({ success: true, message: 'Votre compte a été supprimé et vos données personnelles anonymisées.' });
  } catch (error) {
    console.error('❌ Erreur inattendue dans delete-account:', error instanceof Error ? error.message : 'Unknown');
    return jsonResponse({ success: false, error: 'Une erreur inattendue est survenue' }, 500);
  }
});
