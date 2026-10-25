-- Notation des services opérationnelle pour toutes les activités.
--
-- Avant : seuls les hôtels, voitures et circuits (public.services)
-- pouvaient être notés, dès le paiement (avant même la prestation) ; les
-- restaurants, le bien-être, l'artisanat, les activités et les séjours
-- affichaient une note que rien ne remplissait.
--
-- 1. Un avis porte sur une cible (target_type / target_id : service,
--    restaurant, wellness, artisan, activity, stay) et une prestation
--    (source_type / source_id) : un seul avis par prestation.
-- 2. On ne note qu'après la prestation réellement effectuée (date passée,
--    non annulée, non-présentation exclue), via submit_review() :
--    l'insertion directe par les clients est supprimée.
-- 3. La note et le nombre d'avis de chaque fiche sont recalculés à partir
--    des avis publiés uniquement (trigger refresh_review_target).
-- 4. public_reviews() / public_review_summary() : avis publiés et réponse
--    du partenaire, lisibles par tous.
-- 5. Espace partenaire : agency_reviews() / agency_reply_review() couvrent
--    toutes les activités.
-- 6. Invitation par e-mail après la prestation (send-review-invitations,
--    chaque jour à 10 h).
--
-- Prérequis : 20261025000000_partner_portal_by_category.sql.
-- À exécuter dans le SQL Editor AVANT de déployer create-booking,
-- send-review-invitations et le site.

-- ---------------------------------------------------------------------------
-- 1. Cible et prestation de chaque avis
-- ---------------------------------------------------------------------------
ALTER TABLE public.reviews
  ALTER COLUMN service_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'service',
  ADD COLUMN IF NOT EXISTS target_id UUID,
  ADD COLUMN IF NOT EXISTS target_name TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_id UUID;

UPDATE public.reviews SET target_id = service_id WHERE target_id IS NULL AND service_id IS NOT NULL;
UPDATE public.reviews r SET target_name = s.name
FROM public.services s
WHERE s.id = r.service_id AND r.target_name IS NULL;
UPDATE public.reviews SET source_type = 'booking', source_id = booking_id
WHERE booking_id IS NOT NULL AND source_id IS NULL;

ALTER TABLE public.reviews ALTER COLUMN target_id SET NOT NULL;

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_target_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_target_type_check
  CHECK (target_type IN ('service', 'restaurant', 'wellness', 'artisan', 'activity', 'stay'));
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_source_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_source_type_check
  CHECK (source_type IS NULL OR source_type IN ('booking', 'restaurant_reservation', 'wellness_booking', 'artisan_order'));
-- service_id reste renseigné pour un service (compatibilité avec le code
-- existant : témoignages, administration).
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_service_target_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_service_target_check
  CHECK (target_type <> 'service' OR service_id = target_id);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_source_idx
  ON public.reviews (source_type, source_id)
  WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reviews_target_idx ON public.reviews (target_type, target_id, status);

