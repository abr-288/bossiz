-- Hôtels partenaires façon Booking : types de chambre/appartement, tarifs et
-- stock.
--
-- Un hôtel reste une ligne de public.services (type 'hotel') :
-- description, images (galerie), amenities (équipements, tableau de
-- libellés) et specifications ({stars, highlights[], checkInFrom,
-- checkOutUntil, houseRules}). price_per_unit devient le prix « à partir de »,
-- tenu à jour depuis les tarifs (trigger sync_hotel_starting_price).
--
-- - hotel_room_types : un type de chambre/appartement, avec son nombre
--   d'unités (stock) ;
-- - hotel_rates : les tarifs d'un type (nombre de voyageurs, prix par nuit,
--   petit-déjeuner, annulation gratuite, paiement sur place) ;
-- - hotel_booking_rooms : les unités réservées par réservation et par nuit,
--   écrites par le serveur uniquement (fonction de réservation, étape 2) ;
-- - hotel_room_availability() : unités encore libres par type sur un séjour.
--
-- À exécuter dans le SQL Editor.

CREATE TABLE IF NOT EXISTS public.hotel_room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  description TEXT,
  bed_info TEXT,
  size_m2 INTEGER CHECK (size_m2 IS NULL OR size_m2 BETWEEN 1 AND 2000),
  max_guests INTEGER NOT NULL DEFAULT 2 CHECK (max_guests BETWEEN 1 AND 30),
  total_units INTEGER NOT NULL DEFAULT 1 CHECK (total_units BETWEEN 1 AND 500),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hotel_room_types_service_idx ON public.hotel_room_types (service_id);

CREATE TABLE IF NOT EXISTS public.hotel_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES public.hotel_room_types(id) ON DELETE CASCADE,
  occupancy INTEGER NOT NULL CHECK (occupancy BETWEEN 1 AND 30),
  price_per_night NUMERIC(12,2) NOT NULL CHECK (price_per_night > 0),
  breakfast_included BOOLEAN NOT NULL DEFAULT false,
  free_cancellation BOOLEAN NOT NULL DEFAULT false,
  -- Annulation gratuite jusqu'à N jours avant l'arrivée.
  free_cancellation_days INTEGER NOT NULL DEFAULT 1 CHECK (free_cancellation_days BETWEEN 0 AND 60),
  pay_at_property BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hotel_rates_room_type_idx ON public.hotel_rates (room_type_id);

