-- Abonnements clients (user_subscriptions) :
-- 1. Expiration automatique : rien ne faisait passer un abonnement payé en
--    'expired' une fois end_date dépassée, il restait 'active' indéfiniment.
--    Même mécanique que expire_agency_branding_subscriptions (20261008010000).
-- 2. Lecture admin : le back-office liste désormais les abonnements payés.

CREATE OR REPLACE FUNCTION public.expire_user_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND end_date IS NOT NULL
    AND end_date <= now();
END;
$$;

REVOKE ALL ON FUNCTION public.expire_user_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_user_subscriptions() TO service_role;

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'expire-user-subscriptions';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'expire-user-subscriptions',
    '15 * * * *',
    'SELECT public.expire_user_subscriptions();'
  );
END;
$$;

DROP POLICY IF EXISTS "Admins can view all user subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all user subscriptions" ON public.user_subscriptions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
