-- Hôtels partenaires : règles du contrat de partenariat hébergement
-- (annulation, non-présentation, commission sur paiement sur place).
--
-- - hotel_rates.late_cancellation_fee_percent : frais d'annulation tardive
--   (après le délai d'annulation gratuite), 20 % par défaut ; un tarif non
--   remboursable coûte 100 %, une non-présentation aussi.
-- - create_partner_hotel_booking() : fige ces frais dans la réservation.
-- - agency_mark_hotel_no_show() : l'hôtel déclare une non-présentation
--   dans les 48 h suivant la date d'arrivée.
-- - hotel_onsite_commission_invoices : facture mensuelle de 10 % sur les
--   séjours payés sur place (départ dans le mois, hors annulations et
--   non-présentations), émise et suivie depuis /admin/hotel-commissions.
-- - Tâche horaire release-hotel-payouts : la part du partenaire sur un
--   séjour payé en ligne est versée 24 h après la date d'arrivée.
--
-- À exécuter dans le SQL Editor.

ALTER TABLE public.hotel_rates
  ADD COLUMN IF NOT EXISTS late_cancellation_fee_percent INTEGER NOT NULL DEFAULT 20
    CHECK (late_cancellation_fee_percent BETWEEN 0 AND 100);

-- Même fonction que 20261018000000, avec les frais d'annulation tardive et
-- un délai d'annulation gratuite d'au moins 1 jour.
CREATE OR REPLACE FUNCTION public.create_partner_hotel_booking(
  p_user_id UUID,
  p_service_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_guests INTEGER,
  p_items JSONB,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nights INTEGER := p_check_out - p_check_in;
  v_service public.services%ROWTYPE;
  v_requested INTEGER;
  v_matched INTEGER;
  v_total NUMERIC(12,2) := 0;
  v_units INTEGER := 0;
  v_pay_at_property BOOLEAN := true;
  v_lines JSONB := '[]'::jsonb;
  v_booking_id UUID;
  v_shortage RECORD;
  v_line RECORD;
BEGIN
  IF p_check_in < current_date THEN
    RAISE EXCEPTION 'La date d''arrivée est passée' USING ERRCODE = '22023';
  END IF;
  IF v_nights < 1 OR v_nights > 60 THEN
    RAISE EXCEPTION 'Le séjour doit compter entre 1 et 60 nuits' USING ERRCODE = '22023';
  END IF;
  IF p_guests < 1 OR p_guests > 100 THEN
    RAISE EXCEPTION 'Nombre de voyageurs invalide' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 20 THEN
    RAISE EXCEPTION 'Sélectionnez au moins un logement' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_items) e
    WHERE (e->>'quantity') IS NULL OR (e->>'quantity')::int NOT BETWEEN 1 AND 10
  ) THEN
    RAISE EXCEPTION 'Quantité invalide' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_service
  FROM public.services
  WHERE id = p_service_id AND type = 'hotel' AND available = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cet hôtel n''est plus disponible' USING ERRCODE = 'P0002';
  END IF;

  -- Sérialise les réservations d'un même hôtel jusqu'à la fin de la transaction.
  PERFORM 1 FROM public.hotel_room_types WHERE service_id = p_service_id FOR UPDATE;

  CREATE TEMP TABLE _hotel_lines ON COMMIT DROP AS
  SELECT
    r.id AS rate_id,
    rt.id AS room_type_id,
    rt.name AS room_name,
    q.quantity,
    r.occupancy,
    r.price_per_night,
    r.breakfast_included,
    r.free_cancellation,
    GREATEST(r.free_cancellation_days, 1) AS free_cancellation_days,
    r.late_cancellation_fee_percent,
    r.pay_at_property
  FROM (
    SELECT (e->>'rate_id')::uuid AS rate_id, sum((e->>'quantity')::int)::int AS quantity
    FROM jsonb_array_elements(p_items) e
    GROUP BY 1
  ) q
  JOIN public.hotel_rates r ON r.id = q.rate_id AND r.is_active
  JOIN public.hotel_room_types rt ON rt.id = r.room_type_id AND rt.is_active AND rt.service_id = p_service_id;

  SELECT count(DISTINCT (e->>'rate_id')) INTO v_requested FROM jsonb_array_elements(p_items) e;
  SELECT count(*) INTO v_matched FROM _hotel_lines;
  IF v_matched <> v_requested THEN
    RAISE EXCEPTION 'Un des tarifs choisis n''est plus proposé. Actualisez la page.' USING ERRCODE = 'P0002';
  END IF;

  SELECT l.room_name, sum(l.quantity) AS wanted, coalesce(a.available_units, 0) AS free
  INTO v_shortage
  FROM _hotel_lines l
  LEFT JOIN public.hotel_room_availability(p_service_id, p_check_in, p_check_out) a ON a.room_type_id = l.room_type_id
  GROUP BY l.room_type_id, l.room_name, a.available_units
  HAVING sum(l.quantity) > coalesce(a.available_units, 0)
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Plus que % « % » disponible(s) sur ces dates', v_shortage.free, v_shortage.room_name
      USING ERRCODE = '23514';
  END IF;

  SELECT
    sum(l.quantity * l.price_per_night * v_nights),
    sum(l.quantity),
    bool_and(l.pay_at_property),
    jsonb_agg(jsonb_build_object(
      'roomTypeId', l.room_type_id,
      'rateId', l.rate_id,
      'room', l.room_name,
      'quantity', l.quantity,
      'occupancy', l.occupancy,
      'pricePerNight', l.price_per_night,
      'breakfastIncluded', l.breakfast_included,
      'freeCancellation', l.free_cancellation,
      'freeCancellationDays', l.free_cancellation_days,
      'lateCancellationFeePercent', l.late_cancellation_fee_percent,
      'payAtProperty', l.pay_at_property
    ) ORDER BY l.room_name)
  INTO v_total, v_units, v_pay_at_property, v_lines
  FROM _hotel_lines l;

  INSERT INTO public.bookings (
    user_id, service_id, status, payment_status, start_date, end_date, guests,
    total_price, currency, payment_plan, deposit_percent, amount_due_now, amount_paid, balance_due,
    supplier_cost, supplier_cost_currency,
    customer_name, customer_email, customer_phone, notes, booking_details
  )
  VALUES (
    p_user_id, p_service_id,
    CASE WHEN v_pay_at_property THEN 'confirmed' ELSE 'pending' END,
    'pending', p_check_in, p_check_out, p_guests,
    v_total, 'XOF', 'full', 0,
    CASE WHEN v_pay_at_property THEN 0 ELSE v_total END,
    0,
    CASE WHEN v_pay_at_property THEN v_total ELSE 0 END,
    round(v_total * 0.9), 'XOF',
    p_customer_name, p_customer_email, p_customer_phone, nullif(btrim(p_notes), ''),
    jsonb_build_object(
      'kind', 'partner_hotel',
      'hotelName', v_service.name,
      'location', v_service.location,
      'nights', v_nights,
      'rooms', v_units,
      'adults', p_guests,
      'payAtProperty', v_pay_at_property,
      'items', v_lines
    )
  )
  RETURNING id INTO v_booking_id;

  FOR v_line IN SELECT * FROM _hotel_lines LOOP
    INSERT INTO public.hotel_booking_rooms (
      booking_id, room_type_id, rate_id, quantity, check_in, check_out, occupancy, price_per_night, rate_snapshot
    )
    VALUES (
      v_booking_id, v_line.room_type_id, v_line.rate_id, v_line.quantity, p_check_in, p_check_out,
      v_line.occupancy, v_line.price_per_night,
      jsonb_build_object(
        'room', v_line.room_name,
        'breakfastIncluded', v_line.breakfast_included,
        'freeCancellation', v_line.free_cancellation,
        'freeCancellationDays', v_line.free_cancellation_days,
        'lateCancellationFeePercent', v_line.late_cancellation_fee_percent,
        'payAtProperty', v_line.pay_at_property
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'booking_id', v_booking_id,
    'pay_at_property', v_pay_at_property,
    'total_price', v_total,
    'nights', v_nights
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_partner_hotel_booking(UUID, UUID, DATE, DATE, INTEGER, JSONB, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_partner_hotel_booking(UUID, UUID, DATE, DATE, INTEGER, JSONB, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Réservations vues par l'hôtel : ajoute non-présentation et annulation.
DROP FUNCTION IF EXISTS public.agency_hotel_bookings();
CREATE FUNCTION public.agency_hotel_bookings()
RETURNS TABLE (
  booking_id UUID,
  created_at TIMESTAMPTZ,
  hotel_name TEXT,
  status TEXT,
  payment_status TEXT,
  check_in DATE,
  check_out DATE,
  guests INTEGER,
  total_price NUMERIC,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  notes TEXT,
  pay_at_property BOOLEAN,
  no_show BOOLEAN,
  cancellation JSONB,
  rooms JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id, b.created_at, s.name, b.status::text, b.payment_status::text,
    b.start_date, b.end_date, b.guests, b.total_price,
    b.customer_name, b.customer_email, b.customer_phone, b.notes,
    COALESCE((b.booking_details->>'payAtProperty')::boolean, false),
    COALESCE((b.booking_details->>'noShow')::boolean, false),
    b.booking_details->'cancellation',
    (
      SELECT jsonb_agg(jsonb_build_object(
        'room', rt.name,
        'quantity', hbr.quantity,
        'occupancy', hbr.occupancy,
        'pricePerNight', hbr.price_per_night,
        'options', hbr.rate_snapshot
      ) ORDER BY rt.name)
      FROM public.hotel_booking_rooms hbr
      JOIN public.hotel_room_types rt ON rt.id = hbr.room_type_id
      WHERE hbr.booking_id = b.id
    )
  FROM public.bookings b
  JOIN public.services s ON s.id = b.service_id
  WHERE s.type = 'hotel'
    AND public.has_role(auth.uid(), 'sub_agency')
    AND public.is_agency_owner(auth.uid(), s.agency_id)
    AND EXISTS (SELECT 1 FROM public.hotel_booking_rooms x WHERE x.booking_id = b.id)
    AND (
      b.status IN ('confirmed', 'completed')
      OR b.payment_status IN ('paid', 'partially_paid', 'refunded')
      -- Annulation d'une réservation à payer sur place : l'hôtel doit la voir.
      OR b.booking_details ? 'cancellation'
    )
  ORDER BY b.start_date DESC, b.created_at DESC
  LIMIT 500;
$$;

GRANT EXECUTE ON FUNCTION public.agency_hotel_bookings() TO authenticated;

-- Non-présentation déclarée par l'hôtel (contrat, art. 7.4) : du jour
-- d'arrivée à J+2, sur une réservation confirmée de son établissement.
CREATE OR REPLACE FUNCTION public.agency_mark_hotel_no_show(p_booking_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT b.id, b.status, b.start_date, b.booking_details, s.agency_id
  INTO v_booking
  FROM public.bookings b
  JOIN public.services s ON s.id = b.service_id
  WHERE b.id = p_booking_id
  FOR UPDATE OF b;

  IF NOT FOUND
     OR NOT public.has_role(auth.uid(), 'sub_agency')
     OR NOT public.is_agency_owner(auth.uid(), v_booking.agency_id)
     OR v_booking.booking_details->>'kind' IS DISTINCT FROM 'partner_hotel' THEN
    RAISE EXCEPTION 'Réservation introuvable' USING ERRCODE = '42501';
  END IF;
  IF v_booking.status NOT IN ('confirmed', 'completed') THEN
    RAISE EXCEPTION 'Seule une réservation confirmée peut être déclarée non présentée' USING ERRCODE = '22023';
  END IF;
  IF current_date < v_booking.start_date OR current_date > v_booking.start_date + 2 THEN
    RAISE EXCEPTION 'La non-présentation se déclare entre le jour d''arrivée et 48 h après' USING ERRCODE = '22023';
  END IF;

  UPDATE public.bookings
  SET booking_details = booking_details || jsonb_build_object('noShow', true, 'noShowAt', now()),
      updated_at = now()
  WHERE id = p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.agency_mark_hotel_no_show(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_mark_hotel_no_show(UUID) TO authenticated;

-- Séjours payés sur place facturables pour un mois (contrat, art. 6.3).
CREATE OR REPLACE FUNCTION public.hotel_onsite_billable_bookings(p_period DATE)
RETURNS TABLE (booking_id UUID, agency_id UUID, total_price NUMERIC, check_in DATE, check_out DATE, customer_name TEXT, hotel_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, s.agency_id, b.total_price, b.start_date, b.end_date, b.customer_name, s.name
  FROM public.bookings b
  JOIN public.services s ON s.id = b.service_id
  WHERE b.booking_details->>'kind' = 'partner_hotel'
    AND COALESCE((b.booking_details->>'payAtProperty')::boolean, false)
    AND NOT COALESCE((b.booking_details->>'noShow')::boolean, false)
    AND b.status IN ('confirmed', 'completed')
    AND b.payment_status::text <> 'refunded'
    AND s.agency_id IS NOT NULL
    AND b.end_date >= date_trunc('month', p_period)::date
    AND b.end_date < (date_trunc('month', p_period) + interval '1 month')::date;
$$;

REVOKE ALL ON FUNCTION public.hotel_onsite_billable_bookings(DATE) FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.hotel_onsite_commission_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  period DATE NOT NULL CHECK (period = date_trunc('month', period)::date),
  stays_count INTEGER NOT NULL CHECK (stays_count > 0),
  stays_amount NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10,
  commission_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  booking_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'cancelled')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  issued_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Une facture active par hôtel et par mois (une facture annulée peut être réémise).
CREATE UNIQUE INDEX IF NOT EXISTS hotel_onsite_invoices_active_period_idx
  ON public.hotel_onsite_commission_invoices (agency_id, period)
  WHERE status <> 'cancelled';

DROP TRIGGER IF EXISTS set_updated_at_hotel_onsite_invoices ON public.hotel_onsite_commission_invoices;
CREATE TRIGGER set_updated_at_hotel_onsite_invoices
  BEFORE UPDATE ON public.hotel_onsite_commission_invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.hotel_onsite_commission_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view onsite commission invoices" ON public.hotel_onsite_commission_invoices;
CREATE POLICY "Admins view onsite commission invoices" ON public.hotel_onsite_commission_invoices
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Agencies view their onsite commission invoices" ON public.hotel_onsite_commission_invoices;
CREATE POLICY "Agencies view their onsite commission invoices" ON public.hotel_onsite_commission_invoices
  FOR SELECT USING (public.is_agency_owner(auth.uid(), agency_id));

-- Récapitulatif admin d'un mois : un hôtel par ligne, avec sa facture s'il y en a une.
CREATE OR REPLACE FUNCTION public.admin_hotel_onsite_commissions(p_period DATE)
RETURNS TABLE (
  agency_id UUID,
  agency_name TEXT,
  stays_count INTEGER,
  stays_amount NUMERIC,
  commission_amount NUMERIC,
  bookings JSONB,
  invoice_id UUID,
  invoice_status TEXT,
  invoice_due_at DATE,
  invoiced_amount NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH billable AS (
    SELECT * FROM public.hotel_onsite_billable_bookings(p_period)
  ),
  per_agency AS (
    SELECT
      bb.agency_id,
      count(*)::int AS stays_count,
      sum(bb.total_price) AS stays_amount,
      jsonb_agg(jsonb_build_object(
        'bookingId', bb.booking_id, 'hotel', bb.hotel_name, 'customer', bb.customer_name,
        'checkIn', bb.check_in, 'checkOut', bb.check_out, 'total', bb.total_price
      ) ORDER BY bb.check_out) AS bookings
    FROM billable bb
    GROUP BY bb.agency_id
  ),
  invoices AS (
    SELECT DISTINCT ON (i.agency_id) i.*
    FROM public.hotel_onsite_commission_invoices i
    WHERE i.period = date_trunc('month', p_period)::date AND i.status <> 'cancelled'
    ORDER BY i.agency_id, i.created_at DESC
  )
  SELECT
    a.id, a.name,
    COALESCE(pa.stays_count, 0), COALESCE(pa.stays_amount, 0),
    round(COALESCE(pa.stays_amount, 0) * 0.10),
    COALESCE(pa.bookings, '[]'::jsonb),
    inv.id, inv.status, inv.due_at, inv.commission_amount
  FROM public.agencies a
  LEFT JOIN per_agency pa ON pa.agency_id = a.id
  LEFT JOIN invoices inv ON inv.agency_id = a.id
  WHERE pa.agency_id IS NOT NULL OR inv.id IS NOT NULL
  ORDER BY a.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_hotel_onsite_commissions(DATE) TO authenticated;

-- Émet la facture du mois pour un hôtel : fige la liste des séjours et le
-- montant, échéance à 15 jours.
CREATE OR REPLACE FUNCTION public.admin_issue_hotel_onsite_invoice(p_agency_id UUID, p_period DATE)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period DATE := date_trunc('month', p_period)::date;
  v_count INTEGER;
  v_amount NUMERIC(12,2);
  v_ids UUID[];
  v_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
  IF v_period >= date_trunc('month', current_date)::date THEN
    RAISE EXCEPTION 'Le mois doit être terminé avant de facturer' USING ERRCODE = '22023';
  END IF;

  SELECT count(*), sum(total_price), array_agg(booking_id)
  INTO v_count, v_amount, v_ids
  FROM public.hotel_onsite_billable_bookings(v_period)
  WHERE agency_id = p_agency_id;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Aucun séjour payé sur place à facturer ce mois-ci' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.hotel_onsite_commission_invoices (
    agency_id, period, stays_count, stays_amount, commission_rate, commission_amount,
    booking_ids, due_at, issued_by
  )
  VALUES (
    p_agency_id, v_period, v_count, v_amount, 10, round(v_amount * 0.10),
    v_ids, current_date + 15, auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Une facture existe déjà pour cet hôtel et ce mois' USING ERRCODE = '23505';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_issue_hotel_onsite_invoice(UUID, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_hotel_onsite_invoice_status(p_invoice_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('issued', 'paid', 'cancelled') THEN
    RAISE EXCEPTION 'Statut invalide' USING ERRCODE = '22023';
  END IF;

  UPDATE public.hotel_onsite_commission_invoices
  SET status = p_status,
      paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE NULL END
  WHERE id = p_invoice_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_hotel_onsite_invoice_status(UUID, TEXT) TO authenticated;

-- Versement des parts partenaires des séjours payés en ligne, 24 h après
-- la date d'arrivée (voir _shared/agencyPayouts.ts). Mêmes secrets Vault que
-- 20261015000002_subscription_renewal_reminders.sql.
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id FROM cron.job WHERE jobname = 'release-hotel-payouts';
  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'release-hotel-payouts',
    '10 * * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/release-hotel-payouts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
        ),
        body := '{}'::jsonb
      );
    $job$
  );
END;
$$;
