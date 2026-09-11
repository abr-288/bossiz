-- The invoices table (see 20260113145008_...sql) was designed for
-- subscription billing (billing_period_id) and never got a way to link an
-- invoice back to the booking it was issued for - generate-invoice/index.ts
-- was trying to insert a booking_id column that doesn't exist, so every
-- invoice generation has been silently failing (swallowed by a .catch() in
-- postPaymentSuccess.ts). This adds the missing link.
--
-- Run manually in the Supabase Dashboard SQL Editor (see prior migrations
-- in this folder for why). Idempotent - safe to re-run.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
