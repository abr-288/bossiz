ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS preferred_payout_method TEXT
    CHECK (preferred_payout_method IN ('wave', 'orange_money', 'mtn', 'moov', 'djamo', 'bank'));

ALTER TABLE public.agencies
  ALTER COLUMN commission_rate SET DEFAULT 10;

UPDATE public.car_partner_plans
SET commission_rate = 10,
    features = COALESCE((
      SELECT jsonb_agg(
        CASE
          WHEN feature ILIKE '%commission%'
            THEN to_jsonb('Bossiz conserve 10% ; 90% reviennent au partenaire.'::TEXT)
          ELSE to_jsonb(feature)
        END
      )
      FROM jsonb_array_elements_text(features) AS item(feature)
    ), '[]'::JSONB);

CREATE TABLE IF NOT EXISTS public.agency_payout_details (
  agency_id UUID PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('wave', 'orange_money', 'mtn', 'moov', 'djamo', 'bank')),
  beneficiary_name TEXT,
  mobile_money_number TEXT,
  bank_details JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_payout_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency owners manage their payout details" ON public.agency_payout_details;
CREATE POLICY "Agency owners manage their payout details"
  ON public.agency_payout_details FOR ALL
  USING (public.is_agency_owner(auth.uid(), agency_id))
  WITH CHECK (public.is_agency_owner(auth.uid(), agency_id));

DROP POLICY IF EXISTS "Admins manage agency payout details" ON public.agency_payout_details;
CREATE POLICY "Admins manage agency payout details"
  ON public.agency_payout_details FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS payout_status TEXT NOT NULL DEFAULT 'not_scheduled'
    CHECK (payout_status IN (
      'not_scheduled', 'awaiting_details', 'ready', 'processing',
      'paid', 'failed', 'needs_review'
    )),
  ADD COLUMN IF NOT EXISTS payout_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_reference TEXT,
  ADD COLUMN IF NOT EXISTS payout_provider_id TEXT,
  ADD COLUMN IF NOT EXISTS payout_error TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS commissions_payout_reference_unique
  ON public.commissions(payout_reference)
  WHERE payout_reference IS NOT NULL;

UPDATE public.commissions
SET commission_rate = 90,
    commission_amount = ROUND(booking_amount * 0.90, 2)
WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.claim_agency_payout(p_commission_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.commissions
  SET payout_status = 'processing',
      payout_error = NULL
  WHERE id = p_commission_id
    AND status = 'pending'
    AND payout_status = 'ready';

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_agency_payout(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_agency_payout(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.sync_restaurant_reservation_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
  v_ticket_price NUMERIC;
  v_amount NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' THEN
    SELECT r.agency_id, r.average_ticket_price
      INTO v_agency_id, v_ticket_price
      FROM public.restaurants r
      WHERE r.id = NEW.restaurant_id;

    IF v_ticket_price IS NULL THEN
      RETURN NEW;
    END IF;

    v_amount := v_ticket_price * NEW.party_size;

    INSERT INTO public.commissions (agency_id, source_type, source_id, booking_amount, commission_rate, commission_amount, status)
    VALUES (v_agency_id, 'restaurant_reservation', NEW.id, v_amount, 90, ROUND(v_amount * 0.90, 2), 'pending')
    ON CONFLICT (source_type, source_id) WHERE source_id IS NOT NULL DO UPDATE
      SET booking_amount = EXCLUDED.booking_amount,
          commission_rate = EXCLUDED.commission_rate,
          commission_amount = EXCLUDED.commission_amount,
          updated_at = now()
      WHERE public.commissions.status = 'pending';

  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.commissions
      SET status = 'cancelled', updated_at = now()
      WHERE source_type = 'restaurant_reservation' AND source_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_wellness_booking_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
  v_amount NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' THEN
    SELECT w.agency_id
      INTO v_agency_id
      FROM public.wellness_services w
      WHERE w.id = NEW.wellness_service_id;

    IF NEW.treatment_price IS NULL THEN
      RETURN NEW;
    END IF;

    v_amount := NEW.treatment_price * NEW.party_size;

    INSERT INTO public.commissions (agency_id, source_type, source_id, booking_amount, commission_rate, commission_amount, status)
    VALUES (v_agency_id, 'wellness_booking', NEW.id, v_amount, 90, ROUND(v_amount * 0.90, 2), 'pending')
    ON CONFLICT (source_type, source_id) WHERE source_id IS NOT NULL DO UPDATE
      SET booking_amount = EXCLUDED.booking_amount,
          commission_rate = EXCLUDED.commission_rate,
          commission_amount = EXCLUDED.commission_amount,
          updated_at = now()
      WHERE public.commissions.status = 'pending';

  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.commissions
      SET status = 'cancelled', updated_at = now()
      WHERE source_type = 'wellness_booking' AND source_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_artisan_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
BEGIN
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed') THEN
    SELECT ar.agency_id
      INTO v_agency_id
      FROM public.artisans ar
      WHERE ar.id = NEW.artisan_id;

    INSERT INTO public.commissions (agency_id, source_type, source_id, booking_amount, commission_rate, commission_amount, status)
    VALUES (v_agency_id, 'artisan_order', NEW.id, NEW.total_amount, 90, ROUND(NEW.total_amount * 0.90, 2), 'pending')
    ON CONFLICT (source_type, source_id) WHERE source_id IS NOT NULL DO UPDATE
      SET booking_amount = EXCLUDED.booking_amount,
          commission_rate = EXCLUDED.commission_rate,
          commission_amount = EXCLUDED.commission_amount,
          updated_at = now()
      WHERE public.commissions.status = 'pending';

  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.commissions
      SET status = 'cancelled', updated_at = now()
      WHERE source_type = 'artisan_order' AND source_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
