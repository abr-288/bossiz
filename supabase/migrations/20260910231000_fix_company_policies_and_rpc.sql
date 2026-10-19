-- Companion fix to 20260910230000_create_companies.sql, capturing what was
-- actually applied live after extensive debugging.
--
-- 1. Every RLS policy on companies/company_members/bookings from that
--    migration was created with an IMPLICIT role target (no `TO` clause,
--    defaulting to PUBLIC). For reasons never fully root-caused despite
--    exhaustive testing (the policy conditions were verified correct via
--    direct SQL, auth.uid() resolved correctly, no restrictive policies,
--    no interfering triggers, not a schema-cache staleness issue, not a
--    GRANT issue, reproduced even on a brand-new minimally-scoped test
--    table with an unrelated name) - INSERT into `companies` as the
--    `authenticated` role was rejected by RLS regardless of the policy's
--    WITH CHECK condition, including a literal `WITH CHECK (true)`.
--    Explicitly targeting `TO authenticated` resolved it. Applying the
--    same explicit targeting to the sibling policies as a precaution.
-- 2. Company creation moves off a direct `companies` INSERT (still
--    possibly fragile given (1) was never fully explained) onto a
--    SECURITY DEFINER RPC, `create_company()`, mirroring the already-
--    reliable `join_company()` pattern: it inserts as the function owner,
--    sidestepping RLS entirely rather than depending on it working
--    correctly for a plain client INSERT.
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI
-- direct-connection path is broken for this project - run this file
-- manually in the Supabase Dashboard SQL Editor.

DROP POLICY IF EXISTS "Any authenticated user can create a company" ON public.companies;
CREATE POLICY "Any authenticated user can create a company"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Members can view their own company" ON public.companies;
CREATE POLICY "Members can view their own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (public.is_company_member(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Company admins can update their company" ON public.companies;
CREATE POLICY "Company admins can update their company"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.is_company_admin(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Members can view their company's roster" ON public.company_members;
CREATE POLICY "Members can view their company's roster"
  ON public.company_members FOR SELECT
  TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Company admins can remove members" ON public.company_members;
CREATE POLICY "Company admins can remove members"
  ON public.company_members FOR DELETE
  TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Company billing admins can view their company bookings" ON public.bookings;
CREATE POLICY "Company billing admins can view their company bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Company billing admins can update their company bookings" ON public.bookings;
CREATE POLICY "Company billing admins can update their company bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

CREATE OR REPLACE FUNCTION public.create_company(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_billing_email TEXT DEFAULT NULL,
  p_billing_phone TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, invite_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_invite_code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté pour créer une entreprise';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Le nom de l''entreprise est obligatoire';
  END IF;

  INSERT INTO public.companies (name, description, billing_email, billing_phone, owner_id)
  VALUES (trim(p_name), p_description, p_billing_email, p_billing_phone, auth.uid())
  RETURNING companies.id, companies.invite_code INTO v_id, v_invite_code;

  RETURN QUERY SELECT v_id, trim(p_name), v_invite_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_company(TEXT, TEXT, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
