-- Événements du monde entier, étape 1 : catalogue et achat par la conciergerie.
--
-- - public.events : événements importés chaque jour de Ticketmaster
--   (sync-events), puis triés et présentés en français par l'agent IA
--   (curate-events : résumé, catégorie, mots-clés, note d'intérêt). La
--   colonne source prévoit les événements vendus par Bossiz+ (étape 2).
-- - site_config 'events_sync' : pays suivis et nombre d'événements par pays ;
--   'event_concierge' : frais de service de l'achat par la conciergerie.
-- - Achat : le client paie le billet (prix Ticketmaster converti en FCFA) et
--   les frais de service ; la réservation (bookings, kind 'event_concierge')
--   attend ensuite l'achat du billet par l'équipe, suivi dans
--   /admin/events. Remboursement intégral si le billet n'est plus disponible.
-- - Tâches pg_cron : sync-events chaque jour à 2 h, curate-events chaque
--   heure (seulement les événements pas encore traités).
--
-- Secrets Supabase à ajouter (Edge Functions > Secrets) :
--   TICKETMASTER_API_KEY (clé « Consumer Key » de developer.ticketmaster.com)
--   ANTHROPIC_API_KEY (agent IA de présentation des événements)
-- Les secrets Vault 'project_url' et 'anon_key' déjà créés sont réutilisés.
--
-- À exécuter dans le SQL Editor.

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('ticketmaster', 'bossiz')),
  external_id TEXT,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name TEXT NOT NULL,
  -- Informations de la source (anglais le plus souvent).
  info TEXT,
  -- Rédigés par l'agent IA (curate-events).
  summary_fr TEXT,
  ai_tags TEXT[] NOT NULL DEFAULT '{}',
  highlight_score INTEGER CHECK (highlight_score IS NULL OR highlight_score BETWEEN 0 AND 100),
  curated_at TIMESTAMPTZ,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('concert', 'sport', 'theatre', 'festival', 'family', 'exhibition', 'other')),
  genre TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled', 'postponed', 'rescheduled', 'offsale')),
  starts_at TIMESTAMPTZ,
  local_date DATE NOT NULL,
  local_time TEXT,
  timezone TEXT,
  venue_name TEXT,
  venue_address TEXT,
  city TEXT,
  country TEXT,
  country_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image_url TEXT,
  -- Prix de la source et converti en FCFA à la synchronisation.
  price_min NUMERIC(12,2),
  price_max NUMERIC(12,2),
  price_currency TEXT,
  price_min_xof NUMERIC(12,0),
  price_max_xof NUMERIC(12,0),
  ticket_url TEXT,
  onsale_start TIMESTAMPTZ,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS events_listing_idx ON public.events (is_published, local_date);
CREATE INDEX IF NOT EXISTS events_country_idx ON public.events (country_code, local_date);
CREATE INDEX IF NOT EXISTS events_curation_idx ON public.events (curated_at) WHERE curated_at IS NULL;

DROP TRIGGER IF EXISTS set_updated_at_events ON public.events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view upcoming published events" ON public.events;
CREATE POLICY "Public can view upcoming published events" ON public.events
  FOR SELECT USING (is_published AND local_date >= current_date - 1);

DROP POLICY IF EXISTS "Admins manage events" ON public.events;
CREATE POLICY "Admins manage events" ON public.events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Une réservation d'événement est rattachée à une ligne services non
-- publique (available = false) : son propriétaire doit pouvoir la lire pour
-- afficher sa réservation (confirmation, historique).
DROP POLICY IF EXISTS "Users can view services of their bookings" ON public.services;
CREATE POLICY "Users can view services of their bookings" ON public.services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.service_id = services.id AND b.user_id = auth.uid())
  );

INSERT INTO public.site_config (config_key, config_value, category, description)
VALUES
  (
    'events_sync',
    '{"countries": ["FR", "GB", "BE", "CH", "ES", "DE", "NL", "IT", "AE", "US", "CA"], "perCountry": 200, "daysAhead": 180}'::jsonb,
    'events',
    'Événements : pays importés de Ticketmaster, nombre par pays et horizon en jours'
  ),
  (
    'event_concierge',
    '{"enabled": true, "feePercent": 15, "minFeeXof": 10000, "maxTickets": 8}'::jsonb,
    'events',
    'Achat de billets par la conciergerie : frais de service (pourcentage, minimum en FCFA) et billets maximum par commande'
  )
ON CONFLICT (config_key) DO NOTHING;

CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  job RECORD;
BEGIN
  FOR job IN SELECT jobid FROM cron.job WHERE jobname IN ('sync-events', 'curate-events') LOOP
    PERFORM cron.unschedule(job.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'sync-events',
    '0 2 * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/sync-events',
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

  PERFORM cron.schedule(
    'curate-events',
    '20 * * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/curate-events',
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
