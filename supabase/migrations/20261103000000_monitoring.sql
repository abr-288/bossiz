-- ============================================================
-- Monitoring : journal des erreurs + contrôle de santé toutes les 5 minutes
--
-- 1. app_errors : erreurs JavaScript remontées par le site et l'application
--    mobile (une ligne par erreur distincte, avec un compteur d'occurrences).
--    Écriture uniquement via log_client_error() ; lecture admin seulement.
-- 2. health_checks : résultat de chaque passage de la fonction health-check
--    (site en ligne, mises à jour de l'app, base, tâches cron, erreurs).
-- 3. pg_cron appelle health-check toutes les 5 minutes avec le secret
--    x-cron-secret (même mécanisme que 20261019010000). La fonction envoie un
--    e-mail (et un SMS si MONITORING_ALERT_PHONE est défini) quand le site
--    tombe, quand il revient, et quand de nouvelles erreurs apparaissent.
--
-- Prérequis : secrets Vault project_url, anon_key, cron_secret (déjà créés).
-- Déployer la fonction health-check AVANT de lancer cette migration.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_errors (
  id bigserial PRIMARY KEY,
  fingerprint text NOT NULL UNIQUE,
  source text NOT NULL CHECK (source IN ('web', 'app', 'function')),
  message text NOT NULL,
  stack text,
  url text,
  release text,
  user_agent text,
  last_user_id uuid,
  occurrences integer NOT NULL DEFAULT 1,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  alerted_at timestamptz
);

CREATE INDEX IF NOT EXISTS app_errors_open_idx ON public.app_errors (last_seen DESC) WHERE resolved_at IS NULL;

ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_errors admin read" ON public.app_errors;
CREATE POLICY "app_errors admin read" ON public.app_errors
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "app_errors admin update" ON public.app_errors;
CREATE POLICY "app_errors admin update" ON public.app_errors
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "app_errors admin delete" ON public.app_errors;
CREATE POLICY "app_errors admin delete" ON public.app_errors
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enregistre une erreur. Appelable sans compte (les erreurs arrivent aussi
-- avant connexion). Garde-fous : textes tronqués, et au plus 300 nouvelles
-- erreurs distinctes par heure pour qu'un tiers ne puisse pas remplir la table.
CREATE OR REPLACE FUNCTION public.log_client_error(
  p_source text,
  p_message text,
  p_stack text DEFAULT NULL,
  p_url text DEFAULT NULL,
  p_release text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source text := CASE WHEN p_source IN ('web', 'app', 'function') THEN p_source ELSE 'web' END;
  v_message text := left(coalesce(nullif(btrim(p_message), ''), 'Erreur inconnue'), 1000);
  v_stack text := left(p_stack, 4000);
  v_top text;
  v_fp text;
BEGIN
  -- Première ligne de pile qui pointe vers du code (sans numéros de colonne,
  -- pour regrouper la même erreur entre deux builds).
  v_top := (regexp_match(coalesce(v_stack, ''), '(/assets/[A-Za-z0-9_-]+?)(-[A-Za-z0-9_]{6,})?\.js'))[1];
  -- Les nombres variables (ids, durées) ne doivent pas créer des erreurs distinctes.
  v_fp := md5(v_source || '|' || regexp_replace(v_message, '[0-9]+', 'N', 'g') || '|' || coalesce(v_top, ''));

  UPDATE public.app_errors
     SET occurrences = least(occurrences + 1, 1000000000),
         last_seen = now(),
         url = coalesce(left(p_url, 500), url),
         release = coalesce(left(p_release, 60), release),
         user_agent = coalesce(left(p_user_agent, 300), user_agent),
         last_user_id = coalesce(auth.uid(), last_user_id),
         stack = coalesce(v_stack, stack),
         -- Une erreur marquée résolue qui revient est rouverte et re-signalée.
         alerted_at = CASE WHEN resolved_at IS NOT NULL THEN NULL ELSE alerted_at END,
         resolved_at = NULL
   WHERE fingerprint = v_fp;

  IF FOUND THEN
    RETURN;
  END IF;

  IF (SELECT count(*) FROM public.app_errors WHERE first_seen > now() - interval '1 hour') >= 300 THEN
    RETURN;
  END IF;

  INSERT INTO public.app_errors (fingerprint, source, message, stack, url, release, user_agent, last_user_id)
  VALUES (v_fp, v_source, v_message, v_stack, left(p_url, 500), left(p_release, 60), left(p_user_agent, 300), auth.uid())
  ON CONFLICT (fingerprint) DO UPDATE SET occurrences = public.app_errors.occurrences + 1, last_seen = now();
END;
$$;

REVOKE ALL ON FUNCTION public.log_client_error(text, text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.log_client_error(text, text, text, text, text, text) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.health_checks (
  id bigserial PRIMARY KEY,
  checked_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  alert_sent text
);

CREATE INDEX IF NOT EXISTS health_checks_checked_at_idx ON public.health_checks (checked_at DESC);

ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "health_checks admin read" ON public.health_checks;
CREATE POLICY "health_checks admin read" ON public.health_checks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Tâches pg_cron en échec depuis p_since (le schéma cron n'est pas exposé
-- à l'API) : lu par health-check avec la clé service-role uniquement.
CREATE OR REPLACE FUNCTION public.monitoring_cron_failures(p_since timestamptz)
RETURNS TABLE (jobname text, failures bigint, last_message text, last_failure timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT j.jobname::text,
         count(*) AS failures,
         left((array_agg(d.return_message ORDER BY d.start_time DESC))[1], 300) AS last_message,
         max(d.start_time) AS last_failure
    FROM cron.job_run_details d
    JOIN cron.job j ON j.jobid = d.jobid
   WHERE d.start_time >= p_since
     AND d.status = 'failed'
   GROUP BY j.jobname;
$$;

REVOKE ALL ON FUNCTION public.monitoring_cron_failures(timestamptz) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monitoring_cron_failures(timestamptz) TO service_role;

-- Appels HTTP des tâches cron (net.http_post) qui ont échoué ou renvoyé une
-- erreur : c'est là que se voient les fonctions planifiées en panne.
CREATE OR REPLACE FUNCTION public.monitoring_http_failures(p_since timestamptz)
RETURNS TABLE (status_code integer, error_msg text, failures bigint, last_failure timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, net
AS $$
  SELECT r.status_code,
         left(coalesce(r.error_msg, left(r.content::text, 200)), 300) AS error_msg,
         count(*) AS failures,
         max(r.created) AS last_failure
    FROM net._http_response r
   WHERE r.created >= p_since
     AND (r.status_code IS NULL OR r.status_code >= 500 OR r.timed_out)
   GROUP BY 1, 2;
$$;

REVOKE ALL ON FUNCTION public.monitoring_http_failures(timestamptz) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monitoring_http_failures(timestamptz) TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'cron_secret') THEN
    RAISE EXCEPTION 'Secret Vault "cron_secret" absent (voir migration 20261019010000).';
  END IF;

  PERFORM cron.schedule(
    'health-check',
    '*/5 * * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/health-check',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
          'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      );
    $job$
  );
END $$;
