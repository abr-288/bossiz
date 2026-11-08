-- ============================================================
-- Sauvegarde automatique de la base, sans mot de passe ni GitHub
--
-- Chaque nuit à 03:30 UTC, pg_cron appelle la fonction backup-database
-- (secret x-cron-secret, comme health-check). Elle exporte toutes les tables
-- du schéma public, plus les comptes (auth.users, auth.identities), dans un
-- fichier compressé du stockage privé « db-backups » :
--   db-backups/bossiz-AAAA-MM-JJ.jsonl.gz
-- Les 14 derniers jours sont gardés. Les admins les téléchargent depuis
-- /admin/monitoring. Restauration : docs/technique/12-sauvegardes.md.
--
-- Prérequis : fonction backup-database déployée, secrets Vault project_url,
-- anon_key et cron_secret (déjà créés).
-- ============================================================

-- Stockage privé (aucun accès public, 200 Mo par fichier au plus).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('db-backups', 'db-backups', false, 209715200, ARRAY['application/gzip'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- Les admins peuvent lister et télécharger ; seule la fonction (service role) écrit.
DROP POLICY IF EXISTS "db-backups admin read" ON storage.objects;
CREATE POLICY "db-backups admin read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'db-backups' AND public.has_role(auth.uid(), 'admin'));

-- Liste des tables à sauvegarder.
CREATE OR REPLACE FUNCTION public.backup_table_list()
RETURNS TABLE (table_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.relname::text
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
   ORDER BY 1;
$$;

-- Une page de lignes d'une table (public, ou auth.users / auth.identities).
-- Ordre par ctid : stable pendant l'export, sans connaître la clé primaire.
CREATE OR REPLACE FUNCTION public.backup_table_page(p_schema text, p_table text, p_offset integer, p_limit integer)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows jsonb;
BEGIN
  IF NOT (
    (p_schema = 'public' AND EXISTS (SELECT 1 FROM public.backup_table_list() t WHERE t.table_name = p_table))
    OR (p_schema = 'auth' AND p_table IN ('users', 'identities'))
  ) THEN
    RAISE EXCEPTION 'Table non sauvegardable : %.%', p_schema, p_table;
  END IF;

  EXECUTE format(
    'SELECT coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) FROM (SELECT * FROM %I.%I ORDER BY ctid OFFSET %s LIMIT %s) t',
    p_schema, p_table, greatest(p_offset, 0), least(greatest(p_limit, 1), 5000)
  ) INTO v_rows;
  RETURN v_rows;
END;
$$;

REVOKE ALL ON FUNCTION public.backup_table_list() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.backup_table_page(text, text, integer, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backup_table_list() TO service_role;
GRANT EXECUTE ON FUNCTION public.backup_table_page(text, text, integer, integer) TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'cron_secret') THEN
    RAISE EXCEPTION 'Secret Vault "cron_secret" absent (voir migration 20261019010000).';
  END IF;

  PERFORM cron.schedule(
    'backup-database',
    '30 3 * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/backup-database',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
          'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 300000
      );
    $job$
  );
END $$;
