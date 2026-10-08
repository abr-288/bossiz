-- Remove the zero-cost package and require all published partner packages
-- to use the existing monthly/yearly prices.
DELETE FROM public.car_partner_plans
WHERE monthly_price <= 0 OR yearly_price <= 0;

ALTER TABLE public.car_partner_plans
  DROP CONSTRAINT IF EXISTS car_partner_plans_monthly_price_paid_check,
  DROP CONSTRAINT IF EXISTS car_partner_plans_yearly_price_paid_check;
ALTER TABLE public.car_partner_plans
  ADD CONSTRAINT car_partner_plans_monthly_price_paid_check CHECK (monthly_price > 0),
  ADD CONSTRAINT car_partner_plans_yearly_price_paid_check CHECK (yearly_price > 0);

CREATE TABLE IF NOT EXISTS public.car_partner_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.car_partner_plans(plan_id) ON DELETE RESTRICT,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_due NUMERIC NOT NULL CHECK (amount_due > 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'active', 'expired', 'cancelled')),
  paid_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  transaction_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT car_partner_subscriptions_active_dates_check
    CHECK (status <> 'active' OR (paid_at IS NOT NULL AND starts_at IS NOT NULL AND ends_at > starts_at))
);

ALTER TABLE public.car_partner_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Agency owners view car subscriptions" ON public.car_partner_subscriptions;
CREATE POLICY "Agency owners view car subscriptions"
  ON public.car_partner_subscriptions FOR SELECT
  USING (
    public.is_agency_owner(auth.uid(), agency_id)
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Agency owners request paid car subscriptions" ON public.car_partner_subscriptions;
CREATE POLICY "Agency owners request paid car subscriptions"
  ON public.car_partner_subscriptions FOR INSERT
  WITH CHECK (
    public.is_agency_owner(auth.uid(), agency_id)
    AND status = 'pending'
    AND paid_at IS NULL
    AND transaction_id IS NULL
  );

GRANT SELECT, INSERT ON public.car_partner_subscriptions TO authenticated;

CREATE OR REPLACE FUNCTION public.prepare_car_partner_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_plan public.car_partner_plans%ROWTYPE;
BEGIN
  SELECT * INTO selected_plan
  FROM public.car_partner_plans
  WHERE plan_id = NEW.plan_id
    AND is_active = true
    AND monthly_price > 0
    AND yearly_price > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Forfait voiture payant introuvable ou inactif'
      USING ERRCODE = '23514';
  END IF;

  NEW.amount_due := CASE
    WHEN NEW.billing_cycle = 'yearly' THEN selected_plan.yearly_price
    ELSE selected_plan.monthly_price
  END;
  NEW.currency := selected_plan.currency;
  NEW.status := 'pending';
  NEW.paid_at := NULL;
  NEW.starts_at := NULL;
  NEW.ends_at := NULL;
  NEW.transaction_id := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepare_car_partner_subscription ON public.car_partner_subscriptions;
CREATE TRIGGER prepare_car_partner_subscription
  BEFORE INSERT ON public.car_partner_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.prepare_car_partner_subscription();

CREATE INDEX IF NOT EXISTS idx_car_partner_subscriptions_active
  ON public.car_partner_subscriptions (agency_id, status, ends_at DESC);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS car_partner_subscription_id UUID
    REFERENCES public.car_partner_subscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_target_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_target_check
  CHECK (
    (
      car_partner_subscription_id IS NOT NULL
      AND booking_id IS NULL
      AND subscription_id IS NULL
    )
    OR (
      car_partner_subscription_id IS NULL
      AND (booking_id IS NOT NULL OR subscription_id IS NOT NULL)
    )
  );
CREATE INDEX IF NOT EXISTS idx_payments_car_partner_subscription_id
  ON public.payments(car_partner_subscription_id);

CREATE OR REPLACE FUNCTION public.enforce_paid_car_partner_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_subscription_id UUID;
  vehicle_limit INTEGER;
  existing_live_vehicles INTEGER;
  requires_subscription BOOLEAN;
BEGIN
  IF NEW.type::text <> 'car' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    requires_subscription := true;
  ELSE
    IF OLD.agency_id IS NOT NULL AND NEW.agency_id IS NULL THEN
      NEW.available := false;
      RETURN NEW;
    END IF;
    requires_subscription := OLD.type::text <> 'car'
      OR (NEW.available IS TRUE AND COALESCE(OLD.available, false) IS FALSE)
      OR NEW.agency_id IS DISTINCT FROM OLD.agency_id;
  END IF;

  IF NOT requires_subscription THEN
    RETURN NEW;
  END IF;

  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'Une agence doit disposer d’un forfait voiture payant actif avant de publier un véhicule'
      USING ERRCODE = '42501';
  END IF;

  SELECT subscription.id, plan.max_vehicles
    INTO active_subscription_id, vehicle_limit
  FROM public.car_partner_subscriptions AS subscription
  JOIN public.car_partner_plans AS plan ON plan.plan_id = subscription.plan_id
  WHERE subscription.agency_id = NEW.agency_id
    AND subscription.status = 'active'
    AND subscription.paid_at IS NOT NULL
    AND subscription.starts_at <= now()
    AND subscription.ends_at > now()
    AND plan.is_active = true
    AND plan.monthly_price > 0
    AND plan.yearly_price > 0
  ORDER BY subscription.ends_at DESC
  LIMIT 1
  FOR UPDATE OF subscription;

  IF active_subscription_id IS NULL THEN
    RAISE EXCEPTION 'Un forfait voiture payant actif est requis avant de publier un véhicule'
      USING ERRCODE = '42501';
  END IF;

  IF vehicle_limit IS NOT NULL THEN
    SELECT count(*) INTO existing_live_vehicles
    FROM public.services
    WHERE agency_id = NEW.agency_id
      AND type::text = 'car'
      AND available IS TRUE
      AND id <> NEW.id;

    IF existing_live_vehicles >= vehicle_limit THEN
      RAISE EXCEPTION 'La limite de véhicules du forfait actif est atteinte'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS require_paid_car_partner_subscription ON public.services;
CREATE TRIGGER require_paid_car_partner_subscription
  BEFORE INSERT OR UPDATE OF type, agency_id, available ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.enforce_paid_car_partner_listing();
