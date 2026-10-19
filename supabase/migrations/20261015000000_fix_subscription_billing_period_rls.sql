-- Correctif : toute souscription depuis /subscription-payment échouait avec
-- « new row violates row-level security policy for table billing_periods ».
--
-- Le trigger AFTER INSERT auto_create_billing_period_trigger (migration
-- 20250101120005) appelle create_billing_period(), qui insère dans
-- billing_periods et met à jour user_subscriptions.next_billing_date. Ces
-- fonctions s'exécutaient avec les droits du client, or billing_periods a
-- la RLS activée sans aucune policy d'insertion.
--
-- Seule la fonction du trigger passe en SECURITY DEFINER : create_billing_period()
-- (appelée depuis elle) s'exécute alors avec les droits du propriétaire. Une
-- fonction trigger n'est pas appelable en RPC, donc aucun nouvel accès n'est
-- ouvert aux clients.

CREATE OR REPLACE FUNCTION public.auto_create_billing_period()
RETURNS TRIGGER AS $$
BEGIN
    -- Période de facturation initiale de la nouvelle souscription
    PERFORM public.create_billing_period(NEW.id, NEW.start_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
