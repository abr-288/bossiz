import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller, isStaff } from "../_shared/auth.ts";
import { sendEmail } from "../_shared/integrations.ts";

// ============================================================
// EDGE FUNCTION: send-hotel-commission-invoice
// Envoie à l'hôtel sa facture mensuelle de commission (10 % des séjours
// payés sur place, contrat hébergement art. 6.3), émise depuis
// /admin/hotel-commissions. Admin ou appel serveur uniquement.
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
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await getCaller(req, supabase);
  if (!isStaff(caller)) return json({ success: false, error: caller ? "Forbidden" : "Unauthorized" }, caller ? 403 : 401);

  try {
    const { invoiceId } = await req.json();
    const { data: invoice } = await supabase
      .from("hotel_onsite_commission_invoices")
      .select("id, agency_id, period, stays_count, stays_amount, commission_rate, commission_amount, booking_ids, due_at, status")
      .eq("id", invoiceId)
      .maybeSingle();
    if (!invoice || invoice.status === "cancelled") return json({ success: false, error: "Facture introuvable" }, 404);

    const { data: agency } = await supabase
      .from("agencies")
      .select("name, owner_id, contact_email")
      .eq("id", invoice.agency_id)
      .maybeSingle();

    const recipients = new Set<string>();
    if (agency?.owner_id) {
      const { data: owner } = await supabase.auth.admin.getUserById(agency.owner_id);
      if (owner?.user?.email) recipients.add(owner.user.email.toLowerCase());
    }
    if (agency?.contact_email) recipients.add(agency.contact_email.toLowerCase());
    if (recipients.size === 0) return json({ success: false, error: "Aucun email pour cet hôtel" }, 422);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, customer_name, start_date, end_date, total_price")
      .in("id", invoice.booking_ids)
      .order("end_date");

    const period = new Date(`${invoice.period}T00:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
    const ref = `COM-${invoice.period.slice(0, 7)}-${invoice.id.slice(0, 6).toUpperCase()}`;
    const rows = (bookings ?? []).map((b) => `
      <tr>
        <td style="padding:6px; border-bottom:1px solid #eee;">${b.id.slice(0, 8).toUpperCase()}</td>
        <td style="padding:6px; border-bottom:1px solid #eee;">${esc(b.customer_name)}</td>
        <td style="padding:6px; border-bottom:1px solid #eee;">${esc(frDate(b.start_date))} → ${esc(frDate(b.end_date))}</td>
        <td style="padding:6px; border-bottom:1px solid #eee; text-align:right;">${fcfa(Number(b.total_price))}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height:1.6; color:#333; background:#f5f5f5; padding:20px;">
      <div style="max-width:680px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden;">
        <div style="background:#0b3d5c; color:#fff; padding:20px 24px;"><h1 style="margin:0; font-size:20px;">Facture de commission – ${esc(period)}</h1></div>
        <div style="padding:24px;">
          <p>Bonjour,</p>
          <p>Voici la facture de commission Bossiz+ de <strong>${esc(agency?.name)}</strong> pour les séjours payés sur place dont le départ a eu lieu en ${esc(period)} (contrat de partenariat, article 6.3).</p>
          <p style="margin:4px 0;"><strong>Référence :</strong> ${ref}</p>
          <p style="margin:4px 0;"><strong>Séjours :</strong> ${invoice.stays_count} · <strong>Montant des séjours :</strong> ${fcfa(Number(invoice.stays_amount))}</p>
          <p style="margin:4px 0; font-size:18px;"><strong>Commission due (${Number(invoice.commission_rate)} %) : ${fcfa(Number(invoice.commission_amount))}</strong></p>
          <p style="margin:4px 0;"><strong>À régler avant le :</strong> ${esc(frDate(invoice.due_at))}, par Mobile Money ou virement.</p>
          <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:13px;">
            <tr style="background:#f0f4f7;"><th style="padding:6px; text-align:left;">Réf.</th><th style="padding:6px; text-align:left;">Client</th><th style="padding:6px; text-align:left;">Séjour</th><th style="padding:6px; text-align:right;">Montant</th></tr>
            ${rows}
          </table>
          <p style="font-size:13px; color:#666;">Une ligne à contester ? Répondez à cet email dans les 8 jours avec la référence de la réservation et le motif (article 6.4). Les non-présentations déclarées dans votre espace ne sont pas facturées.</p>
          <p><a href="${SITE_URL}/agency/hotel-bookings">Voir mes réservations et factures</a></p>
          <p>L'équipe Bossiz+<br>Conciergerie BOSSIZ · contact@bossiz.com · +225 07 01 67 60 09</p>
        </div>
      </div></body></html>`;

    const result = await sendEmail(supabase, {
      from: "Bossiz+ Partenaires <partenaires@bossiz.com>",
      to: [...recipients],
      subject: `Facture de commission ${ref} – ${fcfa(Number(invoice.commission_amount))}`,
      html,
    });

    return json({ success: result.ok, error: result.ok ? undefined : "Email non envoyé" }, result.ok ? 200 : 502);
  } catch (error) {
    console.error("send-hotel-commission-invoice error:", error instanceof Error ? error.message : error);
    return json({ success: false, error: "Erreur interne du serveur" }, 500);
  }
});
