// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export async function scheduleAgencyPayout(params: {
  supabase: SupabaseClient;
  supabaseUrl: string;
  supabaseServiceKey: string;
  bookingId: string;
}): Promise<void> {
  const { supabase, supabaseUrl, supabaseServiceKey, bookingId } = params;
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, total_price, amount_paid, balance_due, payment_status, status, services(type, agency_id)")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    console.error("Could not load booking for partner payout:", bookingError.message);
    return;
  }
  if (!booking?.services?.agency_id || !booking.total_price) return;
  if (Number(booking.amount_paid || 0) < Number(booking.total_price) || Number(booking.balance_due || 0) > 0) return;
  if (booking.services.type === "flight" && booking.status !== "confirmed") return;

  const { data: jekoPayment, error: paymentError } = await supabase
    .from("payments")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("payment_provider", "jeko")
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();
  if (paymentError) {
    console.error("Could not verify Jèko payment for partner payout:", paymentError.message);
    return;
  }
  if (!jekoPayment) return;

  const { data: commission, error: commissionError } = await supabase
    .from("commissions")
    .select("id, payout_status")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (commissionError) {
    console.error("Could not load agency commission for payout:", commissionError.message);
    return;
  }
  if (!commission || commission.payout_status !== "not_scheduled") return;

  const { data: payoutDetails, error: payoutDetailsError } = await supabase
    .from("agency_payout_details")
    .select("agency_id")
    .eq("agency_id", booking.services.agency_id)
    .maybeSingle();
  if (payoutDetailsError) {
    console.error("Could not read agency payout destination:", payoutDetailsError.message);
    return;
  }

  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error: scheduleError } = await supabase
    .from("commissions")
    .update({
      payout_status: payoutDetails ? "ready" : "awaiting_details",
      payout_due_at: dueAt,
      payout_reference: `bossiz-${commission.id}`,
    })
    .eq("id", commission.id)
    .eq("payout_status", "not_scheduled");

  if (scheduleError) {
    console.error("Could not schedule agency payout:", scheduleError.message);
    return;
  }
  if (!payoutDetails) return;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/process-agency-payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "apikey": supabaseServiceKey,
      },
      body: JSON.stringify({ agencyId: booking.services.agency_id, commissionId: commission.id }),
    });
    if (!response.ok) {
      console.error("Jèko partner payout could not be initiated:", response.status);
    }
  } catch (error) {
    console.error("Network error while initiating Jèko partner payout:", error);
  }
}
