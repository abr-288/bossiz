-- Public "Become a partner" self-service application flow.
-- Lightweight/manual approval by design: no privileged edge function, no
-- automatic user/auth account creation. Admin reviews pending rows and,
-- once satisfied, manually creates the real agency + owner role via the
-- existing AdminAgencies.tsx flow, then this row gets marked 'approved'.
--
-- NOTE: could not be applied automatically from this environment - the
-- Supabase CLI is broken for this project (see 20260805000000_drop_majestic_club.sql
-- and 20260805010000_fix_default_role_trigger.sql for the same platform-side
-- permission error). Run this file manually in the Supabase Dashboard SQL Editor.

CREATE TABLE public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Public can submit an application (locked to status='pending' so a client
-- can never insert a pre-approved row directly).
CREATE POLICY "Anyone can submit a partner application"
  ON public.partner_applications FOR INSERT
  WITH CHECK (status = 'pending');

-- Admin-only visibility and review, reusing the existing has_role() pattern.
CREATE POLICY "Admins can view partner applications"
  ON public.partner_applications FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update partner applications"
  ON public.partner_applications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_updated_at_partner_applications
  BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
