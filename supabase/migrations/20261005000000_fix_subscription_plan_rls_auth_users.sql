-- Remove legacy admin policies that query auth.users directly.
-- The API roles cannot read auth.users, so PostgreSQL raises SQLSTATE 42501
-- even for a public SELECT on active subscription plans/pricing.
-- Admin management remains covered by the newer has_role()-based policies.
DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can manage pricing" ON public.subscription_pricing;
