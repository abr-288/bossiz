-- Real customer reviews: moderation + gating to actual completed bookings.
--
-- Today `reviews.user_id` NOT NULL / INSERT WITH CHECK (auth.uid() = user_id)
-- lets any authenticated user post a "review" for any service with no real
-- booking behind it, and every review is public immediately (no moderation).
-- This migration:
--   1. adds a moderation `status` (pending/approved/rejected), defaulting to
--      pending and enforced server-side (a non-admin can never set it),
--   2. requires a real completed booking to insert a review as a normal
--      user, while still letting admins backfill reviews imported from the
--      old site (nullable user_id + reviewer_name for those),
--   3. only aggregates `services.rating`/`total_reviews` from approved
--      reviews.
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI
-- direct-connection path is broken for this project (permission denied
-- altering the temporary login role) - run this file manually in the
-- Supabase Dashboard SQL Editor. Written idempotently where practical so
-- it's safe to re-run if a previous attempt only partially applied.

ALTER TABLE public.reviews
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'site' CHECK (source IN ('site', 'imported')),
  ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

COMMENT ON COLUMN public.reviews.reviewer_name IS 'Display name for imported reviews with no linked auth.users account';

-- Grandfather every review that already existed (and was already public)
-- before this migration as 'approved', so nothing already live on the site
-- disappears the moment moderation is turned on. Must run BEFORE the
-- enforce_review_status trigger below exists, since that trigger would
-- otherwise block a plain UPDATE like this one from changing the status.
UPDATE public.reviews SET status = 'approved' WHERE status = 'pending';

-- A non-admin can never set/change the moderation status directly: new
-- reviews always start pending, and any update from a non-admin silently
-- keeps whatever status it already had.
CREATE OR REPLACE FUNCTION public.enforce_review_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
    ELSE
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_review_status_trigger ON public.reviews;
CREATE TRIGGER enforce_review_status_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_review_status();

-- Only approved reviews feed the public rating/review-count shown on a
-- service (pending/rejected reviews no longer inflate it while awaiting
-- moderation).
CREATE OR REPLACE FUNCTION public.update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.services
  SET
    rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM public.reviews
      WHERE service_id = COALESCE(NEW.service_id, OLD.service_id) AND status = 'approved'
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE service_id = COALESCE(NEW.service_id, OLD.service_id) AND status = 'approved'
    )
  WHERE id = COALESCE(NEW.service_id, OLD.service_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Reviews policies: replace the old "anyone can insert/see everything" set
-- with real gating. Existing policies are dropped and recreated so this file
-- is safe to re-run.
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Approved reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Approved reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON public.reviews;
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
        AND b.status = 'completed'
    )
  );

DROP POLICY IF EXISTS "Admins can insert any review" ON public.reviews;
CREATE POLICY "Admins can insert any review"
  ON public.reviews FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update any review" ON public.reviews;
CREATE POLICY "Admins can update any review"
  ON public.reviews FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Recompute every service's rating/total_reviews now that the aggregation
-- function only counts 'approved' rows (grandfathered reviews above are all
-- 'approved', so existing services keep the ratings customers already see).
UPDATE public.services s
SET
  rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM public.reviews r WHERE r.service_id = s.id AND r.status = 'approved'), 0),
  total_reviews = COALESCE((SELECT COUNT(*) FROM public.reviews r WHERE r.service_id = s.id AND r.status = 'approved'), 0)
WHERE EXISTS (SELECT 1 FROM public.reviews r WHERE r.service_id = s.id);
