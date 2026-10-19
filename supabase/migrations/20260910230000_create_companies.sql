-- Corporate travel (B2B): a company account with employees who book travel
-- normally, and a billing admin who pays centrally from one dashboard
-- instead of employees paying individually and submitting expense receipts.
--
-- Booking creation stays untouched (create-booking already inserts a
-- 'pending'/'pending' row regardless of who pays) - this only adds:
--   1. companies + company_members (self-service: create a company, invite
--      employees by a short code, no admin approval needed - unlike the
--      agencies/sub_agency model, which IS admin-approved),
--   2. bookings.company_id, settable only when the booker is actually a
--      member of that company,
--   3. RLS letting a company's billing admin view/pay bookings billed to
--      their company via the existing /payment page and process-payment
--      function (no new payment code needed - only its booking lookup
--      needed to stop being owner-only).
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI
-- direct-connection path is broken for this project - run this file
-- manually in the Supabase Dashboard SQL Editor.

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  billing_email TEXT,
  billing_phone TEXT,
  invite_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_company_id ON public.bookings(company_id);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id AND role = 'admin'
  )
$$;

DROP POLICY IF EXISTS "Members can view their own company" ON public.companies;
CREATE POLICY "Members can view their own company"
  ON public.companies FOR SELECT
  USING (public.is_company_member(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Any authenticated user can create a company" ON public.companies;
CREATE POLICY "Any authenticated user can create a company"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Company admins can update their company" ON public.companies;
CREATE POLICY "Company admins can update their company"
  ON public.companies FOR UPDATE
  USING (public.is_company_admin(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Members can view their company's roster" ON public.company_members;
CREATE POLICY "Members can view their company's roster"
  ON public.company_members FOR SELECT
  USING (public.is_company_member(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Company admins can remove members" ON public.company_members;
CREATE POLICY "Company admins can remove members"
  ON public.company_members FOR DELETE
  USING (public.is_company_admin(auth.uid(), company_id));

-- No client-facing INSERT policy on company_members: membership rows are
-- only ever created by handle_new_company() (the creator) or join_company()
-- (an invite-code join) below, both SECURITY DEFINER and both bypassing RLS
-- - that's deliberate, not an oversight.

CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_company();

DROP TRIGGER IF EXISTS set_updated_at_companies ON public.companies;
CREATE TRIGGER set_updated_at_companies
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Self-service employee onboarding: no admin approval step, unlike
-- agencies/sub_agency - a company admin just shares their invite code.
CREATE OR REPLACE FUNCTION public.join_company(p_invite_code TEXT)
RETURNS TABLE(company_id UUID, company_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté pour rejoindre une entreprise';
  END IF;

  SELECT id, name INTO v_company
  FROM public.companies
  WHERE invite_code = upper(trim(p_invite_code)) AND is_active = true;

  IF v_company.id IS NULL THEN
    RAISE EXCEPTION 'Code d''invitation invalide';
  END IF;

  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company.id, auth.uid(), 'employee')
  ON CONFLICT (company_id, user_id) DO NOTHING;

  RETURN QUERY SELECT v_company.id, v_company.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_company(TEXT) TO authenticated;

-- Bookings: allow tagging a booking to a company (only one the booker is
-- actually a member of - checked both at INSERT and any later UPDATE, so a
-- booking can't be redirected to bill a stranger company after the fact).
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (company_id IS NULL OR public.is_company_member(auth.uid(), company_id))
  );

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (company_id IS NULL OR public.is_company_member(auth.uid(), company_id))
  );

DROP POLICY IF EXISTS "Company billing admins can view their company bookings" ON public.bookings;
CREATE POLICY "Company billing admins can view their company bookings"
  ON public.bookings FOR SELECT
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Company billing admins can update their company bookings" ON public.bookings;
CREATE POLICY "Company billing admins can update their company bookings"
  ON public.bookings FOR UPDATE
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

-- Refine the booking-status lockdown from 20260910210000_lock_booking_status
-- to actually allow the legitimate pending<->processing claim/revert dance
-- process-payment performs, for either the booking's own owner or (new)
-- that booking's company billing admin. The previous version blocked ALL
-- non-admin status/payment_status changes outright - harmlessly, since
-- process-payment's WHERE clause still matched and returned success, but it
-- silently defeated the double-payment lock for every individual customer's
-- own legitimate payment, not just for company billing. This also gives a
-- company admin the same pending<->processing ability so they can pay a
-- teammate's booking via the exact same /payment flow, unmodified.
CREATE OR REPLACE FUNCTION public.enforce_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.payment_status := 'pending';
    RETURN NEW;
  END IF;

  IF (auth.uid() = OLD.user_id OR (OLD.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), OLD.company_id)))
     AND OLD.status = NEW.status
     AND ((OLD.payment_status = 'pending' AND NEW.payment_status = 'processing')
          OR (OLD.payment_status = 'processing' AND NEW.payment_status = 'pending')) THEN
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.payment_status := OLD.payment_status;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
