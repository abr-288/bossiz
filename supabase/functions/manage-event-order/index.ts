import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller } from "../_shared/auth.ts";
import { refundBookingPayment } from "../_shared/cinetpayRefund.ts";
import type { EventOrderDetails } from "../_shared/events.ts";

// ============================================================
// EDGE FUNCTION: manage-event-order
// Traitement par l'équipe d'un achat de billets par la conciergerie
// (/admin/events) :
// - "purchased" : billets achetés -> réservation confirmée, billets et
//   instructions envoyés au client ;
// - "unavailable" : billets introuvables -> remboursement intégral et email.
// Admin uniquement.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const caller = await getCaller(req, supabase);
  if (caller?.kind !== "user" || !caller.isAdmin) return json({ success: false, error: "Accès réservé aux administrateurs" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const bookingId = String(body.booking_id ?? "");
    const action = String(body.action ?? "");

    const { data: booking } = await supabase
      .from("bookings")
      .select("id, status, payment_status, booking_details")
      .eq("id", bookingId)
      .maybeSingle();
    const details = (booking?.booking_details ?? {}) as EventOrderDetails;
    if (!booking || details.kind !== "event_concierge") return json({ success: false, error: "Commande introuvable" }, 404);
    if (booking.payment_status !== "paid") return json({ success: false, error: "Cette commande n'est pas payée" }, 409);
    if (["purchased", "unavailable"].includes(details.conciergeStatus ?? "")) {
      return json({ success: false, error: "Cette commande est déjà traitée" }, 409);
    }

    const now = new Date().toISOString();
    if (action === "purchased") {
      const ticketsInfo = String(body.tickets_info ?? "").trim().slice(0, 4000);
      const ticketLinks = (Array.isArray(body.ticket_links) ? body.ticket_links : [])
        .map((u: unknown) => String(u).trim())
        .filter((u: string) => /^https?:\/\//.test(u))
        .slice(0, 20);
      if (!ticketsInfo && ticketLinks.length === 0) {
        return json({ success: false, error: "Indiquez les billets : instructions ou liens" }, 400);
      }
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          booking_details: {
            ...details,
            conciergeStatus: "purchased",
            purchasedAt: now,
            purchasedBy: caller.userId,
            ticketsInfo: ticketsInfo || null,
            ticketLinks,
            purchaseCost: Number(body.purchase_cost) > 0 ? Number(body.purchase_cost) : null,
          },
          updated_at: now,
        })
        .eq("id", booking.id);
      if (error) return json({ success: false, error: error.message }, 500);
    } else if (action === "unavailable") {
      const reason = String(body.reason ?? "").trim().slice(0, 1000);
      const refund = await refundBookingPayment(supabase, booking.id, "Billets indisponibles (conciergerie)");
      if (!refund.success) {
        return json({ success: false, error: refund.error || "Le remboursement a échoué : remboursez le client manuellement." }, 502);
      }
      await supabase
        .from("bookings")
        .update({
          booking_details: { ...details, conciergeStatus: "unavailable", unavailableAt: now, unavailableReason: reason || null },
          updated_at: now,
        })
        .eq("id", booking.id);
    } else {
      return json({ success: false, error: "Action inconnue" }, 400);
    }

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-event-order-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ bookingId: booking.id, event: action }),
      });
    } catch (emailError) {
      console.error("Email de commande non envoyé:", emailError instanceof Error ? emailError.message : emailError);
    }

    return json({ success: true });
  } catch (error) {
    console.error("manage-event-order error:", error instanceof Error ? error.message : error);
    return json({ success: false, error: "Erreur interne du serveur" }, 500);
  }
});
