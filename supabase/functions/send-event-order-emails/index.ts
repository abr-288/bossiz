import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller, isStaff } from "../_shared/auth.ts";
import { sendEmail } from "../_shared/integrations.ts";
import type { EventOrderDetails } from "../_shared/events.ts";

// ============================================================
// EDGE FUNCTION: send-event-order-emails
// Emails d'un achat de billets par la conciergerie :
// - "paid" : reçu au client + alerte à l'équipe (billets à acheter) ;
// - "purchased" : billets achetés, avec les instructions de l'équipe ;
// - "unavailable" : billets introuvables, remboursement intégral.
// Appels serveur (postPaymentSuccess, manage-event-order) ou admin uniquement.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = (Deno.env.get("SITE_URL") || "https://app.bossiz.com").replace(/\/+$/, "");
const TEAM_EMAIL = "r@bossiz.com";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const fcfa = (amount: number) => `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
const frDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

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
    const { bookingId, event = "paid" } = await req.json();
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, total_price, customer_name, customer_email, customer_phone, notes, booking_details")
      .eq("id", bookingId)
      .single();
    const d = (booking?.booking_details ?? {}) as EventOrderDetails;
    if (!booking || d.kind !== "event_concierge") return json({ success: false, error: "Commande introuvable" }, 404);

    const ref = booking.id.slice(0, 8).toUpperCase();
    const when = `${esc(frDate(d.localDate ?? ""))}${d.localTime ? ` à ${esc(d.localTime)} (heure locale)` : ""}`;
    const where = [d.venue, d.city, d.country].filter(Boolean).map(esc).join(", ");
    const summary = `
      <p style="margin:4px 0;"><strong>Événement :</strong> ${esc(d.eventName)}</p>
      <p style="margin:4px 0;"><strong>Date :</strong> ${when}</p>
      <p style="margin:4px 0;"><strong>Lieu :</strong> ${where}</p>
      <p style="margin:4px 0;"><strong>Billets :</strong> ${Number(d.quantity)} · ${d.tier === "best" ? "meilleures places disponibles" : "meilleur prix disponible"}</p>
      <p style="margin:4px 0;"><strong>Total payé :</strong> ${fcfa(Number(booking.total_price))} (dont ${fcfa(Number(d.feeXof))} de frais de conciergerie)</p>`;
    const link = `${SITE_URL}/confirmation?bookingId=${encodeURIComponent(booking.id)}`;
    const results: Record<string, boolean> = {};

    if (event === "paid") {
      const customer = await sendEmail(supabase, {
        from: "Bossiz+ Conciergerie <noreply@bossiz.com>",
        to: [booking.customer_email],
        subject: `Commande reçue – ${d.eventName} (${ref})`,
        html: layout("Votre commande de billets est reçue", `
          <p>Bonjour ${esc(booking.customer_name)},</p>
          <p>Merci, votre paiement est reçu (référence <strong>${ref}</strong>). Notre conciergerie achète maintenant vos billets auprès du vendeur officiel.</p>
          ${summary}
          <p style="background:#eef6fb; padding:12px; border-radius:6px;">Vous recevrez vos billets et les instructions d'accès par email, généralement sous 48 heures. Si les billets ne sont plus disponibles au prix indiqué, nous vous contactons ; sans solution qui vous convienne, vous êtes remboursé intégralement.</p>
          <p><a href="${link}">Suivre ma commande</a></p>
          <p>L'équipe Bossiz+</p>`),
      });
      results.customer = customer.ok;

      const team = await sendEmail(supabase, {
        from: "Bossiz+ <noreply@bossiz.com>",
        to: [TEAM_EMAIL],
        subject: `À acheter : ${Number(d.quantity)} billet(s) – ${d.eventName} (${ref})`,
        html: layout("Billets à acheter", `
          ${summary}
          <p style="margin:4px 0;"><strong>Client :</strong> ${esc(booking.customer_name)} · ${esc(booking.customer_phone)} · ${esc(booking.customer_email)}</p>
          ${booking.notes ? `<p style="margin:4px 0;"><strong>Demande :</strong> ${esc(booking.notes)}</p>` : ""}
          <p style="margin:4px 0;"><strong>Prix source :</strong> ${esc(d.sourcePrice ?? "non communiqué")} · budget billets ${fcfa(Number(d.subtotalXof))}</p>
          ${d.ticketUrl ? `<p><a href="${esc(d.ticketUrl)}">Page officielle de vente</a></p>` : ""}
          <p><a href="${SITE_URL}/admin/events">Traiter la commande</a></p>`),
      });
      results.team = team.ok;
    } else if (event === "purchased") {
      const result = await sendEmail(supabase, {
        from: "Bossiz+ Conciergerie <noreply@bossiz.com>",
        to: [booking.customer_email],
        subject: `Vos billets – ${d.eventName} (${ref})`,
        html: layout("Vos billets sont prêts", `
          <p>Bonjour ${esc(booking.customer_name)},</p>
          <p>Bonne nouvelle : vos billets pour <strong>${esc(d.eventName)}</strong> sont achetés.</p>
          ${summary}
          ${d.ticketsInfo ? `<div style="background:#e8f7ef; padding:12px; border-radius:6px; white-space:pre-line;"><strong>Vos billets et l'accès :</strong>\n${esc(d.ticketsInfo)}</div>` : ""}
          ${Array.isArray(d.ticketLinks) && d.ticketLinks.length
            ? `<ul>${d.ticketLinks.map((url: string, i: number) => `<li><a href="${esc(url)}">Billet ${i + 1}</a></li>`).join("")}</ul>`
            : ""}
          <p>Bon événement !<br>L'équipe Bossiz+</p>`),
      });
      results.customer = result.ok;
    } else if (event === "unavailable") {
      const result = await sendEmail(supabase, {
        from: "Bossiz+ Conciergerie <noreply@bossiz.com>",
        to: [booking.customer_email],
        subject: `Billets indisponibles – remboursement (${ref})`,
        html: layout("Billets indisponibles", `
          <p>Bonjour ${esc(booking.customer_name)},</p>
          <p>Nous n'avons malheureusement pas pu obtenir vos billets pour <strong>${esc(d.eventName)}</strong>.</p>
          ${d.unavailableReason ? `<p>${esc(d.unavailableReason)}</p>` : ""}
          <p>Votre commande est annulée et <strong>${fcfa(Number(booking.total_price))}</strong> vous sont remboursés sur le moyen de paiement utilisé.</p>
          <p>Notre conciergerie reste à votre disposition pour vous proposer une autre sortie.</p>
          <p>L'équipe Bossiz+</p>`),
      });
      results.customer = result.ok;
    }

    return json({ success: true, sent: results });
  } catch (error) {
    console.error("send-event-order-emails error:", error instanceof Error ? error.message : error);
    return json({ success: false, error: "Erreur interne du serveur" }, 500);
  }
});
