-- Paiement des forfaits voiture (Pro, Flotte) activable depuis l'admin.
--
-- Le réglage site_config 'car_partner_plans' ({"paymentsEnabled": bool},
-- modifiable par les admins uniquement) est lu par la base, le site et Bozi :
-- - désactivé : publication de véhicules gratuite et sans limite, toute
--   nouvelle souscription à un forfait voiture est refusée ;
-- - activé : règles de 20261006130000_paid_car_partner_subscriptions.sql
--   (forfait payé obligatoire pour publier, plafond de véhicules du forfait).
-- Les véhicules déjà en ligne ne sont pas dépubliés quand on réactive le
-- paiement : la règle s'applique aux nouvelles publications.

INSERT INTO public.site_config (config_key, config_value, category, description)
VALUES (
  'car_partner_plans',
  '{"paymentsEnabled": false}'::jsonb,
  'partners',
  'Paiement des forfaits voiture : désactivé = publication de véhicules gratuite pour les loueurs'
)
ON CONFLICT (config_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.car_plan_payments_enabled()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT (config_value->>'paymentsEnabled')::boolean
     FROM public.site_config
     WHERE config_key = 'car_partner_plans'),
    false
  );
$$;

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

  -- Paiement des forfaits désactivé : publication gratuite et sans limite.
  IF NOT requires_subscription OR NOT public.car_plan_payments_enabled() THEN
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

CREATE OR REPLACE FUNCTION public.prepare_car_partner_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_plan public.car_partner_plans%ROWTYPE;
BEGIN
  IF NOT public.car_plan_payments_enabled() THEN
    RAISE EXCEPTION 'Les forfaits voiture payants sont suspendus : la publication de véhicules est gratuite'
      USING ERRCODE = '23514';
  END IF;

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
