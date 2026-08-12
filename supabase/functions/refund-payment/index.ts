import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP, checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { refundBookingPayment } from "../_shared/cinetpayRefund.ts";

// ============================================================
// EDGE FUNCTION: refund-payment
// Cancels a paid booking and actually refunds the customer through
// CinetPay's own refund API - not just flipping a status flag in our DB.
// The actual CinetPay call lives in _shared/cinetpayRefund.ts, shared with
// create-pnr's automatic refund-on-supplier-failure path.
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: object, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number = 400): Response {
  console.error(`❌ Refund error [${status}]: ${message}`);
  return jsonResponse({ success: false, error: message }, status);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP, { ...RATE_LIMITS.PAYMENT, keyPrefix: 'refund-payment' });
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

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Corps de la requête invalide', 400);
    }

    const bookingId = body.booking_id;
    if (!bookingId || typeof bookingId !== 'string') {
      return errorResponse('booking_id requis', 400);
    }

    // Admin client for cross-table updates (payments + bookings). Ownership
    // is verified explicitly below since RLS is bypassed by this client.
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // An admin can refund any booking (support/manual intervention); a
    // regular customer can only refund their own.
    const { data: isAdmin } = await adminSupabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });

    const bookingQuery = adminSupabase
      .from('bookings')
      .select('id, user_id')
      .eq('id', bookingId);

    if (!isAdmin) {
      bookingQuery.eq('user_id', user.id);
    }

    const { data: booking, error: bookingError } = await bookingQuery.single();

    if (bookingError || !booking) {
      return errorResponse('Réservation introuvable', 404);
    }

    const reason = isAdmin && booking.user_id !== user.id
      ? `Remboursement manuel par un administrateur (${user.email || user.id})`
      : 'Annulation demandée par le client';

    const result = await refundBookingPayment(adminSupabase, bookingId, reason);

    if (!result.success) {
      return errorResponse(result.error || 'Échec du remboursement', 502);
    }

    return jsonResponse({
      success: true,
      refunded: result.refunded,
      amount: result.amount,
      currency: result.currency,
      message: result.refunded ? 'Remboursement effectué avec succès' : 'Réservation annulée',
    });
  } catch (error) {
    console.error('❌ Erreur inattendue dans refund-payment:', error instanceof Error ? error.message : 'Unknown');
    return jsonResponse({ success: false, error: 'Une erreur inattendue est survenue' }, 500);
  }
});