CREATE TABLE IF NOT EXISTS public.hotel_booking_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  -- RESTRICT : un type déjà réservé se désactive, il ne se supprime pas.
  room_type_id UUID NOT NULL REFERENCES public.hotel_room_types(id) ON DELETE RESTRICT,
  rate_id UUID REFERENCES public.hotel_rates(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 50),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  occupancy INTEGER NOT NULL CHECK (occupancy BETWEEN 1 AND 30),
  price_per_night NUMERIC(12,2) NOT NULL CHECK (price_per_night > 0),
  -- Options figées au moment de la réservation (petit-déjeuner, annulation...).
  rate_snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS hotel_booking_rooms_room_type_dates_idx
  ON public.hotel_booking_rooms (room_type_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS hotel_booking_rooms_booking_idx ON public.hotel_booking_rooms (booking_id);

DROP TRIGGER IF EXISTS set_updated_at_hotel_room_types ON public.hotel_room_types;
CREATE TRIGGER set_updated_at_hotel_room_types
  BEFORE UPDATE ON public.hotel_room_types
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_hotel_rates ON public.hotel_rates;
CREATE TRIGGER set_updated_at_hotel_rates
  BEFORE UPDATE ON public.hotel_rates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Un tarif ne peut pas prévoir plus de voyageurs que la capacité du type.
CREATE OR REPLACE FUNCTION public.enforce_hotel_rate_occupancy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  capacity INTEGER;
BEGIN
  SELECT max_guests INTO capacity FROM public.hotel_room_types WHERE id = NEW.room_type_id;
  IF capacity IS NOT NULL AND NEW.occupancy > capacity THEN
    RAISE EXCEPTION 'Le tarif prévoit % voyageurs mais ce type accueille % voyageurs au maximum', NEW.occupancy, capacity
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_hotel_rate_occupancy_trigger ON public.hotel_rates;
CREATE TRIGGER enforce_hotel_rate_occupancy_trigger
  BEFORE INSERT OR UPDATE OF occupancy, room_type_id ON public.hotel_rates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_hotel_rate_occupancy();

-- Prix « à partir de » de l'hôtel (services.price_per_unit, lu par la
-- recherche et les cartes) = plus petit tarif actif d'un type actif.
CREATE OR REPLACE FUNCTION public.refresh_hotel_starting_price(_service_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.services AS s
  SET price_per_unit = COALESCE((
    SELECT min(r.price_per_night)
    FROM public.hotel_rates r
    JOIN public.hotel_room_types rt ON rt.id = r.room_type_id
    WHERE rt.service_id = _service_id AND rt.is_active AND r.is_active
  ), 0)
  WHERE s.id = _service_id AND s.type = 'hotel';
$$;

CREATE OR REPLACE FUNCTION public.sync_hotel_starting_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_service UUID;
BEGIN
  IF TG_TABLE_NAME = 'hotel_room_types' THEN
    target_service := COALESCE(NEW.service_id, OLD.service_id);
  ELSE
    SELECT service_id INTO target_service
    FROM public.hotel_room_types
    WHERE id = COALESCE(NEW.room_type_id, OLD.room_type_id);
  END IF;

  IF target_service IS NOT NULL THEN
    PERFORM public.refresh_hotel_starting_price(target_service);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_hotel_starting_price_rates ON public.hotel_rates;
CREATE TRIGGER sync_hotel_starting_price_rates
  AFTER INSERT OR UPDATE OR DELETE ON public.hotel_rates
  FOR EACH ROW EXECUTE FUNCTION public.sync_hotel_starting_price();

DROP TRIGGER IF EXISTS sync_hotel_starting_price_room_types ON public.hotel_room_types;
CREATE TRIGGER sync_hotel_starting_price_room_types
  AFTER UPDATE OF is_active OR DELETE ON public.hotel_room_types
  FOR EACH ROW EXECUTE FUNCTION public.sync_hotel_starting_price();

-- Propriétaire (sous-agence) de l'hôtel. _require_enabled : écriture
-- possible seulement si le module « services » de l'agence est actif, comme
-- les policies de services (20261004000000).
CREATE OR REPLACE FUNCTION public.owns_hotel_service(_service_id UUID, _require_enabled BOOLEAN)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.services s
    WHERE s.id = _service_id
      AND s.type = 'hotel'
      AND public.has_role(auth.uid(), 'sub_agency')
      AND public.is_agency_owner(auth.uid(), s.agency_id)
      AND (NOT _require_enabled OR public.agency_feature_enabled(s.agency_id, 'services'))
  );
$$;

GRANT EXECUTE ON FUNCTION public.owns_hotel_service(UUID, BOOLEAN) TO authenticated;

ALTER TABLE public.hotel_room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_booking_rooms ENABLE ROW LEVEL SECURITY;

-- Types de chambre
DROP POLICY IF EXISTS "Public can view active room types" ON public.hotel_room_types;
CREATE POLICY "Public can view active room types" ON public.hotel_room_types
  FOR SELECT USING (
    is_active AND EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.available = true)
  );
DROP POLICY IF EXISTS "Owners can view their room types" ON public.hotel_room_types;
CREATE POLICY "Owners can view their room types" ON public.hotel_room_types
  FOR SELECT USING (public.owns_hotel_service(service_id, false));
DROP POLICY IF EXISTS "Owners can insert room types" ON public.hotel_room_types;
CREATE POLICY "Owners can insert room types" ON public.hotel_room_types
  FOR INSERT WITH CHECK (public.owns_hotel_service(service_id, true));
DROP POLICY IF EXISTS "Owners can update room types" ON public.hotel_room_types;
CREATE POLICY "Owners can update room types" ON public.hotel_room_types
  FOR UPDATE USING (public.owns_hotel_service(service_id, true))
  WITH CHECK (public.owns_hotel_service(service_id, true));
DROP POLICY IF EXISTS "Owners can delete room types" ON public.hotel_room_types;
CREATE POLICY "Owners can delete room types" ON public.hotel_room_types
  FOR DELETE USING (public.owns_hotel_service(service_id, true));
DROP POLICY IF EXISTS "Admins manage room types" ON public.hotel_room_types;
CREATE POLICY "Admins manage room types" ON public.hotel_room_types
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tarifs
DROP POLICY IF EXISTS "Public can view active rates" ON public.hotel_rates;
CREATE POLICY "Public can view active rates" ON public.hotel_rates
  FOR SELECT USING (
    is_active AND EXISTS (
      SELECT 1
      FROM public.hotel_room_types rt
      JOIN public.services s ON s.id = rt.service_id
      WHERE rt.id = room_type_id AND rt.is_active AND s.available = true
    )
  );
