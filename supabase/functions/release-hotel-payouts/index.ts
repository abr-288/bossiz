import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { scheduleAgencyPayout } from "../_shared/agencyPayouts.ts";
import { rejectIfNotCron } from "../_shared/cronAuth.ts";

// ============================================================
// EDGE FUNCTION: release-hotel-payouts
// Appelée chaque heure par pg_cron (migration 20261018010000).
// La part partenaire d'un séjour d'hôtel payé en ligne n'est pas versée au
// paiement mais 24 h après la date d'arrivée (le client peut annuler avant).
// Libère les parts encore « not_scheduled » de ces réservations ; un appel
// en double ne verse rien de plus (scheduleAgencyPayout ne traite qu'une
// part « not_scheduled »).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const denied = rejectIfNotCron(req, corsHeaders);
  if (denied) return denied;

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ success: false, error: "Configuration serveur incomplète" }, 500);
  const supabase = createClient(supabaseUrl, serviceKey);

  // Arrivée au plus tard hier (24 h écoulées depuis le jour d'arrivée).
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: due, error } = await supabase
    .from("commissions")
    .select("booking_id, bookings!inner(start_date, booking_details)")
    .eq("status", "pending")
    .eq("payout_status", "not_scheduled")
    .lte("bookings.start_date", yesterday)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE * 4);

  if (error) {
    console.error("Lecture des parts hôtel à verser:", error.message);
    return json({ success: false, error: "Lecture impossible" }, 500);
  }

  // Part hôtel due, avec la réservation liée (booking_details.kind).
  type DueRow = { booking_id: string; bookings?: { booking_details?: { kind?: string } | null } | null };
  const hotelRows = ((due ?? []) as DueRow[]).filter((row) => row.bookings?.booking_details?.kind === "partner_hotel").slice(0, BATCH_SIZE);
  let released = 0;
  for (const row of hotelRows) {
    await scheduleAgencyPayout({
      supabase,
      supabaseUrl,
      supabaseServiceKey: serviceKey,
      bookingId: row.booking_id,
      releaseHotel: true,
    });
    released++;
  }

  return json({ success: true, checked: hotelRows.length, released });
});
