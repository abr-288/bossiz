-- Wires actual commission tracking for restaurant reservations and
-- wellness bookings, which currently generate zero commission rows -
-- unlike hotels/cars/stays (paid online, computed by
-- postPaymentSuccess.ts), a table reservation or a spa appointment is
-- booked for free in-app and paid in person, so there is no payment
-- webhook to hang a commission calculation off. This adds it at the
-- database layer instead (a trigger, mirroring the existing capacity
-- guards), using each agency's own `commission_rate` - the same field
-- already configurable per agency in /admin/agencies, so there is a
-- single place admins already use to change a rate if 10% stops being
-- right, no new "commission settings" duplicate of that field.
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI
-- direct-connection path is broken for this project - run this file
-- manually in the Supabase Dashboard SQL Editor.

-- Restaurants have no per-item price (a table reservation isn't priced -
-- guests order off the menu), so there is nothing to base a commission on
-- unless the partner tells us what an average check looks like. Nullable:
-- no value set = no commission computed for that restaurant, by design,
-- rather than guessing a number that misrepresents what's owed.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS average_ticket_price NUMERIC CHECK (average_ticket_price IS NULL OR average_ticket_price >= 0);

-- --------------------------------------------------------------------
-- Relax public.commissions (previously hotels/cars/stays/activities only,
-- one row per public.bookings row) into a shared ledger: source_type +
-- source_id identify where a row came from, booking_id stays as-is (and
-- still required) for the original service-booking origin so nothing
-- about existing rows or postPaymentSuccess.ts changes, and is simply
-- NULL for the two new origins.
-- --------------------------------------------------------------------
ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'service_booking'
    CHECK (source_type IN ('service_booking', 'restaurant_reservation', 'wellness_booking')),
  ADD COLUMN IF NOT EXISTS source_id UUID;

-- Backfill existing rows explicitly (the DEFAULT above only applies to
-- new rows in some Postgres versions' MVCC semantics for pre-existing
-- rows added in the same statement batch - explicit UPDATE is always safe).
UPDATE public.commissions SET source_type = 'service_booking' WHERE source_id IS NULL AND booking_id IS NOT NULL;

ALTER TABLE public.commissions ALTER COLUMN booking_id DROP NOT NULL;

-- The old table-wide UNIQUE(booking_id) would incorrectly forbid two
-- restaurant/wellness commission rows (both booking_id NULL). Replace it
-- with a constraint scoped to the origin it actually applies to.
ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_booking_id_key;
DROP INDEX IF EXISTS commissions_booking_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS commissions_service_booking_unique
  ON public.commissions(booking_id) WHERE source_type = 'service_booking';
CREATE UNIQUE INDEX IF NOT EXISTS commissions_source_unique
  ON public.commissions(source_type, source_id) WHERE source_id IS NOT NULL;

-- --------------------------------------------------------------------
-- Restaurant reservations: commission = party_size * average_ticket_price
-- * agency commission_rate, computed/refreshed on confirm, cancelled if
-- the reservation is cancelled. Skips entirely if the restaurant has no
-- average_ticket_price set - see column comment above.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_restaurant_reservation_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
  v_rate NUMERIC;
  v_ticket_price NUMERIC;
  v_amount NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' THEN
    SELECT r.agency_id, a.commission_rate, r.average_ticket_price
      INTO v_agency_id, v_rate, v_ticket_price
      FROM public.restaurants r
      JOIN public.agencies a ON a.id = r.agency_id
      WHERE r.id = NEW.restaurant_id;

    IF v_ticket_price IS NULL OR v_rate IS NULL THEN
      RETURN NEW;
    END IF;

    v_amount := v_ticket_price * NEW.party_size;

    INSERT INTO public.commissions (agency_id, source_type, source_id, booking_amount, commission_rate, commission_amount, status)
    VALUES (v_agency_id, 'restaurant_reservation', NEW.id, v_amount, v_rate, ROUND(v_amount * v_rate / 100, 2), 'pending')
    ON CONFLICT (source_type, source_id) WHERE source_id IS NOT NULL DO UPDATE
      SET booking_amount = EXCLUDED.booking_amount,
          commission_rate = EXCLUDED.commission_rate,
          commission_amount = EXCLUDED.commission_amount,
          updated_at = now()
      WHERE public.commissions.status = 'pending';

  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.commissions
      SET status = 'cancelled', updated_at = now()
      WHERE source_type = 'restaurant_reservation' AND source_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_restaurant_reservation_commission_trigger ON public.restaurant_reservations;
CREATE TRIGGER sync_restaurant_reservation_commission_trigger
  AFTER INSERT OR UPDATE ON public.restaurant_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_restaurant_reservation_commission();

-- --------------------------------------------------------------------
-- Wellness bookings: same shape, using the treatment price already
-- denormalized onto the booking row instead of an average estimate.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_wellness_booking_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
  v_rate NUMERIC;
  v_amount NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' THEN
    SELECT w.agency_id, a.commission_rate
      INTO v_agency_id, v_rate
      FROM public.wellness_services w
      JOIN public.agencies a ON a.id = w.agency_id
      WHERE w.id = NEW.wellness_service_id;

    IF NEW.treatment_price IS NULL OR v_rate IS NULL THEN
      RETURN NEW;
    END IF;

    v_amount := NEW.treatment_price * NEW.party_size;

    INSERT INTO public.commissions (agency_id, source_type, source_id, booking_amount, commission_rate, commission_amount, status)
    VALUES (v_agency_id, 'wellness_booking', NEW.id, v_amount, v_rate, ROUND(v_amount * v_rate / 100, 2), 'pending')
    ON CONFLICT (source_type, source_id) WHERE source_id IS NOT NULL DO UPDATE
      SET booking_amount = EXCLUDED.booking_amount,
          commission_rate = EXCLUDED.commission_rate,
          commission_amount = EXCLUDED.commission_amount,
          updated_at = now()
      WHERE public.commissions.status = 'pending';

  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.commissions
      SET status = 'cancelled', updated_at = now()
      WHERE source_type = 'wellness_booking' AND source_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_wellness_booking_commission_trigger ON public.wellness_bookings;
CREATE TRIGGER sync_wellness_booking_commission_trigger
  AFTER INSERT OR UPDATE ON public.wellness_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_wellness_booking_commission();
