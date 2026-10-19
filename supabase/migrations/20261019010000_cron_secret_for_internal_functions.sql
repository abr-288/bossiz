-- ============================================================
-- Sécurité : les 4 fonctions déclenchées par pg_cron
-- (auto-approve-partner-applications, release-hotel-payouts,
-- send-subscription-reminders, curate-events) ne vérifiaient pas leur
-- appelant. pg_cron les appelait avec la clé anon, donc n'importe qui
-- pouvait aussi les déclencher depuis l'extérieur (versements,
-- auto-approbation de partenaires, rappels par e-mail, appels payants à
-- l'API Anthropic).
--
-- Les fonctions exigent désormais un secret partagé dans l'en-tête
-- « x-cron-secret » (voir supabase/functions/_shared/cronAuth.ts). Cette
-- migration replanifie les 4 tâches pour qu'elles envoient ce secret,
-- lu dans le Vault.
--
-- ===== AVANT de lancer cette migration (sinon les tâches échoueront) =====
-- 1. Générer une valeur aléatoire, par ex. (PowerShell) :
--      [Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))
-- 2. Dashboard > Edge Functions > Secrets : créer CRON_SECRET = cette valeur,
--    puis redéployer les 4 fonctions.
-- 3. Créer le secret Vault du même nom et de la même valeur, en lançant une
--    fois (en remplaçant la valeur) :
--      SELECT vault.create_secret('COLLER_LA_MEME_VALEUR', 'cron_secret');
-- 4. Lancer cette migration dans le SQL Editor.
-- ============================================================

DO $$
DECLARE
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'Secret Vault "cron_secret" absent. Créez-le d''abord : SELECT vault.create_secret(''<valeur>'', ''cron_secret''); puis le secret de fonction CRON_SECRET de même valeur.';
  END IF;

  -- auto-approve-partner-applications — chaque minute
  PERFORM cron.schedule(
    'auto-approve-partner-applications',
    '* * * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/auto-approve-partner-applications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
          'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
        ),
        body := '{}'::jsonb
      );
    $job$
  );

  -- release-hotel-payouts — chaque heure (minute 10)
  PERFORM cron.schedule(
    'release-hotel-payouts',
    '10 * * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/release-hotel-payouts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
          'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
        ),
        body := '{}'::jsonb
      );
    $job$
  );

  -- send-subscription-reminders — chaque jour à 8 h
  PERFORM cron.schedule(
    'send-subscription-reminders',
    '0 8 * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/send-subscription-reminders',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
          'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
        ),
        body := '{}'::jsonb
      );
    $job$
  );

  -- curate-events — chaque heure (minute 20)
  PERFORM cron.schedule(
    'curate-events',
    '20 * * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/curate-events',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
          'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
      );
    $job$
  );
END;
$$;
