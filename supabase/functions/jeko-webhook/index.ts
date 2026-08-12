import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP, checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { verifyJekoWebhookSignature } from "../_shared/jeko.ts";
import { handlePaymentSuccess } from "../_shared/postPaymentSuccess.ts";

// ============================================================
// EDGE FUNCTION: jeko-webhook
// Description: Reçoit les notifications de paiement Jèko
// (event "transaction.completed") et confirme la réservation/l'abonnement
// correspondant. À configurer comme URL de webhook dans le Cockpit Jèko
// (Paramètres > API & Webhooks) : https://<projet>.supabase.co/functions/v1/jeko-webhook
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP, { ...RATE_LIMITS.SEARCH, keyPrefix: 'jeko-webhook' });
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, RATE_LIMITS.SEARCH, corsHeaders);
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║            PAYMENT WEBHOOK - JÈKO                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Configuration Supabase manquante');
      return jsonResponse({ success: false, error: 'Server configuration error' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // IMPORTANT: la signature se calcule sur le corps BRUT, jamais sur le
    // JSON re-sérialisé après parsing (sinon un espace ou un ordre de clé
    // différent invaliderait la vérification à tort).
    const rawBody = await req.text();

    const { data: jekoRow } = await supabase
      .from('integration_credentials')
      .select('credentials')
      .eq('provider', 'jeko')
      .maybeSingle();

    const webhookSecret = jekoRow?.credentials?.webhook_secret;
    if (!webhookSecret) {
      console.error('❌ webhook_secret Jèko non configuré (/admin/integrations)');
      return jsonResponse({ success: false, error: 'Webhook not configured' }, 500);
    }

    const signature = req.headers.get('Jeko-Signature');
    const validSignature = await verifyJekoWebhookSignature(rawBody, signature, webhookSecret);

    if (!validSignature) {
      console.error('❌ Signature Jèko invalide');
      return jsonResponse({ success: false, error: 'Invalid signature' }, 401);
    }

    console.log('✅ Signature vérifiée');

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
    }

    if (payload.event !== 'transaction.completed' || payload.data?.transactionType !== 'payment') {
      // Événement non pertinent (ex: transfert) : on accuse quand même
      // réception pour éviter des retries inutiles côté Jèko.
      console.log('   - Événement ignoré:', payload.event, payload.data?.transactionType);
      return jsonResponse({ success: true, ignored: true });
    }

    const jekoTransaction = payload.data;
    const paymentLinkId = jekoTransaction.transactionDetails?.paymentLinkId;

    if (!paymentLinkId) {
      console.error('❌ paymentLinkId absent du webhook');
      return jsonResponse({ success: false, error: 'Missing paymentLinkId' }, 400);
    }

    console.log('   - Payment Link ID:', paymentLinkId);
    console.log('   - Statut Jèko:', jekoTransaction.status);

    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('id, status, transaction_id, booking_id, subscription_id, payment_method')
      .eq('transaction_id', paymentLinkId)
      .eq('payment_provider', 'jeko')
      .maybeSingle();

    if (fetchError || !existingPayment) {
      console.error('❌ Paiement introuvable pour ce paymentLinkId');
      return jsonResponse({ success: false, error: 'Payment not found' }, 404);
    }

    if (existingPayment.status === 'completed') {
      console.log('⚠️ Paiement déjà traité, ignoré');
      return jsonResponse({ success: true, message: 'Already processed', status: 'completed' });
    }

    const isAccepted = jekoTransaction.status === 'success';
    const newStatus = isAccepted ? 'completed' : 'failed';

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        payment_data: {
          jeko_payment_link_id: paymentLinkId,
          jeko_transaction_id: jekoTransaction.id,
          jeko_status: jekoTransaction.status,
          payment_method: jekoTransaction.paymentMethod,
          verified_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPayment.id);

    if (updateError) {
      console.error('❌ Erreur mise à jour paiement:', updateError.message);
    } else {
      console.log('✅ Paiement mis à jour:', newStatus);
    }

    if (isAccepted) {
      await handlePaymentSuccess({
        supabase,
        supabaseUrl,
        supabaseServiceKey,
        transactionId: paymentLinkId,
        bookingId: existingPayment.booking_id,
        subscriptionId: existingPayment.subscription_id,
        paymentMethod: jekoTransaction.paymentMethod || existingPayment.payment_method || 'jeko',
      });
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ WEBHOOK TRAITÉ                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    return jsonResponse({
      success: true,
      status: jekoTransaction.status,
      booking_id: existingPayment.booking_id,
      processed: true,
    });
  } catch (error) {
    console.error('❌ Erreur inattendue:', error instanceof Error ? error.message : 'Unknown');
    return jsonResponse({ success: false, error: 'Internal server error' }, 500);
  }
});
