CREATE TABLE public.agency_branding_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  amount_due NUMERIC NOT NULL DEFAULT 2500 CHECK (amount_due = 2500),
  currency TEXT NOT NULL DEFAULT 'XOF' CHECK (currency = 'XOF'),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'active', 'expired')),
  paid_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  transaction_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agency_branding_subscriptions_active_dates_check
    CHECK (status <> 'active' OR (paid_at IS NOT NULL AND starts_at IS NOT NULL AND ends_at > starts_at))
);

ALTER TABLE public.agency_branding_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can view branding subscriptions"
  ON public.agency_branding_subscriptions FOR SELECT
  TO authenticated
  USING (public.is_agency_owner(auth.uid(), agency_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agency owners can request branding subscriptions"
  ON public.agency_branding_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_agency_owner(auth.uid(), agency_id)
    AND status = 'pending'
    AND paid_at IS NULL
    AND starts_at IS NULL
    AND ends_at IS NULL
    AND transaction_id IS NULL
  );

GRANT SELECT, INSERT ON public.agency_branding_subscriptions TO authenticated;
GRANT ALL ON public.agency_branding_subscriptions TO service_role;

CREATE UNIQUE INDEX agency_branding_one_open_subscription_per_agency
  ON public.agency_branding_subscriptions (agency_id)
  WHERE status IN ('pending', 'processing');

CREATE INDEX agency_branding_active_expiry
  ON public.agency_branding_subscriptions (agency_id, ends_at DESC)
  WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.prepare_agency_branding_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.amount_due := 2500;
  NEW.currency := 'XOF';
  NEW.status := 'pending';
  NEW.paid_at := NULL;
  NEW.starts_at := NULL;
  NEW.ends_at := NULL;
  NEW.transaction_id := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prepare_agency_branding_subscription
  BEFORE INSERT ON public.agency_branding_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.prepare_agency_branding_subscription();

CREATE OR REPLACE FUNCTION public.require_paid_agency_branding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_visible IS TRUE AND NOT EXISTS (
    SELECT 1
    FROM public.agency_branding_subscriptions AS subscription
    WHERE subscription.agency_id = NEW.id
      AND subscription.status = 'active'
      AND subscription.paid_at IS NOT NULL
      AND subscription.starts_at <= now()
      AND subscription.ends_at > now()
  ) THEN
    RAISE EXCEPTION 'Un abonnement de branding actif (2 500 F XOF/mois) est requis'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER require_paid_agency_branding
  BEFORE INSERT OR UPDATE OF is_visible ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.require_paid_agency_branding();

-- Le nouveau forfait est payant : désactiver le branding existant sans preuve
-- de paiement plutôt que de laisser des activations gratuites.
UPDATE public.agencies
SET is_visible = false
WHERE is_visible IS TRUE;

ALTER TABLE public.payments
  ADD COLUMN agency_branding_subscription_id UUID
    REFERENCES public.agency_branding_subscriptions(id) ON DELETE CASCADE;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_target_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_target_check
  CHECK (
    (
      agency_branding_subscription_id IS NOT NULL
      AND subscription_id IS NULL
      AND booking_id IS NULL
      AND car_partner_subscription_id IS NULL
    )
    OR (
      agency_branding_subscription_id IS NULL
      AND (
        booking_id IS NOT NULL
        OR subscription_id IS NOT NULL
        OR car_partner_subscription_id IS NOT NULL
      )
    )
  );

CREATE INDEX payments_agency_branding_subscription_id_idx
  ON public.payments (agency_branding_subscription_id);

CREATE OR REPLACE FUNCTION public.expire_agency_branding_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.agency_branding_subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND ends_at <= now();

  UPDATE public.agencies AS agency
  SET is_visible = false
  WHERE agency.is_visible IS TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM public.agency_branding_subscriptions AS subscription
      WHERE subscription.agency_id = agency.id
        AND subscription.status = 'active'
        AND subscription.paid_at IS NOT NULL
        AND subscription.starts_at <= now()
        AND subscription.ends_at > now()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.expire_agency_branding_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_agency_branding_subscriptions() TO service_role;

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'expire-agency-branding-subscriptions';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'expire-agency-branding-subscriptions',
    '0 * * * *',
    'SELECT public.expire_agency_branding_subscriptions();'
  );
END;
$$;
