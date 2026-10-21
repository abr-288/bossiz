import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { conciergeFee, loadConciergeConfig } from "../_shared/events.ts";

// ============================================================
// EDGE FUNCTION: create-event-order
// Achat de billets par la conciergerie pour un événement du catalogue
// (EventDetail.tsx). Le prix est relu en base (events.price_*_xof, converti à
// la dernière synchronisation), jamais pris au client ; les frais de service
// viennent de site_config 'event_concierge'. Crée une réservation à payer
// (bookings, booking_details.kind = 'event_concierge') : une fois payée,
// l'équipe achète les billets chez le vendeur officiel (/admin/events).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Connectez-vous pour acheter des billets" }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ success: false, error: "Connectez-vous pour acheter des billets" }, 401);

    const body = await req.json().catch(() => ({}));
    const eventId = String(body.event_id ?? "");
    const quantity = Number(body.quantity);
    const tier = body.tier === "best" ? "best" : "standard";
    const customerName = String(body.customer_name ?? "").trim().slice(0, 120);
    const customerEmail = String(body.customer_email ?? "").trim().toLowerCase().slice(0, 254);
    const customerPhone = String(body.customer_phone ?? "").trim().slice(0, 40);
    const notes = String(body.notes ?? "").trim().slice(0, 1000);

    if (!UUID_RE.test(eventId)) return json({ success: false, error: "Requête invalide" }, 400);
    if (!customerName || !EMAIL_RE.test(customerEmail) || customerPhone.length < 6) {
      return json({ success: false, error: "Renseignez votre nom, votre email et votre téléphone" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const config = await loadConciergeConfig(admin);
    if (!config.enabled) return json({ success: false, error: "L'achat de billets est momentanément indisponible" }, 409);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > config.maxTickets) {
      return json({ success: false, error: `Choisissez entre 1 et ${config.maxTickets} billets` }, 400);
    }

    const { data: event } = await admin
      .from("events")
      .select("id, slug, source, name, status, local_date, local_time, starts_at, venue_name, city, country, price_min_xof, price_max_xof, price_min, price_currency, ticket_url, is_published")
      .eq("id", eventId)
      .maybeSingle();
    if (!event || !event.is_published || event.source !== "ticketmaster") {
      return json({ success: false, error: "Événement introuvable" }, 404);
    }
    if (event.status === "cancelled" || event.status === "offsale") {
      return json({ success: false, error: "Les billets de cet événement ne sont plus en vente" }, 409);
    }
    // Au moins 2 jours pour acheter et transmettre les billets.
    const minDate = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    if (event.local_date < minDate) {
      return json({ success: false, error: "Cet événement est trop proche pour un achat par la conciergerie. Contactez-nous." }, 409);
    }
    const unitPrice = tier === "best" ? (event.price_max_xof ?? event.price_min_xof) : event.price_min_xof;
    if (!unitPrice || unitPrice <= 0) {
      return json({ success: false, error: "Prix non communiqué pour cet événement : contactez la conciergerie" }, 409);
    }

    const subtotal = Number(unitPrice) * quantity;
    const fee = conciergeFee(subtotal, config);
    const total = subtotal + fee;

    // Ligne services de l'événement (non publique) : bookings.service_id est
    // obligatoire. Réutilisée pour toutes les commandes du même événement.
    const location = [event.venue_name, event.city, event.country].filter(Boolean).join(", ") || "International";
    let serviceId: string | null = null;
    const { data: existing } = await admin
      .from("services")
      .select("id")
      .eq("type", "event")
      .eq("specifications->>eventId", event.id)
      .limit(1)
      .maybeSingle();
    if (existing) {
      serviceId = existing.id;
    } else {
      const { data: created, error: serviceError } = await admin
        .from("services")
        .insert({
          type: "event",
          name: event.name,
          description: `Billets achetés par la conciergerie Bossiz+ – ${location}`,
          location,
          price_per_unit: Number(event.price_min_xof ?? unitPrice),
          currency: "XOF",
          available: false,
          specifications: { eventId: event.id, slug: event.slug },
        })
        .select("id")
        .single();
      if (serviceError || !created) {
        console.error("Création du service événement:", serviceError?.message);
        return json({ success: false, error: "La commande n'a pas pu être créée. Réessayez." }, 500);
      }
      serviceId = created.id;
    }

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .insert({
        user_id: user.id,
        service_id: serviceId,
        status: "pending",
        payment_status: "pending",
        start_date: event.local_date,
        end_date: event.local_date,
        guests: quantity,
        total_price: total,
        currency: "XOF",
        payment_plan: "full",
        deposit_percent: 0,
        amount_due_now: total,
        amount_paid: 0,
        balance_due: 0,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        notes: notes || null,
        booking_details: {
          kind: "event_concierge",
          conciergeStatus: "awaiting_payment",
          eventId: event.id,
          eventSlug: event.slug,
          eventName: event.name,
          venue: event.venue_name,
          city: event.city,
          country: event.country,
          localDate: event.local_date,
          localTime: event.local_time,
          quantity,
          tier,
          unitPriceXof: Number(unitPrice),
          subtotalXof: subtotal,
          feeXof: fee,
          feePercent: config.feePercent,
          sourcePrice: event.price_min ? `${event.price_min} ${event.price_currency ?? ""}`.trim() : null,
          ticketUrl: event.ticket_url,
        },
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("Création de la commande:", bookingError?.message);
      return json({ success: false, error: "La commande n'a pas pu être créée. Réessayez." }, 500);
    }

    return json({ success: true, booking_id: booking.id, total_price: total, fee });
  } catch (error) {
    console.error("create-event-order error:", error instanceof Error ? error.message : error);
    return json({ success: false, error: "Erreur interne du serveur" }, 500);
  }
});
