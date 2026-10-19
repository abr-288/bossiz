import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// EDGE FUNCTION: create-hotel-booking
// Réservation de logements d'un hôtel partenaire (HotelDetail.tsx).
// Le client n'envoie que des identifiants de tarifs et des quantités :
// prix, stock et options sont relus en base par
// create_partner_hotel_booking() (migration 20261018000000), qui crée la
// réservation de façon atomique. Paiement sur place : la réservation est
// confirmée et les emails partent tout de suite ; sinon le client est
// envoyé au paiement et les emails partent après (postPaymentSuccess).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Connectez-vous pour réserver" }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ success: false, error: "Connectez-vous pour réserver" }, 401);

    const body = await req.json().catch(() => ({}));
    const serviceId = String(body.service_id ?? "");
    const checkIn = String(body.check_in ?? "");
    const checkOut = String(body.check_out ?? "");
    const guests = Number(body.guests);
    const customerName = String(body.customer_name ?? "").trim().slice(0, 120);
    const customerEmail = String(body.customer_email ?? "").trim().toLowerCase().slice(0, 254);
    const customerPhone = String(body.customer_phone ?? "").trim().slice(0, 40);
    const notes = String(body.notes ?? "").trim().slice(0, 1000);
    const items = Array.isArray(body.items) ? body.items : [];

    if (!UUID_RE.test(serviceId) || !DATE_RE.test(checkIn) || !DATE_RE.test(checkOut)) {
      return json({ success: false, error: "Requête invalide" }, 400);
    }
    if (!Number.isInteger(guests) || guests < 1) {
      return json({ success: false, error: "Nombre de voyageurs invalide" }, 400);
    }
    if (!customerName || !EMAIL_RE.test(customerEmail) || customerPhone.length < 6) {
      return json({ success: false, error: "Renseignez votre nom, votre email et votre téléphone" }, 400);
    }
    const cleanItems = items
      .map((item: { rate_id?: unknown; quantity?: unknown }) => ({
        rate_id: String(item?.rate_id ?? ""),
        quantity: Number(item?.quantity),
      }))
      .filter((item: { rate_id: string; quantity: number }) => UUID_RE.test(item.rate_id) && Number.isInteger(item.quantity) && item.quantity > 0);
    if (cleanItems.length === 0 || cleanItems.length !== items.length) {
      return json({ success: false, error: "Sélectionnez au moins un logement" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin.rpc("create_partner_hotel_booking", {
      p_user_id: user.id,
      p_service_id: serviceId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guests: guests,
      p_items: cleanItems,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_customer_phone: customerPhone,
      p_notes: notes,
    });

    if (error || !data?.booking_id) {
      // Les erreurs métier (stock, dates, tarif retiré) sont écrites pour le client.
      const businessError = error && ["22023", "23514", "P0002"].includes(error.code ?? "");
      console.error("create_partner_hotel_booking:", error?.code, error?.message);
      return json(
        { success: false, error: businessError ? error!.message : "La réservation n'a pas pu être créée. Réessayez." },
        businessError ? 409 : 500,
      );
    }

    if (data.pay_at_property) {
      // Attendu (et non détaché) : l'instance peut s'arrêter dès la réponse.
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-hotel-booking-emails`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({ bookingId: data.booking_id }),
        });
        if (!res.ok) console.error("Emails de réservation non envoyés:", res.status);
      } catch (emailError) {
        console.error("Emails de réservation non envoyés:", emailError instanceof Error ? emailError.message : emailError);
      }
    }

    return json({
      success: true,
      booking_id: data.booking_id,
      pay_at_property: data.pay_at_property === true,
      total_price: data.total_price,
    });
  } catch (error) {
    console.error("create-hotel-booking error:", error instanceof Error ? error.message : error);
    return json({ success: false, error: "Erreur interne du serveur" }, 500);
  }
});
