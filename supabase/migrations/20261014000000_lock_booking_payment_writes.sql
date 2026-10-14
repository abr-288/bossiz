-- Sécurité : RLS dit QUELLES lignes un utilisateur peut écrire, jamais
-- QUELLES colonnes. enforce_booking_status (20260910210000, puis
-- 20260910230000) ne protégeait que status/payment_status. Restaient
-- modifiables directement via l'API REST, par le client sur sa propre
-- réservation :
-- - total_price / amount_due_now / currency : process-payment facture
--   amount_due_now || total_price, et payment-callback compare le montant
--   payé à ces mêmes colonnes. Un client pouvait passer sa réservation à
--   100 XOF, payer 100 XOF, et la réservation était confirmée ;
-- - booking_details : create-pnr envoie booking_details.flightOffers à
--   Amadeus, donc un client pouvait changer de vol après avoir payé ;
-- - approval_status : un salarié pouvait approuver lui-même sa réservation
--   payée par son entreprise ;
-- - external_ref, supplier_cost, service_id, dates, company_id…
-- Et l'INSERT direct (policy "Users can create own bookings") contournait
-- complètement le recalcul du prix fait par create-booking.
--
-- NOTE : comme les migrations récentes, à exécuter dans le SQL Editor du
-- Dashboard Supabase. Déployer en même temps les Edge Functions
-- create-booking et process-payment, qui écrivent désormais avec la clé
-- service-role.

-- ------------------------------------------------------------
-- 1. bookings : liste blanche de colonnes pour les non-admins
-- ------------------------------------------------------------
-- Les appels service-role (auth.uid() IS NULL) et les admins gardent la
-- main. Pour tous les autres, chaque colonne reprend sa valeur stockée,
-- sauf :
-- - le titulaire : coordonnées de contact et notes ;
-- - le titulaire ou l'admin facturation de l'entreprise : l'aller-retour
--   payment_status pending <-> processing de process-payment ;
-- - un approbateur de l'entreprise : la décision d'approbation, avec
--   approved_by / approved_at forcés à lui-même / maintenant.
-- Une nouvelle colonne est donc protégée par défaut.
CREATE OR REPLACE FUNCTION public.enforce_booking_status()
RETURNS TRIGGER AS $$
DECLARE
  _uid UUID := auth.uid();
  _req public.bookings%ROWTYPE;
  _is_owner BOOLEAN;
  _can_pay BOOLEAN;
  _is_approver BOOLEAN;
BEGIN
  IF _uid IS NULL OR public.has_role(_uid, 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Les réservations se créent via la fonction create-booking'
      USING ERRCODE = '42501';
  END IF;

  _is_owner := _uid = OLD.user_id;
  _can_pay := _is_owner
    OR (OLD.company_id IS NOT NULL AND public.is_company_admin(_uid, OLD.company_id));
  _is_approver := OLD.company_id IS NOT NULL AND public.is_company_approver(_uid, OLD.company_id);

  _req := NEW;
  NEW := OLD;
  NEW.updated_at := _req.updated_at;

  IF _is_owner THEN
    NEW.customer_name := _req.customer_name;
    NEW.customer_email := _req.customer_email;
    NEW.customer_phone := _req.customer_phone;
    NEW.notes := _req.notes;
  END IF;

  IF _can_pay
     AND _req.status = OLD.status
     AND ((OLD.payment_status = 'pending' AND _req.payment_status = 'processing')
          OR (OLD.payment_status = 'processing' AND _req.payment_status = 'pending')) THEN
    NEW.payment_status := _req.payment_status;
  END IF;

  IF _is_approver
     AND _req.approval_status IN ('approved', 'rejected')
     AND _req.approval_status IS DISTINCT FROM OLD.approval_status THEN
    NEW.approval_status := _req.approval_status;
    NEW.approved_by := _uid;
    NEW.approved_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_booking_status_trigger ON public.bookings;
CREATE TRIGGER enforce_booking_status_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_status();

-- create-booking insère en service-role : plus de policy INSERT client (le
-- trigger ci-dessus refuse de toute façon un INSERT non admin, au cas où
-- une autre policy INSERT existerait en production).
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;

-- ------------------------------------------------------------
-- 2. passengers : figés une fois le paiement engagé
-- ------------------------------------------------------------
-- Les passagers partent chez Amadeus (create-pnr) juste après le paiement
-- et sont imprimés sur le billet (generate-flight-ticket). Les modifier
-- ensuite produirait un billet dont les noms ne correspondent pas au PNR.
CREATE OR REPLACE FUNCTION public.enforce_passenger_lock()
RETURNS TRIGGER AS $$
DECLARE
  _booking_ids UUID[];
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    _booking_ids := CASE TG_OP
      WHEN 'INSERT' THEN ARRAY[NEW.booking_id]
      WHEN 'DELETE' THEN ARRAY[OLD.booking_id]
      ELSE ARRAY[OLD.booking_id, NEW.booking_id]
    END;

    IF EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = ANY(_booking_ids)
        AND b.payment_status <> 'pending'
    ) THEN
      RAISE EXCEPTION 'Passagers non modifiables une fois le paiement engagé'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_passenger_lock_trigger ON public.passengers;
CREATE TRIGGER enforce_passenger_lock_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.passengers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_passenger_lock();

-- ------------------------------------------------------------
-- 3. payments : plus d'INSERT côté client
-- ------------------------------------------------------------
-- Un client pouvait insérer une ligne payments status='completed' avec
-- n'importe quel montant / transaction_id. payment-callback (idempotence),
-- agencyPayouts (paiement Jèko « completed ») et cinetpayRefund lisent ces
-- lignes. Seul process-payment en crée, désormais en service-role.
DROP POLICY IF EXISTS "Users can create their own payments" ON public.payments;

-- ------------------------------------------------------------
-- 4. subscription_requests : formulaire public, statut imposé
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create subscription requests" ON public.subscription_requests;
CREATE POLICY "Anyone can create subscription requests"
  ON public.subscription_requests
  FOR INSERT
  WITH CHECK (status = 'pending' AND notes IS NULL);

-- ------------------------------------------------------------
-- Vérification après exécution (la base en production a reçu des
-- migrations à la main : des policies absentes de ce dossier peuvent y
-- exister). Toute policy INSERT/UPDATE/ALL restante pour des non-admins sur
-- ces tables est à examiner :
--
-- SELECT tablename, policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('bookings', 'passengers', 'payments', 'invoices',
--                     'commissions', 'subscription_requests', 'user_roles')
-- ORDER BY tablename, cmd;
-- ------------------------------------------------------------
