-- Rappel de renouvellement des abonnements clients.
-- Jèko ne permet pas de prélèvement récurrent : la fonction
-- send-subscription-reminders prévient chaque client 7 jours avant
-- l'échéance. renewal_reminder_sent_at garantit un seul rappel par
-- abonnement, quel que soit le nombre d'appels.

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMPTZ;

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Appel quotidien (8 h UTC). L'URL du projet et la clé publique (anon) sont
-- lues dans Supabase Vault, jamais écrites dans le dépôt. À créer une fois
-- (Dashboard > Project Settings > Vault, ou SQL) :
--   SELECT vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   SELECT vault.create_secret('<clé anon>', 'anon_key');
-- Tant que ces secrets n'existent pas, l'appel échoue sans autre effet.
DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'send-subscription-reminders';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'send-subscription-reminders',
    '0 8 * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/send-subscription-reminders',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
        ),
        body := '{}'::jsonb
      );
    $job$
  );
END;
$$;
