-- Close a gap the review-gating migration (20260910200000) exposed: nothing
-- stopped a plain authenticated customer from inserting/updating their own
-- `bookings` row with status='completed' and payment_status='paid' directly
-- (RLS only checked `auth.uid() = user_id`, never which columns/values).
-- Verified live: a test account could self-insert a "completed" booking
-- with payment_status still 'pending' - no payment, no fulfillment, and it
-- would have unlocked writing a review for any service.
--
-- Also: nothing in this codebase ever sets bookings.status = 'completed' -
-- postPaymentSuccess.ts only ever writes status='confirmed'/payment_status=
-- 'paid'. The review-eligibility check is broadened accordingly: paid +
-- confirmed + the service date has actually passed, rather than waiting on
-- a status value nothing produces.
--
-- NOTE: Supabase CLI direct-connection is broken for this project - run
-- this file manually in the Supabase Dashboard SQL Editor, same as the
-- other recent migrations in this folder.

-- A plain customer can never set status/payment_status themselves, on
-- insert or update - those only ever change through a real payment/
-- fulfillment event running with the service-role key (auth.uid() IS NULL)
-- or an admin action. Everyone else's writes are silently forced back to
-- 'pending' (insert) or left unchanged (update).
CREATE OR REPLACE FUNCTION public.enforce_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
      NEW.payment_status := 'pending';
    ELSE
      NEW.status := OLD.status;
      NEW.payment_status := OLD.payment_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_booking_status_trigger ON public.bookings;
CREATE TRIGGER enforce_booking_status_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_status();

-- Broaden review eligibility: paid + confirmed booking whose service date
-- has already passed, instead of an unused 'completed' status.
DROP POLICY IF EXISTS "Users can create reviews for their completed bookings" ON public.reviews;
CREATE POLICY "Users can create reviews for their completed bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.user_id = auth.uid()
        AND b.service_id = reviews.service_id
        AND b.payment_status = 'paid'
        AND b.status IN ('confirmed', 'completed')
        AND COALESCE(b.end_date, b.start_date) <= CURRENT_DATE
    )
  );

-- Clean up the forged test booking created while proving the gap above
-- (self-inserted as status='completed', payment_status='pending', no real
-- payment behind it) - safe to remove, it was never a real booking.
DELETE FROM public.bookings WHERE id = 'cb937b67-cfec-44dc-abdd-905ba4e54b1e';
