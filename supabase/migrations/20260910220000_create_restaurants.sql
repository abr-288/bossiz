-- Restaurant portal: agency-owned restaurants that customers can book a
-- table at directly from the site. Reuses the existing agency/sub_agency
-- infrastructure (an agency that already lists cars/tours can also list a
-- restaurant) rather than inventing a parallel owner concept.
--
-- Table reservations don't fit the generic `services`/`bookings` model (no
-- day-range, no price_per_unit, capacity is per time-slot not per item), so
-- this gets its own two tables instead of forcing it into `services`.
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI
-- direct-connection path is broken for this project - run this file
-- manually in the Supabase Dashboard SQL Editor.

CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cuisine_type TEXT,
  location TEXT NOT NULL,
  address TEXT,
  price_range TEXT NOT NULL DEFAULT '€€' CHECK (price_range IN ('€', '€€', '€€€', '€€€€')),
  image_url TEXT,
  images TEXT[],
  phone TEXT,
  -- { "mon": {"open":"11:00","close":"22:00"}, "tue": {...}, ... } - a
  -- missing/absent day means closed that day.
  opening_hours JSONB NOT NULL DEFAULT '{}',
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_interval_minutes > 0),
  max_covers_per_slot INTEGER NOT NULL DEFAULT 20 CHECK (max_covers_per_slot > 0),
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.restaurant_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0 AND party_size <= 50),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_agency_id ON public.restaurants(agency_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_reservations_restaurant_id ON public.restaurant_reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_reservations_user_id ON public.restaurant_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_reservations_slot ON public.restaurant_reservations(restaurant_id, reservation_date, reservation_time);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active restaurants are viewable by everyone" ON public.restaurants;
CREATE POLICY "Active restaurants are viewable by everyone"
  ON public.restaurants FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Agency owners manage their own restaurants" ON public.restaurants;
CREATE POLICY "Agency owners manage their own restaurants"
  ON public.restaurants FOR ALL
  USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id))
  WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id));

DROP POLICY IF EXISTS "Admins manage all restaurants" ON public.restaurants;
CREATE POLICY "Admins manage all restaurants"
  ON public.restaurants FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create their own reservations" ON public.restaurant_reservations;
CREATE POLICY "Users can create their own reservations"
  ON public.restaurant_reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and restaurant owners view relevant reservations" ON public.restaurant_reservations;
CREATE POLICY "Users and restaurant owners view relevant reservations"
  ON public.restaurant_reservations FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_id AND public.is_agency_owner(auth.uid(), r.agency_id)
    )
  );

DROP POLICY IF EXISTS "Users can cancel their own reservations" ON public.restaurant_reservations;
CREATE POLICY "Users can cancel their own reservations"
  ON public.restaurant_reservations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

DROP POLICY IF EXISTS "Restaurant owners manage their reservations" ON public.restaurant_reservations;
CREATE POLICY "Restaurant owners manage their reservations"
  ON public.restaurant_reservations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_id AND public.is_agency_owner(auth.uid(), r.agency_id)
  ));

-- Capacity guard: a slot can never take more covers than the restaurant
-- allows. Runs as part of the same INSERT/UPDATE transaction so it can't be
-- bypassed by a direct client insert - only reservations that stay under
-- the cap for that exact date+time are allowed through. Not perfectly
-- race-free under very high concurrent load on the same slot (would need
-- SELECT ... FOR UPDATE on a per-slot counter row for that), an acceptable
-- trade-off at this stage.
CREATE OR REPLACE FUNCTION public.enforce_restaurant_capacity()
RETURNS TRIGGER AS $$
DECLARE
  max_covers INTEGER;
  existing_covers INTEGER;
BEGIN
  SELECT max_covers_per_slot INTO max_covers FROM public.restaurants WHERE id = NEW.restaurant_id;
  IF max_covers IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(party_size), 0) INTO existing_covers
  FROM public.restaurant_reservations
  WHERE restaurant_id = NEW.restaurant_id
    AND reservation_date = NEW.reservation_date
    AND reservation_time = NEW.reservation_time
    AND status = 'confirmed'
    AND id IS DISTINCT FROM NEW.id;

  IF existing_covers + NEW.party_size > max_covers THEN
    RAISE EXCEPTION 'Ce créneau est complet, merci de choisir un autre horaire.' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_restaurant_capacity_trigger ON public.restaurant_reservations;
CREATE TRIGGER enforce_restaurant_capacity_trigger
  BEFORE INSERT OR UPDATE ON public.restaurant_reservations
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.enforce_restaurant_capacity();

DROP TRIGGER IF EXISTS set_updated_at_restaurants ON public.restaurants;
CREATE TRIGGER set_updated_at_restaurants
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_restaurant_reservations ON public.restaurant_reservations;
CREATE TRIGGER set_updated_at_restaurant_reservations
  BEFORE UPDATE ON public.restaurant_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Public, PII-free availability check: how many covers are already booked
-- per time slot for a given restaurant/date, so the booking UI can show
-- "complet" without ever exposing other diners' names/emails/phones (which
-- the RLS SELECT policy above deliberately does not allow anon/other users
-- to read directly).
CREATE OR REPLACE FUNCTION public.get_restaurant_slot_covers(p_restaurant_id UUID, p_date DATE)
RETURNS TABLE(reservation_time TIME, covers_booked INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT reservation_time, COALESCE(SUM(party_size), 0)::INTEGER
  FROM public.restaurant_reservations
  WHERE restaurant_id = p_restaurant_id
    AND reservation_date = p_date
    AND status = 'confirmed'
  GROUP BY reservation_time;
$$;

GRANT EXECUTE ON FUNCTION public.get_restaurant_slot_covers(UUID, DATE) TO anon, authenticated;
