// ============================================================
// Shared helper: refund a booking's completed CinetPay payment.
// Used both by the user-triggered `refund-payment` function (cancellation)
// and by `create-pnr` (automatic refund when a flight can't actually be
// ticketed with the supplier after the customer has already been charged).
//
// IMPORTANT: the CinetPay refund endpoint/payload below has not been
// exercised against a live CinetPay account from this environment. Verify
// against CinetPay's current refund API docs in a sandbox before relying on
// this in production.
// ============================================================

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
  reason: string
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

  if (booking.payment_status !== 'paid') {
    // Nothing was actually charged - just cancel.
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', bookingId);
    return { success: true, refunded: false };
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, transaction_id, amount, currency, payment_data')
    .eq('booking_id', bookingId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error('❌ refundBookingPayment: aucun paiement complété trouvé pour', bookingId);
    return { success: false, refunded: false, error: 'Paiement introuvable' };
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
        amount: payment.amount,
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
      payment_data: { ...(payment.payment_data || {}), refund_response: refundData, refund_reason: reason, refunded_at: nowIso },
      updated_at: nowIso,
    })
    .eq('id', payment.id);

  const { error: bookingUpdateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', payment_status: 'refunded', updated_at: nowIso })
    .eq('id', bookingId);

  if (bookingUpdateError) {
    console.error('❌ refundBookingPayment: remboursement CinetPay confirmé mais échec MAJ bookings:', bookingUpdateError.message);
    return { success: false, refunded: true, amount: payment.amount, currency: payment.currency, error: 'Remboursé mais mise à jour de la réservation échouée' };
  }

  return { success: true, refunded: true, amount: payment.amount, currency: payment.currency };
}
