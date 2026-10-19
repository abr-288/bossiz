// ============================================================
// Shared helper: refund a booking's completed payment - via Jèko (current
// gateway, see jekoRefund.ts) or CinetPay (older payments).
// Used both by the user-triggered `refund-payment` function (cancellation)
// and by `create-pnr` (automatic refund when a flight can't actually be
// ticketed with the supplier after the customer has already been charged).
//
// IMPORTANT: the CinetPay refund endpoint/payload below has not been
// exercised against a live CinetPay account from this environment. Verify
// against CinetPay's current refund API docs in a sandbox before relying on
// this in production.
// ============================================================

import { sendJekoRefund } from "./jekoRefund.ts";

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export interface RefundResult {
  success: boolean;
  refunded: boolean;
  amount?: number;
  currency?: string;
  error?: string;
}

export async function refundBookingPayment(
  supabase: SupabaseClient,
  bookingId: string,
  reason: string,
  // Remboursement partiel (ex. annulation d'hôtel avec frais retenus) :
  // montant à rendre au client, plafonné au montant payé.
  options: { amount?: number } = {}
): Promise<RefundResult> {
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, payment_status')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return { success: false, refunded: false, error: 'Réservation introuvable' };
  }

  if (booking.status === 'cancelled' || booking.payment_status === 'refunded') {
    return { success: true, refunded: false, error: 'Déjà annulée/remboursée' };
  }

  if (booking.payment_status !== 'paid' && booking.payment_status !== 'partially_paid') {
    // Nothing was actually charged - just cancel. (A deposit - partially_paid -
    // was charged and goes through the refund below.)
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', bookingId);
    return { success: true, refunded: false };
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, transaction_id, amount, currency, payment_data, payment_provider')
    .eq('booking_id', bookingId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error('❌ refundBookingPayment: aucun paiement complété trouvé pour', bookingId);
    return { success: false, refunded: false, error: 'Paiement introuvable' };
  }

  const refundAmount = options.amount !== undefined
    ? Math.min(Math.max(Math.round(options.amount), 0), Number(payment.amount))
    : Number(payment.amount);
  const refundPayment = { ...payment, amount: refundAmount };

  if (payment.payment_provider === 'jeko') {
    const outcome = await sendJekoRefund(supabase, refundPayment, reason);
    if (!outcome.ok) {
      return { success: false, refunded: false, error: outcome.error };
    }
    // payment_data.refund (virement, statut) a déjà été enregistré par
    // sendJekoRefund : on ne change que le statut du paiement.
    const nowIso = new Date().toISOString();
    await supabase.from('payments').update({ status: 'refunded', updated_at: nowIso }).eq('id', payment.id);
    return await finalizeRefund(supabase, bookingId, refundPayment, nowIso);
  }

  const cinetpayApiKey = Deno.env.get('CINETPAY_API_KEY');
  const cinetpaySiteId = Deno.env.get('CINETPAY_SITE_ID');

  if (!cinetpayApiKey || !cinetpaySiteId) {
    return { success: false, refunded: false, error: 'Passerelle de paiement non configurée' };
  }

  let refundData: any;
  try {
    const refundResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment/refund/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        apikey: cinetpayApiKey,
        site_id: cinetpaySiteId,
        transaction_id: payment.transaction_id,
        amount: refundAmount,
        currency: payment.currency || 'XOF',
      }),
    });

    const responseText = await refundResponse.text();
    try {
      refundData = JSON.parse(responseText);
    } catch {
      console.error('❌ refundBookingPayment: réponse CinetPay non-JSON:', responseText.substring(0, 200));
      return { success: false, refunded: false, error: 'Réponse invalide de la passerelle de paiement' };
    }
  } catch (fetchError) {
    console.error('❌ refundBookingPayment: erreur réseau CinetPay:', fetchError);
    return { success: false, refunded: false, error: 'Impossible de contacter la passerelle de paiement' };
  }

  if (refundData.code !== '00' && refundData.code !== 0 && refundData.code !== '0') {
    console.error('❌ refundBookingPayment: remboursement CinetPay refusé:', refundData.code, refundData.message);
    return { success: false, refunded: false, error: refundData.message || 'Remboursement refusé par la passerelle de paiement' };
  }

  const nowIso = new Date().toISOString();

  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      payment_data: { ...(payment.payment_data || {}), refund_response: refundData, refund_reason: reason, refunded_at: nowIso, refunded_amount: refundAmount },
      updated_at: nowIso,
    })
    .eq('id', payment.id);

  return await finalizeRefund(supabase, bookingId, refundPayment, nowIso);
}

// Réservation annulée et remboursée, part partenaire non versée
async function finalizeRefund(
  supabase: SupabaseClient,
  bookingId: string,
  payment: { amount: number; currency?: string },
  nowIso: string,
): Promise<RefundResult> {
  const { error: bookingUpdateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', payment_status: 'refunded', updated_at: nowIso })
    .eq('id', bookingId);

  if (bookingUpdateError) {
    console.error('❌ refundBookingPayment: remboursement confirmé mais échec MAJ bookings:', bookingUpdateError.message);
    return { success: false, refunded: true, amount: payment.amount, currency: payment.currency, error: 'Remboursé mais mise à jour de la réservation échouée' };
  }

  // Réservation remboursée : la part du partenaire ne doit plus être
  // versée (process-agency-payouts ne relit pas le statut de la
  // réservation). Un virement déjà parti ou en cours reste à traiter à la main.
  const { error: commissionCancelError } = await supabase
    .from('commissions')
    .update({ status: 'cancelled' })
    .eq('booking_id', bookingId)
    .eq('status', 'pending')
    .in('payout_status', ['not_scheduled', 'awaiting_details', 'ready', 'failed']);
  if (commissionCancelError) {
    console.error('❌ refundBookingPayment: part partenaire non annulée après remboursement:', commissionCancelError.message);
  }

  return { success: true, refunded: true, amount: payment.amount, currency: payment.currency };
}
