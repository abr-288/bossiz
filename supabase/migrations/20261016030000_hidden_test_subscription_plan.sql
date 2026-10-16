-- Formule de test à 100 FCFA pour vérifier le parcours de paiement réel
-- (Jèko, activation, email, reçu, carte de membre) sans payer le prix Premium.
--
-- 1. subscription_plans.is_public : une formule non publique reste
--    souscriptible par lien direct (/subscription-payment?planId=...) mais
--    n'apparaît ni dans la liste des abonnements ni dans les réponses de Bozi.
--    process-payment n'accepte son paiement que pour un administrateur.
-- 2. Formule 'test' : mêmes avantages que Premium, 100 XOF par mois ou par an.
--    La désactiver après les tests : UPDATE subscription_plans SET is_active = false WHERE plan_id = 'test';

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

INSERT INTO public.subscription_plans (
  plan_id, name, subtitle, description, icon, features,
  subscription_type, assigned_role, assistance_level,
  is_active, is_public, sort_order, price, billing_cycles, default_billing_cycle,
  trial_days, setup_fee, currency, color
)
SELECT
  'test', 'Test (100 FCFA)', 'Formule de test réservée aux administrateurs',
  'Vérification du parcours de paiement', icon, features,
  subscription_type, assigned_role, assistance_level,
  true, false, 99, '100 FCFA', billing_cycles, 'monthly',
  0, 0, 'XOF', color
FROM public.subscription_plans
WHERE plan_id = 'premium'
  AND NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE plan_id = 'test');

INSERT INTO public.subscription_pricing (plan_id, billing_cycle, price, currency, discount_percentage, trial_days, setup_fee, is_active)
VALUES
  ('test', 'monthly', 100, 'XOF', 0, 0, 0, true),
  ('test', 'yearly', 100, 'XOF', 0, 0, 0, true)
ON CONFLICT (plan_id, billing_cycle) DO UPDATE
  SET price = EXCLUDED.price,
      currency = EXCLUDED.currency,
      discount_percentage = 0,
      trial_days = 0,
      setup_fee = 0,
      is_active = true,
      updated_at = now();
