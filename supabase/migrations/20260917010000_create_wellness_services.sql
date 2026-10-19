-- Bien-être & Beauté: spas, salons de manucure/pédicure, barbershops,
-- instituts de beauté et studios de yoga. Modeled directly on the
-- restaurants/restaurant_reservations pair (20260910220000): these are all
-- appointment-based businesses booked by time slot, not a day-range stay or
-- a flat per-unit price, so they don't fit the generic `services`/`bookings`
-- model any better than restaurants did. Reuses the same agency/sub_agency
-- ownership model.
--
-- Unlike a restaurant (one flat price range for the whole place), a wellness
-- venue offers several named treatments at different prices/durations
-- (manicure, pedicure, massage, haircut, yoga class...). Rather than a
-- separate treatments table, this keeps a lightweight JSONB catalog on the
-- venue row (same trade-off as artisans.products) and denormalizes the
-- chosen treatment's name/price/duration onto the booking row at booking
-- time, so a later price change on the venue never rewrites history.
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI
-- direct-connection path is broken for this project - run this file
-- manually in the Supabase Dashboard SQL Editor.

CREATE TABLE IF NOT EXISTS public.wellness_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('spa', 'nail_salon', 'barbershop', 'beauty_institute', 'yoga')),
  description TEXT,
  location TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  image_url TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  -- [{"name":"Manucure classique","description":"...","price":5000,"currency":"XOF","duration_minutes":30}, ...]
  treatments JSONB NOT NULL DEFAULT '[]',
  -- { "mon": {"open":"09:00","close":"19:00","closed":false}, ... } - same
  -- shape as restaurants.opening_hours, a missing/absent day means closed.
  opening_hours JSONB NOT NULL DEFAULT '{}',
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_interval_minutes > 0),
  -- 1 for an exclusive spa/barber/nail chair, higher for a group yoga class.
  max_capacity_per_slot INTEGER NOT NULL DEFAULT 1 CHECK (max_capacity_per_slot > 0),
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wellness_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wellness_service_id UUID NOT NULL REFERENCES public.wellness_services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1 CHECK (party_size > 0 AND party_size <= 50),
  treatment_name TEXT NOT NULL,
  treatment_price NUMERIC,
  treatment_currency TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wellness_services_agency_id ON public.wellness_services(agency_id);
CREATE INDEX IF NOT EXISTS idx_wellness_bookings_service_id ON public.wellness_bookings(wellness_service_id);
CREATE INDEX IF NOT EXISTS idx_wellness_bookings_user_id ON public.wellness_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_bookings_slot ON public.wellness_bookings(wellness_service_id, booking_date, booking_time);

ALTER TABLE public.wellness_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active wellness services are viewable by everyone" ON public.wellness_services;
CREATE POLICY "Active wellness services are viewable by everyone"
  ON public.wellness_services FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Agency owners manage their own wellness services" ON public.wellness_services;
CREATE POLICY "Agency owners manage their own wellness services"
  ON public.wellness_services FOR ALL
  USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id))
  WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id));

DROP POLICY IF EXISTS "Admins manage all wellness services" ON public.wellness_services;
CREATE POLICY "Admins manage all wellness services"
  ON public.wellness_services FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create their own wellness bookings" ON public.wellness_bookings;
CREATE POLICY "Users can create their own wellness bookings"
  ON public.wellness_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and venue owners view relevant wellness bookings" ON public.wellness_bookings;
CREATE POLICY "Users and venue owners view relevant wellness bookings"
  ON public.wellness_bookings FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.wellness_services w
      WHERE w.id = wellness_service_id AND public.is_agency_owner(auth.uid(), w.agency_id)
    )
  );

DROP POLICY IF EXISTS "Users can cancel their own wellness bookings" ON public.wellness_bookings;
CREATE POLICY "Users can cancel their own wellness bookings"
  ON public.wellness_bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

DROP POLICY IF EXISTS "Venue owners manage their wellness bookings" ON public.wellness_bookings;
CREATE POLICY "Venue owners manage their wellness bookings"
  ON public.wellness_bookings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.wellness_services w
    WHERE w.id = wellness_service_id AND public.is_agency_owner(auth.uid(), w.agency_id)
  ));

-- Capacity guard, same trade-off as enforce_restaurant_capacity: not
-- perfectly race-free under very high concurrent load on the exact same
-- slot, acceptable at this stage.
CREATE OR REPLACE FUNCTION public.enforce_wellness_capacity()
RETURNS TRIGGER AS $$
DECLARE
  max_capacity INTEGER;
  existing_capacity INTEGER;
BEGIN
  SELECT max_capacity_per_slot INTO max_capacity FROM public.wellness_services WHERE id = NEW.wellness_service_id;
  IF max_capacity IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(party_size), 0) INTO existing_capacity
  FROM public.wellness_bookings
  WHERE wellness_service_id = NEW.wellness_service_id
    AND booking_date = NEW.booking_date
    AND booking_time = NEW.booking_time
    AND status = 'confirmed'
    AND id IS DISTINCT FROM NEW.id;

  IF existing_capacity + NEW.party_size > max_capacity THEN
    RAISE EXCEPTION 'Ce créneau est complet, merci de choisir un autre horaire.' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_wellness_capacity_trigger ON public.wellness_bookings;
CREATE TRIGGER enforce_wellness_capacity_trigger
  BEFORE INSERT OR UPDATE ON public.wellness_bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.enforce_wellness_capacity();

DROP TRIGGER IF EXISTS set_updated_at_wellness_services ON public.wellness_services;
CREATE TRIGGER set_updated_at_wellness_services
  BEFORE UPDATE ON public.wellness_services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_wellness_bookings ON public.wellness_bookings;
CREATE TRIGGER set_updated_at_wellness_bookings
  BEFORE UPDATE ON public.wellness_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Public, PII-free availability check, same shape as
-- get_restaurant_slot_covers: how many spots are already booked per slot
-- for a given venue/date, without exposing other customers' contact info.
CREATE OR REPLACE FUNCTION public.get_wellness_slot_bookings(p_wellness_service_id UUID, p_date DATE)
RETURNS TABLE(booking_time TIME, spots_booked INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT booking_time, COALESCE(SUM(party_size), 0)::INTEGER
  FROM public.wellness_bookings
  WHERE wellness_service_id = p_wellness_service_id
    AND booking_date = p_date
    AND status = 'confirmed'
  GROUP BY booking_time;
$$;

GRANT EXECUTE ON FUNCTION public.get_wellness_slot_bookings(UUID, DATE) TO anon, authenticated;
