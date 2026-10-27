-- « Bossiz » (l'entreprise) devient « Conciergerie Bossiz » dans les textes
-- saisis en base, comme dans le code du site. Restent inchangés : Bossiz+,
-- les noms de programmes (Bossiz Impact, Bossiz Smiles, Bossiz Groupe/Group,
-- Bossiz Portal, Bossiz Business), les mots composés (MyBossiz, BizBossiz,
-- BossizHQ), adresses web et e-mails, et « Conciergerie Bossiz » déjà écrit.
-- « Bossiz Conciergerie » devient « Conciergerie Bossiz ».
--
-- Seules les tables de contenu listées ci-dessous sont modifiées ;
-- l'historique (contributions, réservations, paiements) n'est pas touché.
-- Rejouable : un texte déjà renommé n'est plus modifié.

CREATE OR REPLACE FUNCTION pg_temp.rename_bossiz(p TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  t TEXT := p;
BEGIN
  IF t IS NULL OR position('Bossiz' IN t) = 0 THEN
    RETURN t;
  END IF;
  t := regexp_replace(t, '(?<![[:alnum:]_@./+-])Bossiz\s+Concierg(erie|e)\M', 'Conciergerie Bossiz', 'g');
  t := regexp_replace(
    t,
    '(?<![[:alnum:]_@./+-])(?<!Conciergerie )(?<!CONCIERGERIE )Bossiz(?![[:alnum:]_+@-])(?!\.[[:alnum:]])(?!\s+(Impact|Smiles|Groupe|Group|Portal|Business)\M)',
    'Conciergerie Bossiz',
    'g'
  );
  -- « la conciergerie Bossiz » ne devient pas « conciergerie Conciergerie Bossiz ».
  t := regexp_replace(t, '([Cc])onciergerie Conciergerie Bossiz', '\1onciergerie Bossiz', 'g');
  -- Le programme garde son nom.
  t := replace(t, 'Smiles Conciergerie Bossiz', 'Smiles Bossiz');
  RETURN t;
END;
$$;

DO $$
DECLARE
  col RECORD;
  v_rows INTEGER;
BEGIN
  -- Conditions Bossiz Impact : nouvelle version si leur texte change.
  UPDATE public.impact_campaigns
  SET terms = pg_temp.rename_bossiz(terms),
      terms_version = (coalesce(nullif(regexp_replace(terms_version, '\D', '', 'g'), ''), '0')::INT + 1)::TEXT
  WHERE terms IS DISTINCT FROM pg_temp.rename_bossiz(terms);
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows > 0 THEN
    RAISE NOTICE 'Conditions Bossiz Impact : nouvelle version';
  END IF;

  FOR col IN
    SELECT c.table_name, c.column_name, c.data_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name IN (
        'site_config', 'subscription_plans', 'bossiz_sites_config', 'homepage_sections', 'page_sections',
        'testimonials', 'global_settings', 'car_partner_plans', 'impact_eligible_services', 'impact_offers',
        'impact_campaigns'
      )
      AND c.data_type IN ('text', 'character varying', 'jsonb')
      AND c.column_name NOT IN ('slug', 'key', 'config_key', 'setting_key', 'terms', 'terms_version')
  LOOP
    IF col.data_type = 'jsonb' THEN
      EXECUTE format(
        'UPDATE public.%1$I SET %2$I = pg_temp.rename_bossiz(%2$I::text)::jsonb
         WHERE %2$I IS NOT NULL AND %2$I::text <> pg_temp.rename_bossiz(%2$I::text)',
        col.table_name, col.column_name);
    ELSE
      EXECUTE format(
        'UPDATE public.%1$I SET %2$I = pg_temp.rename_bossiz(%2$I)
         WHERE %2$I IS DISTINCT FROM pg_temp.rename_bossiz(%2$I)',
        col.table_name, col.column_name);
    END IF;
  END LOOP;
END;
$$;
