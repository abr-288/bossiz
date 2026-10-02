-- A verified-purchase review is permanently tied to its purchase.
-- Users may submit an eligible review once, but cannot later reassign it to
-- another service/booking or remove it to submit a replacement. Admin review
-- moderation policies remain responsible for edits/deletions.

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

-- Reviews imported from older systems may have no booking_id. Keep those
-- legacy rows while enforcing one review for each real booking.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_booking_idx
  ON public.reviews (booking_id)
  WHERE booking_id IS NOT NULL;