DROP POLICY IF EXISTS "Owners can view their rates" ON public.hotel_rates;
CREATE POLICY "Owners can view their rates" ON public.hotel_rates
  FOR SELECT USING (
    public.owns_hotel_service((SELECT rt.service_id FROM public.hotel_room_types rt WHERE rt.id = room_type_id), false)
  );
DROP POLICY IF EXISTS "Owners can insert rates" ON public.hotel_rates;
CREATE POLICY "Owners can insert rates" ON public.hotel_rates
  FOR INSERT WITH CHECK (
    public.owns_hotel_service((SELECT rt.service_id FROM public.hotel_room_types rt WHERE rt.id = room_type_id), true)
  );
DROP POLICY IF EXISTS "Owners can update rates" ON public.hotel_rates;
CREATE POLICY "Owners can update rates" ON public.hotel_rates
  FOR UPDATE USING (
    public.owns_hotel_service((SELECT rt.service_id FROM public.hotel_room_types rt WHERE rt.id = room_type_id), true)
  )
  WITH CHECK (
    public.owns_hotel_service((SELECT rt.service_id FROM public.hotel_room_types rt WHERE rt.id = room_type_id), true)
  );
DROP POLICY IF EXISTS "Owners can delete rates" ON public.hotel_rates;
CREATE POLICY "Owners can delete rates" ON public.hotel_rates
  FOR DELETE USING (
    public.owns_hotel_service((SELECT rt.service_id FROM public.hotel_room_types rt WHERE rt.id = room_type_id), true)
  );
DROP POLICY IF EXISTS "Admins manage rates" ON public.hotel_rates;
CREATE POLICY "Admins manage rates" ON public.hotel_rates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Chambres réservées : lecture seule (client, partenaire, admin) ; écriture
-- par le serveur (service role) uniquement.
DROP POLICY IF EXISTS "Customers can view their booked rooms" ON public.hotel_booking_rooms;
CREATE POLICY "Customers can view their booked rooms" ON public.hotel_booking_rooms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Owners can view rooms booked at their hotel" ON public.hotel_booking_rooms;
CREATE POLICY "Owners can view rooms booked at their hotel" ON public.hotel_booking_rooms
  FOR SELECT USING (
    public.owns_hotel_service((SELECT rt.service_id FROM public.hotel_room_types rt WHERE rt.id = room_type_id), false)
  );
DROP POLICY IF EXISTS "Admins can view booked rooms" ON public.hotel_booking_rooms;
CREATE POLICY "Admins can view booked rooms" ON public.hotel_booking_rooms
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Unités libres par type sur [p_check_in, p_check_out[ : stock du type moins
-- la nuit la plus chargée du séjour. Comptent les réservations confirmées,
-- payées (ou en cours de paiement), à payer sur place, et les réservations
-- en attente de moins de 30 minutes (le temps de payer).
CREATE OR REPLACE FUNCTION public.hotel_room_availability(p_service_id UUID, p_check_in DATE, p_check_out DATE)
RETURNS TABLE (room_type_id UUID, available_units INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rt.id,
    GREATEST(rt.total_units - COALESCE((
      SELECT max(per_night.booked)
      FROM (
        SELECT night, sum(hbr.quantity) AS booked
        FROM generate_series(p_check_in, p_check_out - 1, interval '1 day') AS night
        JOIN public.hotel_booking_rooms hbr
          ON hbr.room_type_id = rt.id
         AND hbr.check_in <= night::date
         AND hbr.check_out > night::date
        JOIN public.bookings b ON b.id = hbr.booking_id
        WHERE b.status IN ('confirmed', 'completed')
           OR (b.status = 'pending' AND (
                b.payment_status::text IN ('paid', 'processing', 'partially_paid')
                OR COALESCE((b.booking_details->>'payAtProperty')::boolean, false)
                OR b.created_at > now() - interval '30 minutes'
              ))
        GROUP BY night
      ) AS per_night
    ), 0), 0)::integer
  FROM public.hotel_room_types rt
  JOIN public.services s ON s.id = rt.service_id
  WHERE rt.service_id = p_service_id
    AND rt.is_active
    AND s.available = true
    AND p_check_out > p_check_in
    AND p_check_out - p_check_in <= 60;
$$;

GRANT EXECUTE ON FUNCTION public.hotel_room_availability(UUID, DATE, DATE) TO anon, authenticated;
