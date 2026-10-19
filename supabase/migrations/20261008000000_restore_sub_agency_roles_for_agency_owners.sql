-- Agency owners must have the role required to access the BizBossiz dashboard.
-- Repair owners whose role grant previously failed or was never applied.
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT owner_id, 'sub_agency'::public.app_role
FROM public.agencies
ON CONFLICT (user_id, role) DO NOTHING;
