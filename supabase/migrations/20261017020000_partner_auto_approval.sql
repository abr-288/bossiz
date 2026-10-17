-- Validation automatique des candidatures partenaires.
--
-- Le réglage site_config 'partner_applications' ({"autoApprove": bool,
-- "delayMinutes": int, "enabledSince": timestamptz}, modifiable par les
-- admins dans /admin/partner-applications) décide du mode :
-- - activé : la fonction auto-approve-partner-applications, appelée chaque
--   minute, valide toute candidature en attente depuis plus de delayMinutes
--   (compte, agence, rôle sub_agency, emails), reçue après enabledSince :
--   celles arrivées avant l'activation (ou pendant la validation manuelle)
--   restent à valider à la main ;
-- - désactivé : validation manuelle, comme avant.
-- Une candidature n'est tentée qu'une fois (auto_approval_attempted_at) ; en
-- cas d'échec elle reste en attente avec auto_approval_error.
--
-- À exécuter dans le SQL Editor. Les secrets Vault 'project_url' et
-- 'anon_key' (voir 20261015000002_subscription_renewal_reminders.sql) sont
-- réutilisés pour l'appel planifié.

INSERT INTO public.site_config (config_key, config_value, category, description)
VALUES (
  'partner_applications',
  jsonb_build_object('autoApprove', true, 'delayMinutes', 3, 'enabledSince', now()),
  'partners',
  'Validation des candidatures partenaires : activé = validation automatique après delayMinutes'
)
ON CONFLICT (config_key) DO NOTHING;

ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS auto_approval_attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_approval_error TEXT;

-- Un candidat ne peut pas pré-remplir les champs de suivi (bloquer sa propre
-- validation ou se faire passer pour validé automatiquement).
DROP POLICY IF EXISTS "Anyone can submit a partner application" ON public.partner_applications;
CREATE POLICY "Anyone can submit a partner application"
  ON public.partner_applications FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND auto_approval_attempted_at IS NULL
    AND auto_approved_at IS NULL
    AND auto_approval_error IS NULL
  );

CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'auto-approve-partner-applications';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'auto-approve-partner-applications',
    '* * * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/auto-approve-partner-applications',
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
