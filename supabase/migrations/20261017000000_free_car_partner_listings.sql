-- Suspension des forfaits voiture payants (Pro, Flotte) : les loueurs
-- publient désormais leurs véhicules gratuitement, sans limite, avec le
-- partage habituel des paiements (90% partenaire, 10% Bossiz).
--
-- 1. enforce_paid_car_partner_listing() n'exige plus de forfait payé ni ne
--    plafonne le nombre de véhicules. Seule règle conservée : un véhicule
--    détaché de son agence est dépublié.
-- 2. prepare_car_partner_subscription() refuse toute nouvelle souscription,
--    donc process-payment ne reçoit plus de forfait voiture à encaisser.
-- 3. Les demandes de forfait encore « pending » (jamais envoyées à Jèko)
--    sont annulées. Les « processing » (paiement en cours chez Jèko) et les
--    forfaits déjà payés ne sont pas touchés.
--
-- Pour réactiver les forfaits payants : réexécuter les deux fonctions de
-- 20261006130000_paid_car_partner_subscriptions.sql et repasser
-- CAR_PLAN_PAYMENTS_ENABLED à true dans src/constants/carPartnerPlans.ts.

CREATE OR REPLACE FUNCTION public.enforce_paid_car_partner_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type::text = 'car'
    AND TG_OP = 'UPDATE'
    AND OLD.agency_id IS NOT NULL
    AND NEW.agency_id IS NULL THEN
    NEW.available := false;
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
BEGIN
  RAISE EXCEPTION 'Les forfaits voiture payants sont suspendus : la publication de véhicules est gratuite'
    USING ERRCODE = '23514';
END;
$$;

UPDATE public.car_partner_subscriptions
SET status = 'cancelled', updated_at = now()
WHERE status = 'pending';
