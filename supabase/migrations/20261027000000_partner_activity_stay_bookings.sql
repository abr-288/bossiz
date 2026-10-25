-- Activités et séjours réservés en ligne : rattachés à leur partenaire.
--
-- create-booking crée désormais la ligne public.services d'une activité ou
-- d'un séjour du catalogue avec l'agency_id de la fiche : la part du
-- partenaire (commissions) et son versement suivent, comme pour un circuit.
-- Ici, ces réservations apparaissent aussi dans « Réservations /
-- Commandes » de l'espace partenaire (modules catalog_activities et
-- catalog_stays).
--
-- Les réservations passées ne sont pas modifiées : elles ne portent pas la
-- fiche réservée (booking_details.catalogRef n'existait pas).
--
-- Prérequis : 20261025000000 et 20261026000000. À exécuter dans le SQL
-- Editor ; sans effet sur le site actuel, peut précéder le déploiement de
-- create-booking.

CREATE OR REPLACE FUNCTION public.partner_orders_unmasked()
RETURNS TABLE (
  order_kind TEXT,
  order_id UUID,
  module TEXT,
  created_at TIMESTAMPTZ,
  service_date DATE,
  service_time TEXT,
  title TEXT,
  quantity INTEGER,
  amount NUMERIC,
  status TEXT,
  bucket TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  notes TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (SELECT public.current_partner_agency_id() AS agency_id),
  raw AS (
    SELECT
      'booking'::text AS order_kind,
      b.id AS order_id,
      CASE s.type WHEN 'hotel' THEN 'catalog_hotels' WHEN 'car' THEN 'catalog_cars'
        WHEN 'activity' THEN 'catalog_activities' WHEN 'stay' THEN 'catalog_stays' ELSE 'catalog_tours' END AS module,
      b.created_at,
      b.start_date::date AS service_date,
      NULL::text AS service_time,
      s.name AS title,
      b.guests AS quantity,
      b.total_price AS amount,
      b.status::text AS status,
      CASE
        WHEN b.status = 'pending' THEN 'new'
        WHEN b.status = 'confirmed' AND COALESCE(b.end_date, b.start_date)::date >= current_date
          THEN CASE WHEN b.created_at > now() - interval '48 hours' THEN 'new' ELSE 'in_progress' END
        ELSE 'history'
      END AS bucket,
      b.customer_name,
      b.customer_phone,
      b.customer_email,
      b.notes
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    JOIN me ON me.agency_id = s.agency_id
    WHERE s.type IN ('hotel', 'car', 'tour', 'activity', 'stay')
      -- Réservation en ligne non payée : pas encore une vraie demande.
      AND NOT (b.status = 'pending' AND b.payment_status::text IN ('pending', 'failed') AND COALESCE(b.amount_due_now, b.total_price, 0) > 0)
    UNION ALL
    SELECT
      'restaurant', rr.id, 'catalog_restaurants', rr.created_at, rr.reservation_date, rr.reservation_time::text,
      r.name, rr.party_size, r.average_ticket_price * rr.party_size, rr.status,
      CASE
        WHEN rr.status = 'confirmed' AND rr.reservation_date >= current_date
          THEN CASE WHEN rr.created_at > now() - interval '48 hours' THEN 'new' ELSE 'in_progress' END
        ELSE 'history'
      END,
      rr.customer_name, rr.customer_phone, rr.customer_email, rr.special_requests
    FROM public.restaurant_reservations rr
    JOIN public.restaurants r ON r.id = rr.restaurant_id
    JOIN me ON me.agency_id = r.agency_id
    UNION ALL
    SELECT
      'wellness', wb.id, 'catalog_wellness', wb.created_at, wb.booking_date, wb.booking_time::text,
      wb.treatment_name, wb.party_size, wb.treatment_price * wb.party_size, wb.status,
      CASE
        WHEN wb.status = 'confirmed' AND wb.booking_date >= current_date
          THEN CASE WHEN wb.created_at > now() - interval '48 hours' THEN 'new' ELSE 'in_progress' END
        ELSE 'history'
      END,
      wb.customer_name, wb.customer_phone, wb.customer_email, wb.special_requests
    FROM public.wellness_bookings wb
    JOIN public.wellness_services w ON w.id = wb.wellness_service_id
    JOIN me ON me.agency_id = w.agency_id
    UNION ALL
    SELECT
      'artisan', ao.id, 'catalog_artisans', ao.created_at, NULL::date, NULL::text,
      ao.product_name, ao.quantity, ao.total_amount, ao.status,
      CASE ao.status WHEN 'pending' THEN 'new' WHEN 'confirmed' THEN 'in_progress' ELSE 'history' END,
      ao.customer_name, ao.customer_phone, ao.customer_email, ao.message
    FROM public.artisan_orders ao
    JOIN public.artisans ar ON ar.id = ao.artisan_id
    JOIN me ON me.agency_id = ar.agency_id
  )
  SELECT raw.*
  FROM raw, me
  WHERE public.agency_module_in_scope(me.agency_id, raw.module);
$$;

REVOKE ALL ON FUNCTION public.partner_orders_unmasked() FROM PUBLIC, anon, authenticated;
