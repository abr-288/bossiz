-- Admin-controlled deposit/full-payment choice for eligible booking types.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_plan text NOT NULL DEFAULT 'full'
    CHECK (payment_plan IN ('full', 'deposit')),
  ADD COLUMN IF NOT EXISTS deposit_percent numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_due_now numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_paid_on_site boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS balance_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS balance_paid_by uuid REFERENCES auth.users(id);

UPDATE public.bookings
SET amount_due_now = total_price,
    amount_paid = CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END,
    balance_due = CASE WHEN payment_status = 'paid' THEN 0 ELSE total_price END
WHERE amount_due_now = 0 AND total_price > 0;

INSERT INTO public.site_config (config_key, config_value, category, description)
VALUES (
  'booking_payment_policy',
  '{"depositEnabled":true,"depositPercent":30,"enabledServiceTypes":["car","tour","event","stay","activity"],"reviewPromptEnabled":true}'::jsonb,
  'booking',
  'Acompte à la réservation et avis clients après paiement'
)
ON CONFLICT (config_key) DO NOTHING;

DROP POLICY IF EXISTS "Users can create reviews for their completed bookings" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews for their paid bookings" ON public.reviews;
CREATE POLICY "Users can create reviews for their paid bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.user_id = auth.uid()
        AND b.service_id = reviews.service_id
        AND b.payment_status IN ('paid', 'partially_paid')
        AND b.status IN ('confirmed', 'completed')
    )
  );

CREATE OR REPLACE FUNCTION public.admin_mark_booking_balance_paid(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.bookings
  SET payment_status = 'paid',
      amount_paid = total_price,
      balance_due = 0,
      balance_paid_on_site = true,
      balance_paid_at = now(),
      balance_paid_by = auth.uid(),
      updated_at = now()
  WHERE id = p_booking_id
    AND payment_status = 'partially_paid'
    AND balance_due > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking has no outstanding on-site balance';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_mark_booking_balance_paid(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_mark_booking_balance_paid(uuid) TO authenticated;
