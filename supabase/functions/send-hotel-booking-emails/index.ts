import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller, isStaff } from "../_shared/auth.ts";
import { sendEmail } from "../_shared/integrations.ts";

// ============================================================
// EDGE FUNCTION: send-hotel-booking-emails
// Emails d'une réservation d'hôtel partenaire, au client et à l'hôtel :
// - event "confirmed" (défaut) : appelée par create-hotel-booking (paiement
//   sur place) et par postPaymentSuccess (paiement en ligne) ;
// - event "cancelled" : appelée par cancel-hotel-booking (frais, remboursement).
// Appels serveur ou admin uniquement.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = (Deno.env.get("SITE_URL") || "https://app.bossiz.com").replace(/\/+$/, "");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const fcfa = (amount: number) => `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;

const frDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

interface Item {
  room: string;
  quantity: number;
  occupancy: number;
  pricePerNight: number;
  breakfastIncluded: boolean;
  freeCancellation: boolean;
  freeCancellationDays: number;
  lateCancellationFeePercent?: number;
  payAtProperty: boolean;
}

function cancellation(item: Item, checkIn: string) {
  if (!item.freeCancellation) return "Non remboursable (100 % en cas d'annulation)";
  const limit = new Date(`${checkIn}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() - Math.max(item.freeCancellationDays || 1, 1));
  const late = item.lateCancellationFeePercent ?? 20;
  return `Annulation gratuite jusqu'au ${limit.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" })} à 23 h 59, puis ${late} % de frais`;
}

function layout(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background:#f5f5f5; margin:0; padding:20px;">
  <div style="max-width: 620px; margin: 0 auto; background:#fff; border-radius: 8px; overflow:hidden;">
    <div style="background:#0b3d5c; color:#fff; padding: 20px 24px;"><h1 style="margin:0; font-size: 20px;">${title}</h1></div>
    <div style="padding: 24px;">${body}</div>
  </div></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await getCaller(req, supabase);
  if (!isStaff(caller)) return json({ success: false, error: caller ? "Forbidden" : "Unauthorized" }, caller ? 403 : 401);

  try {
    const { bookingId, event = "confirmed" } = await req.json();
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, start_date, end_date, guests, total_price, customer_name, customer_email, customer_phone, notes, booking_details, payment_status, services(name, location, maps_url, agency_id, specifications)")
      .eq("id", bookingId)
      .single();
    // deno-lint-ignore no-explicit-any
    const details = (booking?.booking_details ?? {}) as any;
    if (!booking || details.kind !== "partner_hotel") return json({ success: false, error: "Réservation introuvable" }, 404);

    // deno-lint-ignore no-explicit-any
    const service = booking.services as any;
    const items = (Array.isArray(details.items) ? details.items : []) as Item[];
    const payAtProperty = details.payAtProperty === true;
    const nights = Number(details.nights) || 1;
    const ref = booking.id.slice(0, 8).toUpperCase();
    const specs = service?.specifications ?? {};

    const itemsHtml = items.map((item) => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #eee;"><strong>${item.quantity} × ${esc(item.room)}</strong><br>
          <span style="font-size:13px; color:#666;">${item.occupancy} voyageur(s) · ${item.breakfastIncluded ? "Petit-déjeuner inclus" : "Petit-déjeuner non inclus"} · ${esc(cancellation(item, booking.start_date))}</span></td>
        <td style="padding:8px; border-bottom:1px solid #eee; text-align:right; white-space:nowrap;">${fcfa(item.quantity * item.pricePerNight * nights)}</td>
      </tr>`).join("");

    const stayHtml = `
      <p style="margin:4px 0;"><strong>Arrivée :</strong> ${esc(frDate(booking.start_date))}${specs.checkInFrom ? ` (à partir de ${esc(specs.checkInFrom)})` : ""}</p>
      <p style="margin:4px 0;"><strong>Départ :</strong> ${esc(frDate(booking.end_date))}${specs.checkOutUntil ? ` (jusqu'à ${esc(specs.checkOutUntil)})` : ""}</p>
      <p style="margin:4px 0;"><strong>Durée :</strong> ${nights} nuit${nights > 1 ? "s" : ""} · ${booking.guests} voyageur${booking.guests > 1 ? "s" : ""}</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">${itemsHtml}
        <tr><td style="padding:8px;"><strong>Total</strong></td><td style="padding:8px; text-align:right;"><strong>${fcfa(Number(booking.total_price))}</strong></td></tr>
      </table>`;

    const paymentLine = payAtProperty
      ? `<p style="background:#fff7e6; padding:12px; border-radius:6px;"><strong>Paiement sur place :</strong> vous réglez ${fcfa(Number(booking.total_price))} directement à l'hôtel.</p>`
      : `<p style="background:#e8f7ef; padding:12px; border-radius:6px;"><strong>Payé en ligne</strong> : ${fcfa(Number(booking.total_price))}.</p>`;

    const customerHtml = layout(`Réservation confirmée – ${esc(service?.name)}`, `
      <p>Bonjour ${esc(booking.customer_name)},</p>
      <p>Votre réservation à <strong>${esc(service?.name)}</strong>${service?.location ? `, ${esc(service.location)}` : ""} est confirmée. Référence : <strong>${ref}</strong>.</p>
      ${stayHtml}
      ${paymentLine}
      <p style="font-size:13px; color:#666;">En cas de non-présentation sans annulation, 100 % du séjour est dû. L'annulation en ligne est possible jusqu'à la veille de l'arrivée, depuis votre réservation.</p>
      ${service?.maps_url ? `<p><a href="${esc(service.maps_url)}">Voir l'hôtel sur la carte</a></p>` : ""}
      <p><a href="${SITE_URL}/confirmation?bookingId=${encodeURIComponent(booking.id)}" style="background:#0b3d5c; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none;">Voir ma réservation</a></p>
      <p>Bon séjour,<br>L'équipe Bossiz+</p>`);

    const isCancellation = event === "cancelled";
    const cancelInfo = (details.cancellation ?? {}) as { fee?: number; refund?: number; feeDueToHotel?: number };
    const cancelFee = Number(cancelInfo.fee || 0);
    const cancelRefund = Number(cancelInfo.refund || 0);
    const cancelSummary = `
      <p style="margin:4px 0;"><strong>Séjour annulé :</strong> ${esc(frDate(booking.start_date))} → ${esc(frDate(booking.end_date))}</p>
      <p style="margin:4px 0;"><strong>Frais d'annulation :</strong> ${cancelFee > 0 ? fcfa(cancelFee) : "aucun"}</p>
      ${cancelRefund > 0 ? `<p style="margin:4px 0;"><strong>Remboursement :</strong> ${fcfa(cancelRefund)}, sur le moyen de paiement utilisé.</p>` : ""}`;

    const results: Record<string, boolean> = {};
    const customerResult = await sendEmail(supabase, {
      from: "Bossiz+ <noreply@bossiz.com>",
      to: [booking.customer_email],
      subject: isCancellation
        ? `Réservation annulée – ${service?.name ?? "Hôtel"} (${ref})`
        : `Réservation confirmée – ${service?.name ?? "Hôtel"} (${ref})`,
      html: isCancellation
        ? layout(`Réservation annulée – ${esc(service?.name)}`, `
            <p>Bonjour ${esc(booking.customer_name)},</p>
            <p>Votre réservation <strong>${ref}</strong> à ${esc(service?.name)} est annulée.</p>
            ${cancelSummary}
            ${cancelFee > 0 && Number(cancelInfo.feeDueToHotel || 0) > 0 ? `<p>Ces frais sont à régler directement à l'établissement, selon les conditions acceptées lors de la réservation.</p>` : ""}
            <p>L'équipe Bossiz+</p>`)
        : customerHtml,
    });
    results.customer = customerResult.ok;

    // Hôtel : email du compte propriétaire, plus l'email de contact s'il diffère.
    const recipients = new Set<string>();
    if (service?.agency_id) {
      const { data: agency } = await supabase
        .from("agencies")
        .select("owner_id, contact_email")
        .eq("id", service.agency_id)
        .maybeSingle();
      if (agency?.owner_id) {
        const { data: owner } = await supabase.auth.admin.getUserById(agency.owner_id);
        if (owner?.user?.email) recipients.add(owner.user.email.toLowerCase());
      }
      if (agency?.contact_email) recipients.add(agency.contact_email.toLowerCase());
    }
    if (recipients.size > 0 && isCancellation) {
      const partnerResult = await sendEmail(supabase, {
        from: "Bossiz+ Partenaires <partenaires@bossiz.com>",
        to: [...recipients],
        subject: `Réservation annulée ${ref} – ${frDate(booking.start_date)}`,
        html: layout(`Réservation annulée – ${esc(service?.name)}`, `
          <p>La réservation <strong>${ref}</strong> de ${esc(booking.customer_name)} a été annulée. Les logements sont de nouveau disponibles à la vente.</p>
          ${cancelSummary}
          ${Number(cancelInfo.feeDueToHotel || 0) > 0
            ? `<p style="background:#fff7e6; padding:12px; border-radius:6px;">Frais d'annulation dus par le client à l'établissement : ${fcfa(Number(cancelInfo.feeDueToHotel))}.</p>`
            : cancelFee > 0 ? `<p>Vous recevrez 90 % des frais retenus (${fcfa(Math.round(cancelFee * 0.9))}) avec vos reversements.</p>` : ""}
          <p><a href="${SITE_URL}/agency/hotel-bookings">Voir mes réservations</a></p>`),
      });
      results.partner = partnerResult.ok;
    } else if (recipients.size > 0) {
      const partnerHtml = layout(`Nouvelle réservation – ${esc(service?.name)}`, `
        <p>Vous avez une nouvelle réservation (référence <strong>${ref}</strong>).</p>
        <p style="margin:4px 0;"><strong>Client :</strong> ${esc(booking.customer_name)} · ${esc(booking.customer_phone)} · ${esc(booking.customer_email)}</p>
        ${booking.notes ? `<p style="margin:4px 0;"><strong>Demande du client :</strong> ${esc(booking.notes)}</p>` : ""}
        ${stayHtml}
        ${payAtProperty
          ? `<p style="background:#fff7e6; padding:12px; border-radius:6px;"><strong>À encaisser sur place :</strong> ${fcfa(Number(booking.total_price))}.</p>`
          : `<p style="background:#e8f7ef; padding:12px; border-radius:6px;"><strong>Payé en ligne par le client.</strong> Votre part vous sera reversée par Bossiz+.</p>`}
        <p><a href="${SITE_URL}/agency/hotel-bookings">Voir mes réservations</a></p>`);
      const partnerResult = await sendEmail(supabase, {
        from: "Bossiz+ Partenaires <partenaires@bossiz.com>",
        to: [...recipients],
        subject: `Nouvelle réservation ${ref} – ${frDate(booking.start_date)}`,
        html: partnerHtml,
      });
      results.partner = partnerResult.ok;
    }

    return json({ success: true, sent: results });
  } catch (error) {
    console.error("send-hotel-booking-emails error:", error instanceof Error ? error.message : error);
    return json({ success: false, error: "Erreur interne du serveur" }, 500);
  }
});
