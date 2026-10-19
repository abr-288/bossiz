-- Subscription packages ("forfaits") for car-rental agency partners.
-- Distinct from subscription_plans (20240420_create_subscription_plans.sql),
-- which are end-customer Bossiz Club memberships and have nothing to do with
-- agencies. This table lets an agency's vehicle-listing limits, commission
-- rate and visibility perks vary by the package they subscribed to, instead
-- of the single flat commission_rate agencies has always had.
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI is
-- broken for this project - run this file manually in the Supabase Dashboard
-- SQL Editor. Written idempotently (IF NOT EXISTS / DROP ... IF EXISTS) so
-- it's safe to re-run if a previous attempt only partially applied.

CREATE TABLE IF NOT EXISTS public.car_partner_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  yearly_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  commission_rate NUMERIC NOT NULL DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  max_vehicles INTEGER, -- NULL = illimité
  featured_slots INTEGER NOT NULL DEFAULT 0, -- véhicules pouvant être mis en avant / mois
  support_level TEXT NOT NULL DEFAULT 'email',
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.car_partner_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active car partner plans" ON public.car_partner_plans;
CREATE POLICY "Anyone can view active car partner plans"
  ON public.car_partner_plans FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage car partner plans" ON public.car_partner_plans;
CREATE POLICY "Admins can manage car partner plans"
  ON public.car_partner_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS set_updated_at_car_partner_plans ON public.car_partner_plans;
CREATE TRIGGER set_updated_at_car_partner_plans
  BEFORE UPDATE ON public.car_partner_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Which package an agency is currently on. Nullable and unenforced when
-- NULL, so existing partners are grandfathered in as unlimited rather than
-- suddenly capped the day this ships.
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS car_plan_id TEXT REFERENCES public.car_partner_plans(plan_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS car_plan_started_at TIMESTAMPTZ;

-- Which package a prospective partner asked for when they applied, so the
-- admin reviewing partner_applications knows what to assign on approval.
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS requested_car_plan_id TEXT REFERENCES public.car_partner_plans(plan_id) ON DELETE SET NULL;

INSERT INTO public.car_partner_plans
  (plan_id, name, tagline, monthly_price, yearly_price, commission_rate, max_vehicles, featured_slots, support_level, features, sort_order)
VALUES
  ('decouverte', 'Découverte', 'Pour tester la plateforme sans engagement', 0, 0, 12, 3, 0, 'email',
   '["Jusqu''à 3 véhicules en ligne", "Commission standard 12%", "Support par email", "Fiche véhicule avec 6 photos"]', 1),
  ('pro', 'Pro', 'Pour une flotte active en croissance', 25000, 250000, 8, 15, 2, 'priority',
   '["Tout Découverte +", "Jusqu''à 15 véhicules en ligne", "Commission réduite à 8%", "2 véhicules mis en avant chaque mois", "Support prioritaire"]', 2),
  ('flotte', 'Flotte', 'Pour les loueurs avec un grand parc automobile', 60000, 600000, 5, NULL, 10, 'dedicated',
   '["Tout Pro +", "Véhicules illimités", "Commission réduite à 5%", "10 mises en avant par mois", "Badge Partenaire Vérifié", "Conseiller dédié"]', 3)
ON CONFLICT (plan_id) DO NOTHING;
