-- Business Travel: approval workflow + travel policy compliance.
--
-- Extends the corporate-billing feature (companies/company_members) with
-- what a real business-travel program needs on top of "someone pays
-- centrally": a configurable spending policy per service type, a
-- traveler -> approver -> paid workflow (instead of any company member
-- instantly billing the company), and a distinct 'approver' role separate
-- from 'admin' (the DAF/finance role that actually pays).
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI
-- direct-connection path is broken for this project - run this file
-- manually in the Supabase Dashboard SQL Editor.

-- 1) Roles: add 'approver' alongside the existing 'admin'/'employee'.
ALTER TABLE public.company_members DROP CONSTRAINT IF EXISTS company_members_role_check;
ALTER TABLE public.company_members ADD CONSTRAINT company_members_role_check
  CHECK (role IN ('admin', 'approver', 'employee'));

CREATE OR REPLACE FUNCTION public.is_company_approver(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id AND role IN ('admin', 'approver')
  )
$$;

-- 2) Travel policy: a per-company, per-service-type spending cap used to
-- show a "conforme / hors politique" badge at booking time. Informative
-- only (not a hard block) - matches the brief. requires_approval is always
-- effectively true today (every company-billed booking needs one - see
-- below); the column exists so a future "auto-approve small/in-policy
-- spend" relaxation doesn't need a new migration.
CREATE TABLE IF NOT EXISTS public.travel_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  max_amount NUMERIC NOT NULL CHECK (max_amount > 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, service_type)
);

ALTER TABLE public.travel_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view their travel policy" ON public.travel_policies;
CREATE POLICY "Company members can view their travel policy"
  ON public.travel_policies FOR SELECT
  TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "Company admins manage their travel policy" ON public.travel_policies;
CREATE POLICY "Company admins manage their travel policy"
  ON public.travel_policies FOR ALL
  TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP TRIGGER IF EXISTS set_updated_at_travel_policies ON public.travel_policies;
CREATE TRIGGER set_updated_at_travel_policies
  BEFORE UPDATE ON public.travel_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3) Approval workflow on bookings: a company-billed booking now starts
-- 'pending_approval' instead of being immediately payable. Only an
-- approver/admin for that company can move it to 'approved'/'rejected';
-- only once 'approved' can the DAF (admin) actually pay it (enforced in
-- process-payment, not here - see the edge function update).
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS approval_status TEXT
  CHECK (approval_status IN ('pending_approval', 'approved', 'rejected'));
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_approval_status ON public.bookings(approval_status) WHERE approval_status IS NOT NULL;

-- Approvers (and admins) can see every company-billed booking, not just
-- ones already resolved - broadens the previous admin-only visibility so
-- an approver can actually review what's pending.
DROP POLICY IF EXISTS "Company billing admins can view their company bookings" ON public.bookings;
DROP POLICY IF EXISTS "Company approvers can view their company bookings" ON public.bookings;
CREATE POLICY "Company approvers can view their company bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_approver(auth.uid(), company_id));

-- Approvers can set approval_status/approved_by/approved_at; nothing else
-- privileged changes here - status/payment_status stay guarded by the
-- enforce_booking_status trigger regardless of this policy existing.
-- Supersedes (and replaces) the admin-only UPDATE policy from
-- 20260910231000, since is_company_approver() already includes admins.
DROP POLICY IF EXISTS "Company billing admins can update their company bookings" ON public.bookings;
DROP POLICY IF EXISTS "Company approvers can review their company bookings" ON public.bookings;
CREATE POLICY "Company approvers can review their company bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_approver(auth.uid(), company_id));

-- Grandfather every company-billed booking created before this migration
-- (there was no approval concept yet) as already approved, so nothing
-- already sitting in a company dashboard gets stuck unpayable.
UPDATE public.bookings SET approval_status = 'approved' WHERE company_id IS NOT NULL AND approval_status IS NULL;
