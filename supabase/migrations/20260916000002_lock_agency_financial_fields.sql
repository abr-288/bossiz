-- Sécurité : la policy "Sub-agency owners can update their agency" (UPDATE
-- USING (owner_id = auth.uid())) n'a pas de WITH CHECK, et RLS ne
-- restreint jamais quelles colonnes une ligne autorisée peut modifier. Un
-- propriétaire de sous-agence pouvait donc modifier n'importe quelle
-- colonne de sa propre ligne, y compris commission_rate (utilisé tel quel
-- par postPaymentSuccess.ts pour calculer la commission due sur chaque
-- réservation) et car_plan_id (le palier de car_partner_plans normalement
-- attribué par un admin après validation de partner_applications), ainsi
-- que is_visible/is_active (portes de modération admin).
--
-- Même correctif que enforce_booking_status (20260910210000) et
-- enforce_user_subscription_status : ces colonnes ne peuvent plus être
-- modifiées que par un admin ou un appel service-role (auth.uid() IS
-- NULL) ; le propriétaire garde la main sur les champs de profil (nom,
-- description, logo, contact).

CREATE OR REPLACE FUNCTION public.enforce_agency_protected_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.owner_id := OLD.owner_id;
    NEW.commission_rate := OLD.commission_rate;
    NEW.car_plan_id := OLD.car_plan_id;
    NEW.car_plan_started_at := OLD.car_plan_started_at;
    NEW.is_visible := OLD.is_visible;
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_agency_protected_fields_trigger ON public.agencies;
CREATE TRIGGER enforce_agency_protected_fields_trigger
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_agency_protected_fields();
