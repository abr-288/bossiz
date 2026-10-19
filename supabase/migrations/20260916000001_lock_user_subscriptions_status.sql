-- Sécurité : rien n'empêchait un utilisateur authentifié d'insérer
-- directement sa propre ligne user_subscriptions avec status='active'
-- (valeur par défaut de la colonne) et amount_paid=0 - la policy RLS ne
-- vérifie que auth.uid() = user_id, jamais les valeurs des colonnes. Le
-- trigger update_role_on_new_subscription (AFTER INSERT ... WHEN
-- NEW.status = 'active') octroie alors immédiatement le rôle/niveau associé
-- au plan choisi, sans jamais passer par process-payment.
--
-- Même correctif que enforce_booking_status (20260910210000) : un client
-- normal ne peut plus jamais poser status/amount_paid lui-même, à
-- l'insertion comme à la mise à jour. Seul un appel service-role
-- (postPaymentSuccess.ts, auth.uid() IS NULL) ou un admin peut les faire
-- évoluer.

CREATE OR REPLACE FUNCTION public.enforce_user_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
      NEW.amount_paid := 0;
    ELSE
      NEW.status := OLD.status;
      NEW.amount_paid := OLD.amount_paid;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_user_subscription_status_trigger ON public.user_subscriptions;
CREATE TRIGGER enforce_user_subscription_status_trigger
  BEFORE INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_user_subscription_status();
