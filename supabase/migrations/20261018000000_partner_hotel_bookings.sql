-- Hôtels partenaires, étape 2 : réservation de plusieurs logements.
--
-- - create_partner_hotel_booking() : appelée par la fonction
--   create-hotel-booking (clé service-role uniquement). Recalcule le prix
--   depuis hotel_rates, verrouille les types de chambre de l'hôtel pour que
--   deux clients ne prennent pas la dernière unité en même temps, vérifie le
--   stock, puis crée la réservation et ses lignes hotel_booking_rooms.
--   Si tous les tarifs choisis sont « paiement sur place », la réservation
--   est confirmée sans paiement en ligne ; sinon elle attend le paiement.
-- - agency_hotel_bookings() : réservations confirmées ou payées des hôtels
--   du partenaire connecté, avec le détail des logements.
--
-- À exécuter dans le SQL Editor.

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
    r.free_cancellation_days,
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
    -- Paiement sur place : confirmée tout de suite, réglée à l'hôtel.
    CASE WHEN v_pay_at_property THEN 'confirmed' ELSE 'pending' END,
    'pending', p_check_in, p_check_out, p_guests,
    v_total, 'XOF', 'full', 0,
    CASE WHEN v_pay_at_property THEN 0 ELSE v_total END,
    0,
    CASE WHEN v_pay_at_property THEN v_total ELSE 0 END,
    -- Part reversée au partenaire (90 %, comme postPaymentSuccess).
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

CREATE OR REPLACE FUNCTION public.agency_hotel_bookings()
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
    -- Les paniers abandonnés (en attente ou annulés sans paiement) ne
    -- concernent pas l'hôtel ; une réservation payée puis annulée, si.
    AND (b.status IN ('confirmed', 'completed') OR b.payment_status IN ('paid', 'partially_paid', 'refunded'))
  ORDER BY b.start_date DESC, b.created_at DESC
  LIMIT 500;
$$;

GRANT EXECUTE ON FUNCTION public.agency_hotel_bookings() TO authenticated;