-- ---------------------------------------------------------------------------
-- 2. Note de chaque fiche = moyenne des avis publiés
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_review_target(_type TEXT, _id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg NUMERIC;
  v_count INTEGER;
BEGIN
  IF _id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(round(avg(rating)::numeric, 1), 0), count(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE target_type = _type AND target_id = _id AND status = 'approved';

  CASE _type
    WHEN 'service' THEN UPDATE public.services SET rating = v_avg, total_reviews = v_count WHERE id = _id;
    WHEN 'restaurant' THEN UPDATE public.restaurants SET rating = v_avg, total_reviews = v_count WHERE id = _id;
    WHEN 'wellness' THEN UPDATE public.wellness_services SET rating = v_avg, total_reviews = v_count WHERE id = _id;
    WHEN 'artisan' THEN UPDATE public.artisans SET rating = v_avg, total_reviews = v_count WHERE id = _id;
    -- Activités et séjours : le nombre d'avis est la colonne « reviews ».
    WHEN 'activity' THEN UPDATE public.activities SET rating = v_avg, reviews = v_count WHERE id = _id;
    WHEN 'stay' THEN UPDATE public.stays SET rating = v_avg, reviews = v_count WHERE id = _id;
    ELSE NULL;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_review_target(TEXT, UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_review_targets_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.refresh_review_target(NEW.target_type, NEW.target_id);
  END IF;
  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND (OLD.target_type, OLD.target_id) IS DISTINCT FROM (NEW.target_type, NEW.target_id)) THEN
    PERFORM public.refresh_review_target(OLD.target_type, OLD.target_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Remplace les triggers de 20251028000412 (services uniquement).
DROP TRIGGER IF EXISTS update_rating_on_review_insert ON public.reviews;
DROP TRIGGER IF EXISTS update_rating_on_review_update ON public.reviews;
DROP TRIGGER IF EXISTS update_rating_on_review_delete ON public.reviews;
DROP TRIGGER IF EXISTS refresh_review_targets ON public.reviews;
CREATE TRIGGER refresh_review_targets
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_review_targets_trigger();

-- Recalcul de toutes les fiches : une note sans avis publié repasse à 0
-- (les écrans n'affichent une note qu'à partir d'un avis).
WITH agg AS (
  SELECT target_type, target_id, round(avg(rating)::numeric, 1) AS avg_rating, count(*)::int AS n
  FROM public.reviews
  WHERE status = 'approved'
  GROUP BY target_type, target_id
)
UPDATE public.services x SET rating = COALESCE(agg.avg_rating, 0), total_reviews = COALESCE(agg.n, 0)
FROM public.services x2
LEFT JOIN agg ON agg.target_type = 'service' AND agg.target_id = x2.id
WHERE x.id = x2.id;

WITH agg AS (
  SELECT target_id, round(avg(rating)::numeric, 1) AS avg_rating, count(*)::int AS n
  FROM public.reviews WHERE status = 'approved' AND target_type = 'restaurant' GROUP BY target_id
)
UPDATE public.restaurants x SET rating = COALESCE(agg.avg_rating, 0), total_reviews = COALESCE(agg.n, 0)
FROM public.restaurants x2 LEFT JOIN agg ON agg.target_id = x2.id
WHERE x.id = x2.id;

WITH agg AS (
  SELECT target_id, round(avg(rating)::numeric, 1) AS avg_rating, count(*)::int AS n
  FROM public.reviews WHERE status = 'approved' AND target_type = 'wellness' GROUP BY target_id
)
UPDATE public.wellness_services x SET rating = COALESCE(agg.avg_rating, 0), total_reviews = COALESCE(agg.n, 0)
FROM public.wellness_services x2 LEFT JOIN agg ON agg.target_id = x2.id
WHERE x.id = x2.id;

WITH agg AS (
  SELECT target_id, round(avg(rating)::numeric, 1) AS avg_rating, count(*)::int AS n
  FROM public.reviews WHERE status = 'approved' AND target_type = 'artisan' GROUP BY target_id
)
UPDATE public.artisans x SET rating = COALESCE(agg.avg_rating, 0), total_reviews = COALESCE(agg.n, 0)
FROM public.artisans x2 LEFT JOIN agg ON agg.target_id = x2.id
WHERE x.id = x2.id;

WITH agg AS (
  SELECT target_id, round(avg(rating)::numeric, 1) AS avg_rating, count(*)::int AS n
  FROM public.reviews WHERE status = 'approved' AND target_type = 'activity' GROUP BY target_id
)
UPDATE public.activities x SET rating = COALESCE(agg.avg_rating, 0), reviews = COALESCE(agg.n, 0)
FROM public.activities x2 LEFT JOIN agg ON agg.target_id = x2.id
WHERE x.id = x2.id;

WITH agg AS (
  SELECT target_id, round(avg(rating)::numeric, 1) AS avg_rating, count(*)::int AS n
  FROM public.reviews WHERE status = 'approved' AND target_type = 'stay' GROUP BY target_id
)
UPDATE public.stays x SET rating = COALESCE(agg.avg_rating, 0), reviews = COALESCE(agg.n, 0)
FROM public.stays x2 LEFT JOIN agg ON agg.target_id = x2.id
WHERE x.id = x2.id;

-- ---------------------------------------------------------------------------
-- 3. Prestations notables : effectuées, non annulées, sans avis
-- ---------------------------------------------------------------------------
-- Usage interne (définisseur) : _user_id NULL = tous les clients, pour les
-- invitations ; sinon un seul client.
CREATE OR REPLACE FUNCTION public.reviewable_items(_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  source_type TEXT,
  source_id UUID,
  target_type TEXT,
  target_id UUID,
  title TEXT,
  service_at TIMESTAMP,
  customer_name TEXT,
  customer_email TEXT,
  reviewed BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH local_now AS (SELECT (now() AT TIME ZONE 'Africa/Abidjan') AS ts),
  items AS (
    -- Réservations payées (hôtels, voitures, circuits, activités, séjours) :
    -- notables après la date de fin. Une activité ou un séjour réservé
    -- depuis le catalogue est noté sur sa fiche (booking_details.catalogRef).
    SELECT
      b.user_id,
      'booking'::text AS source_type,
      b.id AS source_id,
      CASE WHEN b.booking_details #>> '{catalogRef,type}' IN ('activity', 'stay')
        THEN b.booking_details #>> '{catalogRef,type}' ELSE 'service' END AS target_type,
      CASE WHEN b.booking_details #>> '{catalogRef,type}' IN ('activity', 'stay')
        THEN (b.booking_details #>> '{catalogRef,id}')::uuid ELSE b.service_id END AS target_id,
      s.name AS title,
      COALESCE(b.end_date, b.start_date)::timestamp AS service_at,
      b.customer_name,
      b.customer_email
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    WHERE b.user_id IS NOT NULL
      AND (_user_id IS NULL OR b.user_id = _user_id)
      AND b.payment_status::text IN ('paid', 'partially_paid')
      AND (
        b.status = 'completed'
        OR (b.status = 'confirmed' AND COALESCE(b.end_date, b.start_date)::date <= (SELECT ts FROM local_now)::date)
      )
      AND NOT COALESCE((b.booking_details->>'noShow')::boolean, false)
    UNION ALL
    -- Séjours partenaires payés sur place : notables après le départ.
    SELECT
      b.user_id, 'booking', b.id, 'service', b.service_id, s.name,
      b.end_date::timestamp, b.customer_name, b.customer_email
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    WHERE b.user_id IS NOT NULL
      AND (_user_id IS NULL OR b.user_id = _user_id)
      AND b.booking_details->>'kind' = 'partner_hotel'
      AND COALESCE((b.booking_details->>'payAtProperty')::boolean, false)
      AND b.payment_status::text NOT IN ('paid', 'partially_paid', 'refunded')
      AND b.status IN ('confirmed', 'completed')
      AND b.end_date <= (SELECT ts FROM local_now)::date
      AND NOT COALESCE((b.booking_details->>'noShow')::boolean, false)
    UNION ALL
    SELECT
      rr.user_id, 'restaurant_reservation', rr.id, 'restaurant', rr.restaurant_id, r.name,
      (rr.reservation_date + rr.reservation_time)::timestamp, rr.customer_name, rr.customer_email
    FROM public.restaurant_reservations rr
    JOIN public.restaurants r ON r.id = rr.restaurant_id
    WHERE rr.user_id IS NOT NULL
      AND (_user_id IS NULL OR rr.user_id = _user_id)
      AND rr.status IN ('confirmed', 'completed')
      AND (rr.reservation_date + rr.reservation_time)::timestamp <= (SELECT ts FROM local_now)
    UNION ALL
    SELECT
      wb.user_id, 'wellness_booking', wb.id, 'wellness', wb.wellness_service_id,
      COALESCE(w.name || ' - ' || wb.treatment_name, wb.treatment_name),
      (wb.booking_date + wb.booking_time)::timestamp, wb.customer_name, wb.customer_email
    FROM public.wellness_bookings wb
    JOIN public.wellness_services w ON w.id = wb.wellness_service_id
    WHERE wb.user_id IS NOT NULL
      AND (_user_id IS NULL OR wb.user_id = _user_id)
      AND wb.status IN ('confirmed', 'completed')
      AND (wb.booking_date + wb.booking_time)::timestamp <= (SELECT ts FROM local_now)
    UNION ALL
    -- Commande artisan : livrée (completed), ou confirmée depuis 3 jours.
    SELECT
      ao.user_id, 'artisan_order', ao.id, 'artisan', ao.artisan_id,
      COALESCE(ar.name || ' - ' || ao.product_name, ao.product_name),
      (ao.updated_at AT TIME ZONE 'Africa/Abidjan'), ao.customer_name, ao.customer_email
    FROM public.artisan_orders ao
    JOIN public.artisans ar ON ar.id = ao.artisan_id
    WHERE ao.user_id IS NOT NULL
      AND (_user_id IS NULL OR ao.user_id = _user_id)
      AND (ao.status = 'completed' OR (ao.status = 'confirmed' AND ao.updated_at <= now() - interval '3 days'))
  )
  SELECT
    i.user_id, i.source_type, i.source_id, i.target_type, i.target_id, i.title, i.service_at,
    i.customer_name, i.customer_email,
    EXISTS (
      SELECT 1 FROM public.reviews rv
      WHERE (rv.source_type = i.source_type AND rv.source_id = i.source_id)
         OR (i.source_type = 'booking' AND rv.booking_id = i.source_id)
    ) AS reviewed
  FROM items i
  WHERE i.target_id IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.reviewable_items(UUID) FROM PUBLIC, anon, authenticated;

-- Invitation à noter activée (Admin > Configuration, politique de paiement).
CREATE OR REPLACE FUNCTION public.review_prompt_enabled()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (config_value->>'reviewPromptEnabled')::boolean FROM public.site_config WHERE config_key = 'booking_payment_policy'),
    true
  );
$$;

GRANT EXECUTE ON FUNCTION public.review_prompt_enabled() TO anon, authenticated;

-- Prestations du client connecté pouvant être notées (et celles déjà notées).
CREATE OR REPLACE FUNCTION public.my_reviewable_items()
RETURNS TABLE (
  source_type TEXT,
  source_id UUID,
  target_type TEXT,
  target_id UUID,
  title TEXT,
  service_at TIMESTAMP,
  reviewed BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.source_type, i.source_id, i.target_type, i.target_id, i.title, i.service_at, i.reviewed
  FROM public.reviewable_items(auth.uid()) i
  WHERE auth.uid() IS NOT NULL
  ORDER BY i.reviewed, i.service_at DESC;
$$;

REVOKE ALL ON FUNCTION public.my_reviewable_items() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_reviewable_items() TO authenticated;

-- Nom affiché publiquement : prénom + initiale (« Awa K. »).
CREATE OR REPLACE FUNCTION public.review_display_name(_full_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN NULLIF(btrim(_full_name), '') IS NULL THEN NULL
    WHEN split_part(btrim(_full_name), ' ', 2) = '' THEN split_part(btrim(_full_name), ' ', 1)
    ELSE split_part(btrim(_full_name), ' ', 1) || ' ' || upper(left(split_part(btrim(_full_name), ' ', 2), 1)) || '.'
  END;
$$;

CREATE OR REPLACE FUNCTION public.submit_review(p_source_type TEXT, p_source_id UUID, p_rating INTEGER, p_comment TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_name TEXT;
  v_id UUID;
  v_comment TEXT := NULLIF(btrim(p_comment), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connectez-vous pour laisser un avis' USING ERRCODE = '42501';
  END IF;
  IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Choisissez une note de 1 à 5 étoiles' USING ERRCODE = '22023';
  END IF;
  IF v_comment IS NOT NULL AND char_length(v_comment) > 1000 THEN
    RAISE EXCEPTION 'Avis trop long (1000 caractères maximum)' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_item
  FROM public.reviewable_items(auth.uid()) i
  WHERE i.source_type = p_source_type AND i.source_id = p_source_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ce service pourra être noté après la prestation' USING ERRCODE = '42501';
  END IF;
  IF v_item.reviewed THEN
    RAISE EXCEPTION 'Vous avez déjà laissé un avis pour cette prestation' USING ERRCODE = '23505';
  END IF;

  SELECT public.review_display_name(full_name) INTO v_name FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.reviews (
    user_id, service_id, booking_id, target_type, target_id, target_name, source_type, source_id,
    rating, comment, reviewer_name
  )
  VALUES (
    auth.uid(),
    CASE WHEN v_item.target_type = 'service' THEN v_item.target_id END,
    CASE WHEN p_source_type = 'booking' THEN p_source_id END,
    v_item.target_type, v_item.target_id, v_item.title, p_source_type, p_source_id,
    p_rating, v_comment, COALESCE(v_name, public.review_display_name(v_item.customer_name))
  )
  RETURNING id INTO v_id;

  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Vous avez déjà laissé un avis pour cette prestation' USING ERRCODE = '23505';
END;
$$;

REVOKE ALL ON FUNCTION public.submit_review(TEXT, UUID, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_review(TEXT, UUID, INTEGER, TEXT) TO authenticated;

-- Les clients passent désormais par submit_review() (prestation effectuée).
DROP POLICY IF EXISTS "Users can create reviews for their paid bookings" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews for their completed bookings" ON public.reviews;

-- ---------------------------------------------------------------------------
-- 4. Lecture publique
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_reviews(
  p_target_type TEXT,
  p_target_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  review_id UUID,
  created_at TIMESTAMPTZ,
  rating INTEGER,
  comment TEXT,
  reviewer_name TEXT,
  partner_reply TEXT,
  partner_replied_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.created_at, r.rating, r.comment,
    COALESCE(NULLIF(btrim(r.reviewer_name), ''), public.review_display_name(p.full_name), 'Client'),
    r.partner_reply, r.partner_replied_at
  FROM public.reviews r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.target_type = p_target_type AND r.target_id = p_target_id AND r.status = 'approved'
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.public_reviews(TEXT, UUID, INTEGER, INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.public_review_summary(p_target_type TEXT, p_target_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'count', count(*),
    'average', COALESCE(round(avg(rating)::numeric, 1), 0),
    'distribution', jsonb_build_object(
      '5', count(*) FILTER (WHERE rating = 5),
      '4', count(*) FILTER (WHERE rating = 4),
      '3', count(*) FILTER (WHERE rating = 3),
      '2', count(*) FILTER (WHERE rating = 2),
      '1', count(*) FILTER (WHERE rating = 1)
    )
  )
  FROM public.reviews
  WHERE target_type = p_target_type AND target_id = p_target_id AND status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.public_review_summary(TEXT, UUID) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Espace partenaire (remplace les versions de 20261025000000)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_target_agency(_type TEXT, _id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _type
    WHEN 'service' THEN (SELECT agency_id FROM public.services WHERE id = _id)
    WHEN 'restaurant' THEN (SELECT agency_id FROM public.restaurants WHERE id = _id)
    WHEN 'wellness' THEN (SELECT agency_id FROM public.wellness_services WHERE id = _id)
    WHEN 'artisan' THEN (SELECT agency_id FROM public.artisans WHERE id = _id)
    WHEN 'activity' THEN (SELECT agency_id FROM public.activities WHERE id = _id)
    WHEN 'stay' THEN (SELECT agency_id FROM public.stays WHERE id = _id)
  END;
$$;

REVOKE ALL ON FUNCTION public.review_target_agency(TEXT, UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.agency_reviews()
RETURNS TABLE (
  review_id UUID,
  created_at TIMESTAMPTZ,
  service_name TEXT,
  rating INTEGER,
  comment TEXT,
  reviewer_name TEXT,
  status TEXT,
  partner_reply TEXT,
  partner_replied_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.created_at, COALESCE(r.target_name, s.name, 'Prestation'), r.rating, r.comment,
    COALESCE(NULLIF(btrim(r.reviewer_name), ''), 'Client'), r.status, r.partner_reply, r.partner_replied_at
  FROM public.reviews r
  LEFT JOIN public.services s ON s.id = r.service_id
  WHERE public.review_target_agency(r.target_type, r.target_id) = public.current_partner_agency_id()
    AND r.status <> 'rejected'
  ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.agency_reply_review(p_review_id UUID, p_reply TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reply TEXT := NULLIF(btrim(p_reply), '');
BEGIN
  IF v_reply IS NOT NULL AND char_length(v_reply) > 2000 THEN
    RAISE EXCEPTION 'Réponse trop longue (2000 caractères maximum)' USING ERRCODE = '22023';
  END IF;

  UPDATE public.reviews r
  SET partner_reply = v_reply,
      partner_replied_at = CASE WHEN v_reply IS NULL THEN NULL ELSE now() END,
      updated_at = now()
  WHERE r.id = p_review_id
    AND r.status = 'approved'
    AND public.review_target_agency(r.target_type, r.target_id) = public.current_partner_agency_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avis introuvable ou pas encore publié' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Invitations par e-mail après la prestation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_invitations (
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  user_id UUID NOT NULL,
  email TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (source_type, source_id)
);

ALTER TABLE public.review_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read review invitations" ON public.review_invitations;
CREATE POLICY "Admins read review invitations" ON public.review_invitations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Réserve les invitations à envoyer (prestations des 7 derniers jours, sans
-- avis ni invitation) : un appel en double n'envoie rien deux fois.
CREATE OR REPLACE FUNCTION public.claim_review_invitations(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  source_type TEXT,
  source_id UUID,
  user_id UUID,
  email TEXT,
  customer_name TEXT,
  title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT public.review_prompt_enabled() THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH due AS (
    SELECT i.*
    FROM public.reviewable_items(NULL) i
    WHERE NOT i.reviewed
      AND i.service_at >= (now() AT TIME ZONE 'Africa/Abidjan') - interval '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.review_invitations ri
        WHERE ri.source_type = i.source_type AND ri.source_id = i.source_id
      )
    ORDER BY i.service_at
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200)
  ),
  claimed AS (
    INSERT INTO public.review_invitations (source_type, source_id, user_id, email)
    SELECT d.source_type, d.source_id, d.user_id, d.customer_email FROM due d
    ON CONFLICT DO NOTHING
    RETURNING review_invitations.source_type, review_invitations.source_id
  )
  SELECT d.source_type, d.source_id, d.user_id, d.customer_email, d.customer_name, d.title
  FROM due d
  JOIN claimed c ON c.source_type = d.source_type AND c.source_id = d.source_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_review_invitations(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_review_invitations(INTEGER) TO service_role;

-- Tâche quotidienne (même mécanisme que 20261019010000 : secrets Vault
-- project_url, anon_key et cron_secret déjà en place).
DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron absent : tâche send-review-invitations non planifiée';
    RETURN;
  END IF;

  SELECT jobid INTO existing_job_id FROM cron.job WHERE jobname = 'send-review-invitations';
  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'send-review-invitations',
    '0 10 * * *',
    $job$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/send-review-invitations',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
          'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
        ),
        body := '{}'::jsonb
      );
    $job$
  );
END;
$$;
