import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { refundBookingPayment } from "../_shared/cinetpayRefund.ts";
import { quoteHotelCancellation } from "../_shared/hotelCancellation.ts";

// ============================================================
// EDGE FUNCTION: cancel-hotel-booking
// Annulation par le client (ou un admin) d'une réservation d'hôtel
// partenaire, selon les conditions du tarif (_shared/hotelCancellation.ts).
// - dry_run : renvoie seulement les frais et le remboursement prévus ;
// - payée en ligne : rembourse le montant payé moins les frais ; l'hôtel
//   garde 90 % des frais retenus (ligne commissions ajustée) ;
// - à payer sur place : annule, les frais éventuels sont dus à l'hôtel.
// La réservation annulée libère aussitôt le stock (hotel_room_availability).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Connectez-vous" }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ success: false, error: "Connectez-vous" }, 401);

    const body = await req.json().catch(() => ({}));
    const bookingId = String(body.booking_id ?? "");
    const dryRun = body.dry_run === true;
    if (!UUID_RE.test(bookingId)) return json({ success: false, error: "Requête invalide" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });

    const { data: booking } = await admin
      .from("bookings")
      .select("id, user_id, status, payment_status, amount_paid, total_price, start_date, booking_details")
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking || (booking.user_id !== user.id && isAdmin !== true)) {
      return json({ success: false, error: "Réservation introuvable" }, 404);
    }

    const quote = quoteHotelCancellation(booking);
    if (dryRun) return json({ success: true, quote });
    if (!quote.cancellable) return json({ success: false, error: quote.reason, quote }, 409);

    const reason = booking.user_id === user.id
      ? "Annulation par le client (conditions du tarif)"
      : `Annulation par un administrateur (${user.email || user.id})`;

    let refunded = 0;
    if (quote.paid > 0 && quote.refund > 0) {
      const result = await refundBookingPayment(admin, booking.id, reason, { amount: quote.refund });
      if (!result.success) {
        return json({ success: false, error: result.error || "Le remboursement a échoué. Contactez Bossiz+." }, 502);
      }
      refunded = result.amount ?? quote.refund;
      // Le remboursement annule la part partenaire : l'hôtel garde 90 % des frais retenus.
      if (quote.fee > 0) {
        await admin
          .from("commissions")
          .update({ status: "pending", booking_amount: quote.fee, commission_amount: Math.round(quote.fee * 0.9) })
          .eq("booking_id", booking.id)
          .eq("payout_status", "not_scheduled");
      }
    } else {
      // Rien à rembourser (non payée, ou frais = montant payé) : annulation
      // simple. Une réservation payée et non remboursable garde sa part
      // partenaire telle quelle.
      const { error: cancelError } = await admin
        .from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", booking.id)
        .neq("status", "cancelled");
      if (cancelError) {
        console.error("Annulation hôtel:", cancelError.message);
        return json({ success: false, error: "L'annulation n'a pas pu être enregistrée." }, 500);
      }
    }

    const cancellation = {
      at: new Date().toISOString(),
      by: booking.user_id === user.id ? "customer" : "admin",
      fee: quote.fee,
      refund: refunded,
      payAtProperty: quote.payAtProperty,
      // Paiement sur place : frais dus par le client directement à l'hôtel (art. 7.9).
      feeDueToHotel: quote.paid === 0 && quote.payAtProperty ? quote.fee : 0,
    };
    await admin
      .from("bookings")
      .update({ booking_details: { ...(booking.booking_details ?? {}), cancellation } })
      .eq("id", booking.id);

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-hotel-booking-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ bookingId: booking.id, event: "cancelled" }),
      });
    } catch (emailError) {
      console.error("Emails d'annulation non envoyés:", emailError instanceof Error ? emailError.message : emailError);
    }

    return json({ success: true, fee: quote.fee, refund: refunded });
  } catch (error) {
    console.error("cancel-hotel-booking error:", error instanceof Error ? error.message : error);
    return json({ success: false, error: "Erreur interne du serveur" }, 500);
  }
});
