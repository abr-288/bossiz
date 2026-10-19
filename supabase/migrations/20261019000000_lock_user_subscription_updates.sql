-- Sécurité : enforce_user_subscription_status (20260916000001) ne figeait
-- que status et amount_paid. La policy « Users can update own
-- subscriptions » laissait un client modifier tout le reste de sa propre
-- ligne via l'API REST (constaté par scripts/security/rls-pentest.mjs) :
-- - end_date / plan_id sur un abonnement actif : payer un mois de la
--   formule la moins chère, puis passer soi-même en formule supérieure
--   jusqu'en 2099 ;
-- - plan_id / billing_cycle sur une ligne pending après process-payment :
--   le prix est fixé sur l'ancienne formule, mais postPaymentSuccess active
--   la formule et la durée lues dans la ligne au moment du paiement.
--
-- Aucun écran client ne modifie une ligne user_subscriptions : la création
-- (pending) passe par l'INSERT, tout le reste par process-payment et
-- postPaymentSuccess (service-role, auth.uid() IS NULL) ou par un admin.
-- Pour un client normal, une mise à jour ne change donc plus rien.
--
-- À exécuter dans le SQL Editor du Dashboard Supabase.

CREATE OR REPLACE FUNCTION public.enforce_user_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
      NEW.amount_paid := 0;
    ELSE
      RETURN OLD;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
