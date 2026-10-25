-- Espace partenaire : menu et accès selon la catégorie du partenaire,
-- transparence financière (taux historisé, détail par transaction).
--
-- 1. Configuration : partner_categories ↔ partner_modules
--    (partner_category_modules). Une nouvelle catégorie s'ajoute depuis
--    /admin/partner-categories, sans toucher au code. Les modules, eux,
--    correspondent à des pages du site et ne s'ajoutent que par migration.
-- 2. agencies.category (modifiable par un admin uniquement).
-- 3. Contrôle d'accès serveur : agency_feature_enabled() (déjà utilisée par
--    toutes les policies partenaires) tient compte de la catégorie, les
--    services (hôtel / voiture / circuit) sont filtrés par type, et
--    agency_portal_context(module) renvoie une erreur 42501 (HTTP 403) pour
--    un module hors catégorie.
-- 4. Taux de commission historisé (agency_commission_rates) : chaque
--    commission est calculée avec le taux du contrat en vigueur à sa date.
-- 5. RPC de l'espace partenaire : finances (transactions + totaux, une seule
--    source pour le tableau de bord et la rubrique Finances), demandes,
--    clients, avis (avec réponse), tickets d'assistance.
--
-- À exécuter dans le SQL Editor, AVANT de déployer les fonctions
-- auto-approve-partner-applications / postPaymentSuccess et le site.

-- ---------------------------------------------------------------------------
-- 0. Garde-fou : jusqu'ici toutes les commissions étaient calculées à 10 %
--    quel que soit agencies.commission_rate. Cette migration rend ce champ
--    effectif : si un partenaire a un autre taux saisi, il faut décider
--    avant (le corriger à 10, ou l'assumer en le remettant après coup).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_list TEXT;
BEGIN
  SELECT string_agg(format('%s (%s %%)', name, commission_rate), ', ')
  INTO v_list
  FROM public.agencies
  WHERE commission_rate IS NOT NULL AND commission_rate <> 10;

  IF v_list IS NOT NULL THEN
    RAISE EXCEPTION 'Partenaires avec un taux de commission différent de 10 %% : %. Les commissions passées ont été calculées à 10 %%. Remettez ces taux à 10 avant la migration, puis modifiez-les depuis /admin/agencies : le nouveau taux s''appliquera à partir de sa date de modification.', v_list;
  END IF;
END;
$$;

UPDATE public.agencies SET commission_rate = 10 WHERE commission_rate IS NULL;

-- ---------------------------------------------------------------------------
-- 1. Configuration des catégories et modules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_modules (
  key TEXT PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  label TEXT NOT NULL,
  menu_group TEXT NOT NULL
    CHECK (menu_group IN ('dashboard', 'services', 'orders', 'finances', 'clients', 'profile', 'support')),
  -- Interrupteur agencies.enabled_features correspondant (désactivation par
  -- un admin : la rubrique reste visible en lecture seule).
  feature_key TEXT,
  -- Type de ligne dans public.services gérée par ce module (hotel, car, tour).
  service_type TEXT,
  -- Module commun à toutes les catégories (tableau de bord, finances...).
  is_core BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS public.partner_categories (
  key TEXT PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  label TEXT NOT NULL CHECK (char_length(btrim(label)) BETWEEN 2 AND 80),
  description TEXT,
  -- Proposée aux nouveaux partenaires (formulaire, création admin). Une
  -- catégorie inactive reste valable pour les partenaires qui l'ont déjà.
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_category_modules (
  category_key TEXT NOT NULL REFERENCES public.partner_categories(key) ON UPDATE CASCADE ON DELETE CASCADE,
  module_key TEXT NOT NULL REFERENCES public.partner_modules(key) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (category_key, module_key)
);

ALTER TABLE public.partner_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_category_modules ENABLE ROW LEVEL SECURITY;

-- Lecture publique : le formulaire « Devenir partenaire » liste les catégories.
DROP POLICY IF EXISTS "Partner modules are readable" ON public.partner_modules;
CREATE POLICY "Partner modules are readable" ON public.partner_modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Partner categories are readable" ON public.partner_categories;
CREATE POLICY "Partner categories are readable" ON public.partner_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Partner category modules are readable" ON public.partner_category_modules;
CREATE POLICY "Partner category modules are readable" ON public.partner_category_modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage partner categories" ON public.partner_categories;
CREATE POLICY "Admins manage partner categories" ON public.partner_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins manage partner category modules" ON public.partner_category_modules;
CREATE POLICY "Admins manage partner category modules" ON public.partner_category_modules
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.partner_modules (key, label, menu_group, feature_key, service_type, is_core, sort_order) VALUES
  ('dashboard',           'Tableau de bord',                    'dashboard', NULL,          NULL,   true,  10),
  ('catalog_hotels',      'Hôtels',                             'services',  'services',    'hotel', false, 20),
  ('catalog_cars',        'Véhicules',                          'services',  'services',    'car',  false, 21),
  ('catalog_tours',       'Circuits',                           'services',  'services',    'tour', false, 22),
  ('catalog_activities',  'Activités',                          'services',  'activities',  NULL,   false, 23),
  ('catalog_stays',       'Séjours',                            'services',  'stays',       NULL,   false, 24),
  ('catalog_restaurants', 'Restaurants',                        'services',  'restaurants', NULL,   false, 25),
  ('catalog_artisans',    'Artisanat',                          'services',  'artisans',    NULL,   false, 26),
  ('catalog_wellness',    'Bien-être & beauté',                 'services',  'wellness',    NULL,   false, 27),
  ('hotel_rates',         'Chambres, tarifs et disponibilités', 'services',  'services',    NULL,   false, 30),
  ('promotions',          'Promotions',                         'services',  'promotions',  NULL,   false, 40),
  ('orders',              'Demandes',                           'orders',    NULL,          NULL,   true,  50),
  ('hotel_bookings',      'Séjours hôtel',                      'orders',    NULL,          NULL,   false, 51),
  ('finances',            'Finances',                           'finances',  NULL,          NULL,   true,  60),
  ('reviews',             'Avis et évaluations',                'clients',   NULL,          NULL,   true,  70),
  ('customers',           'Clients',                            'clients',   NULL,          NULL,   true,  71),
  ('settings',            'Profil & paramètres',                'profile',   NULL,          NULL,   true,  80),
  ('support',             'Assistance',                         'support',   NULL,          NULL,   true,  90)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  menu_group = EXCLUDED.menu_group,
  feature_key = EXCLUDED.feature_key,
  service_type = EXCLUDED.service_type,
  is_core = EXCLUDED.is_core,
  sort_order = EXCLUDED.sort_order;

-- Mêmes clés que le formulaire « Devenir partenaire » (BecomePartner.tsx).
-- « agency » : agences de voyage multi-activités, et partenaires existants
-- dont l'activité n'a pas pu être déduite.
INSERT INTO public.partner_categories (key, label, description, sort_order) VALUES
  ('hotel',      'Hôtel / hébergement',               'Hôtels, résidences, maisons d''hôtes', 10),
  ('restaurant', 'Restaurant',                        'Restaurants, maquis, bars', 20),
  ('activity',   'Activités / excursions / circuits', 'Guides, excursions, circuits touristiques', 30),
  ('artisan',    'Artisan / guide local',             'Artisans, créateurs, guides locaux', 40),
  ('wellness',   'Bien-être & beauté',                'Spas, instituts, coiffure, yoga', 50),
  ('cars',       'Garage / mobilité',                 'Location de voitures, transport', 60),
  ('agency',     'Agence de voyage (multi-activités)', 'Agences proposant plusieurs types de prestations', 90)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.partner_category_modules (category_key, module_key) VALUES
  ('hotel', 'catalog_hotels'), ('hotel', 'hotel_rates'), ('hotel', 'hotel_bookings'), ('hotel', 'promotions'),
  ('restaurant', 'catalog_restaurants'), ('restaurant', 'promotions'),
  ('activity', 'catalog_activities'), ('activity', 'catalog_tours'), ('activity', 'promotions'),
  ('artisan', 'catalog_artisans'), ('artisan', 'promotions'),
  ('wellness', 'catalog_wellness'), ('wellness', 'promotions'),
  ('cars', 'catalog_cars'), ('cars', 'promotions'),
  ('agency', 'catalog_hotels'), ('agency', 'catalog_cars'), ('agency', 'catalog_tours'),
  ('agency', 'catalog_activities'), ('agency', 'catalog_stays'), ('agency', 'catalog_restaurants'),
  ('agency', 'catalog_artisans'), ('agency', 'catalog_wellness'), ('agency', 'hotel_rates'),
  ('agency', 'hotel_bookings'), ('agency', 'promotions')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Catégorie du partenaire et de la candidature
-- ---------------------------------------------------------------------------
-- Sans catégorie, un partenaire ne voit que les modules communs.
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS category TEXT REFERENCES public.partner_categories(key) ON UPDATE CASCADE;
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS category TEXT REFERENCES public.partner_categories(key) ON UPDATE CASCADE;

-- Candidatures existantes : le type n'était enregistré que dans la
-- description (« Type de partenariat : … », voir BecomePartner.tsx).
UPDATE public.partner_applications pa
SET category = CASE
    WHEN pa.description ILIKE '%Type de partenariat : Hôtel%' THEN 'hotel'
    WHEN pa.description ILIKE '%Type de partenariat : Restaurant%' THEN 'restaurant'
    WHEN pa.description ILIKE '%Type de partenariat : Activité%' THEN 'activity'
    WHEN pa.description ILIKE '%Type de partenariat : Artisan%' THEN 'artisan'
    WHEN pa.description ILIKE '%Type de partenariat : Bien-être%' THEN 'wellness'
    WHEN pa.description ILIKE '%Type de partenariat : Location de voitures%' THEN 'cars'
  END
WHERE pa.category IS NULL AND pa.description ILIKE '%Type de partenariat : %';

-- Partenaires existants : d'abord leur candidature validée, sinon le seul
-- type de contenu qu'ils publient, sinon « agency » (menu complet, comme
-- aujourd'hui) - un admin affine ensuite depuis /admin/agencies.
WITH from_application AS (
  SELECT DISTINCT ON (a.id) a.id AS agency_id, pa.category
  FROM public.agencies a
  JOIN public.partner_applications pa
    ON pa.category IS NOT NULL
   AND pa.status = 'approved'
   AND (lower(pa.contact_email) = lower(a.contact_email) OR lower(btrim(pa.name)) = lower(btrim(a.name)))
  WHERE a.category IS NULL
  ORDER BY a.id, pa.created_at DESC
),
content AS (
  SELECT a.id AS agency_id, kinds.kind
  FROM public.agencies a
  CROSS JOIN LATERAL (
    SELECT 'hotel' AS kind WHERE EXISTS (SELECT 1 FROM public.services s WHERE s.agency_id = a.id AND s.type = 'hotel')
    UNION SELECT 'cars' WHERE a.car_plan_id IS NOT NULL OR EXISTS (SELECT 1 FROM public.services s WHERE s.agency_id = a.id AND s.type = 'car')
    UNION SELECT 'activity' WHERE EXISTS (SELECT 1 FROM public.services s WHERE s.agency_id = a.id AND s.type = 'tour')
      OR EXISTS (SELECT 1 FROM public.activities x WHERE x.agency_id = a.id)
    UNION SELECT 'agency' WHERE EXISTS (SELECT 1 FROM public.stays x WHERE x.agency_id = a.id)
    UNION SELECT 'restaurant' WHERE EXISTS (SELECT 1 FROM public.restaurants x WHERE x.agency_id = a.id)
    UNION SELECT 'artisan' WHERE EXISTS (SELECT 1 FROM public.artisans x WHERE x.agency_id = a.id)
    UNION SELECT 'wellness' WHERE EXISTS (SELECT 1 FROM public.wellness_services x WHERE x.agency_id = a.id)
  ) kinds
  WHERE a.category IS NULL
),
from_content AS (
  SELECT agency_id, CASE WHEN count(*) = 1 THEN min(kind) ELSE 'agency' END AS category
  FROM content
  GROUP BY agency_id
)
UPDATE public.agencies a
SET category = COALESCE(fa.category, fc.category, 'agency')
FROM public.agencies a2
LEFT JOIN from_application fa ON fa.agency_id = a2.id
LEFT JOIN from_content fc ON fc.agency_id = a2.id
WHERE a.id = a2.id AND a.category IS NULL;

-- La catégorie fixe le périmètre et les finances : réservée aux admins.
CREATE OR REPLACE FUNCTION public.enforce_agency_protected_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.owner_id := OLD.owner_id;
    NEW.commission_rate := OLD.commission_rate;
    NEW.car_plan_id := OLD.car_plan_id;
    NEW.car_plan_started_at := OLD.car_plan_started_at;
    NEW.is_visible := OLD.is_visible;
    NEW.is_active := OLD.is_active;
    NEW.category := OLD.category;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- 3. Contrôle d'accès selon la catégorie
-- ---------------------------------------------------------------------------
-- Module visible pour ce partenaire (commun, ou prévu par sa catégorie).
CREATE OR REPLACE FUNCTION public.agency_module_in_scope(_agency_id UUID, _module TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agencies a
    JOIN public.partner_modules m ON m.key = _module
    WHERE a.id = _agency_id
      AND a.is_active = true
      AND (
        m.is_core
        OR EXISTS (
          SELECT 1 FROM public.partner_category_modules cm
          WHERE cm.category_key = a.category AND cm.module_key = m.key
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.agency_module_in_scope(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_module_in_scope(UUID, TEXT) TO authenticated;

-- Même signature qu'en 20261004000000 : toutes les policies d'écriture des
-- partenaires (services, activities, stays, restaurants, artisans,
-- wellness_services, promotions, artisan_orders, chambres d'hôtel) en
-- dépendent. Il faut désormais que l'interrupteur admin soit actif ET
-- qu'un module de la catégorie du partenaire utilise cette rubrique.
CREATE OR REPLACE FUNCTION public.agency_feature_enabled(_agency_id uuid, _feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((a.enabled_features ->> _feature)::boolean, true)
    AND EXISTS (
      SELECT 1
      FROM public.partner_category_modules cm
      JOIN public.partner_modules m ON m.key = cm.module_key
      WHERE cm.category_key = a.category AND m.feature_key = _feature
    )
  FROM public.agencies a
  WHERE a.id = _agency_id AND a.is_active = true
$$;

-- public.services mélange hôtels, voitures et circuits : un garage ne peut
-- créer ni modifier un hôtel, même en appelant l'API directement.
CREATE OR REPLACE FUNCTION public.agency_service_type_allowed(_agency_id UUID, _type TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agencies a
    JOIN public.partner_category_modules cm ON cm.category_key = a.category
    JOIN public.partner_modules m ON m.key = cm.module_key
    WHERE a.id = _agency_id AND m.service_type = _type
  );
$$;

REVOKE ALL ON FUNCTION public.agency_service_type_allowed(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_service_type_allowed(UUID, TEXT) TO authenticated;

-- Policies restrictives : s'ajoutent (ET) aux policies existantes, et ne
-- concernent que les comptes partenaires.
DROP POLICY IF EXISTS "Partner service types follow the category (insert)" ON public.services;
CREATE POLICY "Partner service types follow the category (insert)" ON public.services
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (
    agency_id IS NULL
    OR public.has_role(auth.uid(), 'admin')
    OR NOT public.has_role(auth.uid(), 'sub_agency')
    OR public.agency_service_type_allowed(agency_id, type::text)
  );
DROP POLICY IF EXISTS "Partner service types follow the category (update)" ON public.services;
CREATE POLICY "Partner service types follow the category (update)" ON public.services
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (
    agency_id IS NULL
    OR public.has_role(auth.uid(), 'admin')
    OR NOT public.has_role(auth.uid(), 'sub_agency')
    OR public.agency_service_type_allowed(agency_id, type::text)
  )
  WITH CHECK (
    agency_id IS NULL
    OR public.has_role(auth.uid(), 'admin')
    OR NOT public.has_role(auth.uid(), 'sub_agency')
    OR public.agency_service_type_allowed(agency_id, type::text)
  );

-- Contexte de l'espace partenaire (menu). Avec p_module, refuse l'accès à un
-- module hors catégorie : 42501 = HTTP 403 côté API.
CREATE OR REPLACE FUNCTION public.agency_portal_context(p_module TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency public.agencies%ROWTYPE;
  v_modules JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'sub_agency') THEN
    RAISE EXCEPTION 'Accès réservé aux partenaires' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_agency
  FROM public.agencies
  WHERE owner_id = auth.uid()
  ORDER BY created_at
  LIMIT 1;

  IF NOT FOUND OR NOT COALESCE(v_agency.is_active, false) THEN
    RAISE EXCEPTION 'Espace partenaire inactif' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'key', m.key,
      'label', m.label,
      'group', m.menu_group,
      'enabled', m.feature_key IS NULL OR COALESCE((v_agency.enabled_features ->> m.feature_key)::boolean, true)
    ) ORDER BY m.sort_order), '[]'::jsonb)
  INTO v_modules
  FROM public.partner_modules m
  WHERE m.is_core
     OR EXISTS (
       SELECT 1 FROM public.partner_category_modules cm
       WHERE cm.category_key = v_agency.category AND cm.module_key = m.key
     );

  IF p_module IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_modules) e WHERE e->>'key' = p_module
  ) THEN
    RAISE EXCEPTION 'Cette rubrique ne fait pas partie de votre activité' USING ERRCODE = '42501', HINT = p_module;
  END IF;

  RETURN jsonb_build_object(
    'agency_id', v_agency.id,
    'name', v_agency.name,
    'category', v_agency.category,
    'category_label', (SELECT c.label FROM public.partner_categories c WHERE c.key = v_agency.category),
    'modules', v_modules
  );
END;
$$;

REVOKE ALL ON FUNCTION public.agency_portal_context(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_portal_context(TEXT) TO authenticated;

-- Agence du partenaire connecté (NULL si ce n'est pas un partenaire actif).
CREATE OR REPLACE FUNCTION public.current_partner_agency_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id
  FROM public.agencies a
  WHERE a.owner_id = auth.uid()
    AND a.is_active = true
    AND public.has_role(auth.uid(), 'sub_agency')
  ORDER BY a.created_at
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_partner_agency_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_partner_agency_id() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Taux de commission historisé
-- ---------------------------------------------------------------------------
-- platform_rate = part conservée par Bossiz, en %. (Dans public.commissions,
-- commission_rate / commission_amount désignent au contraire la part du
-- partenaire : 90 % / 90 % du montant.)
CREATE TABLE IF NOT EXISTS public.agency_commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  platform_rate NUMERIC(5,2) NOT NULL CHECK (platform_rate BETWEEN 0 AND 100),
  effective_from TIMESTAMPTZ NOT NULL,
  set_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agency_id, effective_from)
);

CREATE INDEX IF NOT EXISTS agency_commission_rates_lookup
  ON public.agency_commission_rates(agency_id, effective_from DESC);

ALTER TABLE public.agency_commission_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency owners read their commission rates" ON public.agency_commission_rates;
CREATE POLICY "Agency owners read their commission rates" ON public.agency_commission_rates
  FOR SELECT USING (public.is_agency_owner(auth.uid(), agency_id));
DROP POLICY IF EXISTS "Admins read commission rates" ON public.agency_commission_rates;
CREATE POLICY "Admins read commission rates" ON public.agency_commission_rates
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
-- Pas de policy d'écriture : l'historique n'est alimenté que par le trigger.

CREATE OR REPLACE FUNCTION public.record_agency_commission_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate THEN
    INSERT INTO public.agency_commission_rates (agency_id, platform_rate, effective_from, set_by)
    VALUES (
      NEW.id,
      COALESCE(NEW.commission_rate, 10),
      CASE WHEN TG_OP = 'INSERT' THEN NEW.created_at ELSE now() END,
      auth.uid()
    )
    ON CONFLICT (agency_id, effective_from) DO UPDATE
      SET platform_rate = EXCLUDED.platform_rate, set_by = EXCLUDED.set_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS record_agency_commission_rate_trigger ON public.agencies;
CREATE TRIGGER record_agency_commission_rate_trigger
  AFTER INSERT OR UPDATE OF commission_rate ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.record_agency_commission_rate();

INSERT INTO public.agency_commission_rates (agency_id, platform_rate, effective_from)
SELECT id, commission_rate, created_at FROM public.agencies
ON CONFLICT (agency_id, effective_from) DO NOTHING;

-- Taux Bossiz du contrat en vigueur à une date donnée.
CREATE OR REPLACE FUNCTION public.agency_platform_rate_at(_agency_id UUID, _at TIMESTAMPTZ)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT r.platform_rate FROM public.agency_commission_rates r
      WHERE r.agency_id = _agency_id AND r.effective_from <= _at
      ORDER BY r.effective_from DESC LIMIT 1),
    -- Transaction antérieure au premier taux connu : le premier taux.
    (SELECT r.platform_rate FROM public.agency_commission_rates r
      WHERE r.agency_id = _agency_id
      ORDER BY r.effective_from LIMIT 1),
    10
  );
$$;

REVOKE ALL ON FUNCTION public.agency_platform_rate_at(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agency_platform_rate_at(UUID, TIMESTAMPTZ) TO service_role;

-- Commissions des réservations restaurant, bien-être et commandes artisan :
-- mêmes triggers qu'en 20261006120000, avec le taux historisé au lieu de
-- 90 % en dur. Une ligne déjà créée garde son taux d'origine.
CREATE OR REPLACE FUNCTION public.sync_restaurant_reservation_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
  v_ticket_price NUMERIC;
  v_amount NUMERIC;
  v_share NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' THEN
    SELECT r.agency_id, r.average_ticket_price
      INTO v_agency_id, v_ticket_price
      FROM public.restaurants r
      WHERE r.id = NEW.restaurant_id;

    IF v_ticket_price IS NULL THEN
      RETURN NEW;
    END IF;

    v_amount := v_ticket_price * NEW.party_size;
    v_share := 100 - public.agency_platform_rate_at(v_agency_id, now());

    INSERT INTO public.commissions (agency_id, source_type, source_id, booking_amount, commission_rate, commission_amount, status)
    VALUES (v_agency_id, 'restaurant_reservation', NEW.id, v_amount, v_share, ROUND(v_amount * v_share / 100, 2), 'pending')
    ON CONFLICT (source_type, source_id) WHERE source_id IS NOT NULL DO UPDATE
      SET booking_amount = EXCLUDED.booking_amount,
          commission_amount = ROUND(EXCLUDED.booking_amount * public.commissions.commission_rate / 100, 2),
          updated_at = now()
      WHERE public.commissions.status = 'pending';

  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.commissions
      SET status = 'cancelled', updated_at = now()
      WHERE source_type = 'restaurant_reservation' AND source_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_wellness_booking_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
  v_amount NUMERIC;
  v_share NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' THEN
    SELECT w.agency_id
      INTO v_agency_id
      FROM public.wellness_services w
      WHERE w.id = NEW.wellness_service_id;

    IF NEW.treatment_price IS NULL THEN
      RETURN NEW;
    END IF;

    v_amount := NEW.treatment_price * NEW.party_size;
    v_share := 100 - public.agency_platform_rate_at(v_agency_id, now());

    INSERT INTO public.commissions (agency_id, source_type, source_id, booking_amount, commission_rate, commission_amount, status)
    VALUES (v_agency_id, 'wellness_booking', NEW.id, v_amount, v_share, ROUND(v_amount * v_share / 100, 2), 'pending')
    ON CONFLICT (source_type, source_id) WHERE source_id IS NOT NULL DO UPDATE
      SET booking_amount = EXCLUDED.booking_amount,
          commission_amount = ROUND(EXCLUDED.booking_amount * public.commissions.commission_rate / 100, 2),
          updated_at = now()
      WHERE public.commissions.status = 'pending';

  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.commissions
      SET status = 'cancelled', updated_at = now()
      WHERE source_type = 'wellness_booking' AND source_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_artisan_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
  v_share NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed') THEN
    SELECT ar.agency_id
      INTO v_agency_id
      FROM public.artisans ar
      WHERE ar.id = NEW.artisan_id;

    v_share := 100 - public.agency_platform_rate_at(v_agency_id, now());

    INSERT INTO public.commissions (agency_id, source_type, source_id, booking_amount, commission_rate, commission_amount, status)
    VALUES (v_agency_id, 'artisan_order', NEW.id, NEW.total_amount, v_share, ROUND(NEW.total_amount * v_share / 100, 2), 'pending')
    ON CONFLICT (source_type, source_id) WHERE source_id IS NOT NULL DO UPDATE
      SET booking_amount = EXCLUDED.booking_amount,
          commission_amount = ROUND(EXCLUDED.booking_amount * public.commissions.commission_rate / 100, 2),
          updated_at = now()
      WHERE public.commissions.status = 'pending';

  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.commissions
      SET status = 'cancelled', updated_at = now()
      WHERE source_type = 'artisan_order' AND source_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Facture mensuelle des séjours payés sur place (20261018010000) : la
-- commission est la somme des commissions de chaque séjour, au taux en
-- vigueur à la date de la réservation - exactement ce que le partenaire voit
-- ligne par ligne dans Finances.
CREATE OR REPLACE FUNCTION public.admin_issue_hotel_onsite_invoice(p_agency_id UUID, p_period DATE)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period DATE := date_trunc('month', p_period)::date;
  v_count INTEGER;
  v_amount NUMERIC(12,2);
  v_fee NUMERIC(12,2);
  v_ids UUID[];
  v_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
  IF v_period >= date_trunc('month', current_date)::date THEN
    RAISE EXCEPTION 'Le mois doit être terminé avant de facturer' USING ERRCODE = '22023';
  END IF;

  SELECT
    count(*),
    sum(h.total_price),
    sum(round(h.total_price * public.agency_platform_rate_at(h.agency_id, b.created_at) / 100)),
    array_agg(h.booking_id)
  INTO v_count, v_amount, v_fee, v_ids
  FROM public.hotel_onsite_billable_bookings(v_period) h
  JOIN public.bookings b ON b.id = h.booking_id
  WHERE h.agency_id = p_agency_id;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Aucun séjour payé sur place à facturer ce mois-ci' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.hotel_onsite_commission_invoices (
    agency_id, period, stays_count, stays_amount, commission_rate, commission_amount,
    booking_ids, due_at, issued_by
  )
  VALUES (
    p_agency_id, v_period, v_count, v_amount,
    round(v_fee * 100 / NULLIF(v_amount, 0), 2), v_fee,
    v_ids, current_date + 15, auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Une facture existe déjà pour cet hôtel et ce mois' USING ERRCODE = '23505';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_issue_hotel_onsite_invoice(UUID, DATE) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. RPC de l'espace partenaire
-- ---------------------------------------------------------------------------

-- Toutes les transactions du partenaire connecté, avec le détail du calcul.
-- collection = 'online' : encaissé par Bossiz, net reversé au partenaire ;
-- 'on_site' : séjour payé à l'hôtel, la commission est facturée au partenaire.
-- La période porte sur transaction_date (paiement en ligne, ou date de
-- départ pour un séjour payé sur place - comme la facture mensuelle).
CREATE OR REPLACE FUNCTION public.agency_finance_transactions(p_from DATE DEFAULT NULL, p_to DATE DEFAULT NULL)
RETURNS TABLE (
  transaction_id TEXT,
  transaction_date TIMESTAMPTZ,
  source_type TEXT,
  reference TEXT,
  label TEXT,
  collection TEXT,
  gross_amount NUMERIC,
  commission_rate NUMERIC,
  commission_amount NUMERIC,
  net_amount NUMERIC,
  status TEXT,
  payout_status TEXT,
  payout_due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payout_reference TEXT,
  rate_effective_from TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (SELECT public.current_partner_agency_id() AS agency_id),
  online AS (
    SELECT
      'commission:' || c.id AS transaction_id,
      c.created_at AS transaction_date,
      COALESCE(NULLIF(c.source_type, ''), 'booking') AS source_type,
      upper(left(COALESCE(c.booking_id, c.source_id)::text, 8)) AS reference,
      COALESCE(s.name, r.name, wb.treatment_name, ao.product_name, 'Prestation') AS label,
      'online'::text AS collection,
      c.booking_amount AS gross_amount,
      100 - c.commission_rate AS commission_rate,
      c.booking_amount - c.commission_amount AS commission_amount,
      c.commission_amount AS net_amount,
      c.status,
      c.payout_status,
      c.payout_due_at,
      c.paid_at,
      c.payout_reference,
      (SELECT max(cr.effective_from) FROM public.agency_commission_rates cr
        WHERE cr.agency_id = c.agency_id AND cr.effective_from <= c.created_at) AS rate_effective_from
    FROM public.commissions c
    JOIN me ON me.agency_id = c.agency_id
    LEFT JOIN public.bookings b ON b.id = c.booking_id
    LEFT JOIN public.services s ON s.id = b.service_id
    LEFT JOIN public.restaurant_reservations rr ON c.source_type = 'restaurant_reservation' AND rr.id = c.source_id
    LEFT JOIN public.restaurants r ON r.id = rr.restaurant_id
    LEFT JOIN public.wellness_bookings wb ON c.source_type = 'wellness_booking' AND wb.id = c.source_id
    LEFT JOIN public.artisan_orders ao ON c.source_type = 'artisan_order' AND ao.id = c.source_id
  ),
  onsite AS (
    SELECT
      'onsite:' || b.id AS transaction_id,
      b.end_date::timestamptz AS transaction_date,
      'hotel_on_site'::text AS source_type,
      upper(left(b.id::text, 8)) AS reference,
      s.name AS label,
      'on_site'::text AS collection,
      b.total_price AS gross_amount,
      rate.platform_rate AS commission_rate,
      round(b.total_price * rate.platform_rate / 100) AS commission_amount,
      b.total_price - round(b.total_price * rate.platform_rate / 100) AS net_amount,
      -- 'to_invoice' (pas encore facturé), 'issued' (facturé, à régler), 'paid'.
      COALESCE(inv.status, 'to_invoice') AS status,
      NULL::text AS payout_status,
      inv.due_at::timestamptz AS payout_due_at,
      inv.paid_at,
      NULL::text AS payout_reference,
      (SELECT max(cr.effective_from) FROM public.agency_commission_rates cr
        WHERE cr.agency_id = s.agency_id AND cr.effective_from <= b.created_at) AS rate_effective_from
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    JOIN me ON me.agency_id = s.agency_id
    CROSS JOIN LATERAL (SELECT public.agency_platform_rate_at(s.agency_id, b.created_at) AS platform_rate) rate
    LEFT JOIN LATERAL (
      SELECT i.status, i.due_at, i.paid_at
      FROM public.hotel_onsite_commission_invoices i
      WHERE i.agency_id = s.agency_id AND b.id = ANY(i.booking_ids) AND i.status <> 'cancelled'
      ORDER BY i.created_at DESC
      LIMIT 1
    ) inv ON true
    WHERE b.booking_details->>'kind' = 'partner_hotel'
      AND COALESCE((b.booking_details->>'payAtProperty')::boolean, false)
      AND NOT COALESCE((b.booking_details->>'noShow')::boolean, false)
      AND b.status IN ('confirmed', 'completed')
      AND b.payment_status::text <> 'refunded'
      AND b.end_date <= current_date
  )
  SELECT * FROM (
    SELECT * FROM online
    UNION ALL
    SELECT * FROM onsite
  ) t
  WHERE (p_from IS NULL OR t.transaction_date >= p_from::timestamptz)
    AND (p_to IS NULL OR t.transaction_date < (p_to + 1)::timestamptz)
  ORDER BY t.transaction_date DESC;
$$;

REVOKE ALL ON FUNCTION public.agency_finance_transactions(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_finance_transactions(DATE, DATE) TO authenticated;

-- Totaux calculés sur les mêmes lignes que agency_finance_transactions : le
-- tableau de bord et la rubrique Finances affichent donc les mêmes chiffres.
CREATE OR REPLACE FUNCTION public.agency_finance_summary(p_from DATE DEFAULT NULL, p_to DATE DEFAULT NULL)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'transactions', count(*) FILTER (WHERE t.status <> 'cancelled'),
    'gross', COALESCE(sum(t.gross_amount) FILTER (WHERE t.status <> 'cancelled'), 0),
    'commission', COALESCE(sum(t.commission_amount) FILTER (WHERE t.status <> 'cancelled'), 0),
    'net', COALESCE(sum(t.net_amount) FILTER (WHERE t.status <> 'cancelled'), 0),
    'paid_out', COALESCE(sum(t.net_amount) FILTER (WHERE t.collection = 'online' AND t.status = 'paid'), 0),
    'pending_payout', COALESCE(sum(t.net_amount) FILTER (WHERE t.collection = 'online' AND t.status = 'pending'), 0),
    'due_to_bossiz', COALESCE(sum(t.commission_amount) FILTER (WHERE t.collection = 'on_site' AND t.status <> 'paid'), 0)
  )
  FROM public.agency_finance_transactions(p_from, p_to) t;
$$;

REVOKE ALL ON FUNCTION public.agency_finance_summary(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_finance_summary(DATE, DATE) TO authenticated;

-- Historique des taux du partenaire connecté.
CREATE OR REPLACE FUNCTION public.agency_commission_rate_history()
RETURNS TABLE (platform_rate NUMERIC, effective_from TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.platform_rate, r.effective_from
  FROM public.agency_commission_rates r
  WHERE r.agency_id = public.current_partner_agency_id()
  ORDER BY r.effective_from DESC;
$$;

REVOKE ALL ON FUNCTION public.agency_commission_rate_history() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_commission_rate_history() TO authenticated;

-- Accès du partenaire aux coordonnées des clients (point à arbitrer par la
-- direction) : 'active_only' (défaut) = seulement pour une demande en cours
-- ou à venir, le temps de la prestation ; 'always' = aussi dans l'historique.
INSERT INTO public.site_config (config_key, config_value, category, description)
VALUES (
  'partner_customer_contact_access',
  '"active_only"'::jsonb,
  'partners',
  'Coordonnées clients visibles par le partenaire : "active_only" (demandes en cours ou à venir) ou "always"'
)
ON CONFLICT (config_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.partner_contact_always_visible()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT config_value #>> '{}' FROM public.site_config WHERE config_key = 'partner_customer_contact_access') = 'always',
    false
  );
$$;

REVOKE ALL ON FUNCTION public.partner_contact_always_visible() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_contact_always_visible() TO authenticated;

-- Demandes reçues (réservations, commandes) des modules de la catégorie,
-- coordonnées complètes : usage interne uniquement (agency_orders et
-- agency_customers appliquent ensuite la règle d'accès aux coordonnées).
-- bucket : 'new' (à traiter : en attente, ou reçue il y a moins de 48 h),
-- 'in_progress' (confirmée, prestation à venir), 'history'.
CREATE OR REPLACE FUNCTION public.partner_orders_unmasked()
RETURNS TABLE (
  order_kind TEXT,
  order_id UUID,
  module TEXT,
  created_at TIMESTAMPTZ,
  service_date DATE,
  service_time TEXT,
  title TEXT,
  quantity INTEGER,
  amount NUMERIC,
  status TEXT,
  bucket TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  notes TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (SELECT public.current_partner_agency_id() AS agency_id),
  raw AS (
    SELECT
      'booking'::text AS order_kind,
      b.id AS order_id,
      CASE s.type WHEN 'hotel' THEN 'catalog_hotels' WHEN 'car' THEN 'catalog_cars' ELSE 'catalog_tours' END AS module,
      b.created_at,
      b.start_date::date AS service_date,
      NULL::text AS service_time,
      s.name AS title,
      b.guests AS quantity,
      b.total_price AS amount,
      b.status::text AS status,
      CASE
        WHEN b.status = 'pending' THEN 'new'
        WHEN b.status = 'confirmed' AND COALESCE(b.end_date, b.start_date)::date >= current_date
          THEN CASE WHEN b.created_at > now() - interval '48 hours' THEN 'new' ELSE 'in_progress' END
        ELSE 'history'
      END AS bucket,
      b.customer_name,
      b.customer_phone,
      b.customer_email,
      b.notes
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    JOIN me ON me.agency_id = s.agency_id
    WHERE s.type IN ('hotel', 'car', 'tour')
      -- Réservation en ligne non payée : pas encore une vraie demande.
      AND NOT (b.status = 'pending' AND b.payment_status::text IN ('pending', 'failed') AND COALESCE(b.amount_due_now, b.total_price, 0) > 0)
    UNION ALL
    SELECT
      'restaurant', rr.id, 'catalog_restaurants', rr.created_at, rr.reservation_date, rr.reservation_time::text,
      r.name, rr.party_size, r.average_ticket_price * rr.party_size, rr.status,
      CASE
        WHEN rr.status = 'confirmed' AND rr.reservation_date >= current_date
          THEN CASE WHEN rr.created_at > now() - interval '48 hours' THEN 'new' ELSE 'in_progress' END
        ELSE 'history'
      END,
      rr.customer_name, rr.customer_phone, rr.customer_email, rr.special_requests
    FROM public.restaurant_reservations rr
    JOIN public.restaurants r ON r.id = rr.restaurant_id
    JOIN me ON me.agency_id = r.agency_id
    UNION ALL
    SELECT
      'wellness', wb.id, 'catalog_wellness', wb.created_at, wb.booking_date, wb.booking_time::text,
      wb.treatment_name, wb.party_size, wb.treatment_price * wb.party_size, wb.status,
      CASE
        WHEN wb.status = 'confirmed' AND wb.booking_date >= current_date
          THEN CASE WHEN wb.created_at > now() - interval '48 hours' THEN 'new' ELSE 'in_progress' END
        ELSE 'history'
      END,
      wb.customer_name, wb.customer_phone, wb.customer_email, wb.special_requests
    FROM public.wellness_bookings wb
    JOIN public.wellness_services w ON w.id = wb.wellness_service_id
    JOIN me ON me.agency_id = w.agency_id
    UNION ALL
    SELECT
      'artisan', ao.id, 'catalog_artisans', ao.created_at, NULL::date, NULL::text,
      ao.product_name, ao.quantity, ao.total_amount, ao.status,
      CASE ao.status WHEN 'pending' THEN 'new' WHEN 'confirmed' THEN 'in_progress' ELSE 'history' END,
      ao.customer_name, ao.customer_phone, ao.customer_email, ao.message
    FROM public.artisan_orders ao
    JOIN public.artisans ar ON ar.id = ao.artisan_id
    JOIN me ON me.agency_id = ar.agency_id
  )
  SELECT raw.*
  FROM raw, me
  WHERE public.agency_module_in_scope(me.agency_id, raw.module);
$$;

REVOKE ALL ON FUNCTION public.partner_orders_unmasked() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.agency_orders()
RETURNS TABLE (
  order_kind TEXT,
  order_id UUID,
  module TEXT,
  created_at TIMESTAMPTZ,
  service_date DATE,
  service_time TEXT,
  title TEXT,
  quantity INTEGER,
  amount NUMERIC,
  status TEXT,
  bucket TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  notes TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.order_kind, o.order_id, o.module, o.created_at, o.service_date, o.service_time,
    o.title, o.quantity, o.amount, o.status, o.bucket,
    o.customer_name,
    CASE WHEN o.bucket <> 'history' OR public.partner_contact_always_visible() THEN o.customer_phone END,
    CASE WHEN o.bucket <> 'history' OR public.partner_contact_always_visible() THEN o.customer_email END,
    o.notes
  FROM public.partner_orders_unmasked() o
  ORDER BY o.created_at DESC
  LIMIT 1000;
$$;

REVOKE ALL ON FUNCTION public.agency_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_orders() TO authenticated;

-- Clients ayant réservé chez le partenaire, avec le strict nécessaire
-- (conformité ARTCI) : pas d'adresse, pas d'historique hors partenaire, et
-- coordonnées selon partner_customer_contact_access.
CREATE OR REPLACE FUNCTION public.agency_customers()
RETURNS TABLE (
  customer_name TEXT,
  orders_count INTEGER,
  first_order_at TIMESTAMPTZ,
  last_order_at TIMESTAMPTZ,
  next_service_date DATE,
  customer_phone TEXT,
  customer_email TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Regroupement sur les coordonnées réelles ; elles ne sont renvoyées que
  -- si le client a une demande en cours ou à venir (ou réglage 'always').
  WITH o AS (
    SELECT *,
      lower(COALESCE(NULLIF(btrim(customer_email), ''), NULLIF(regexp_replace(COALESCE(customer_phone, ''), '\D', '', 'g'), ''), btrim(customer_name))) AS customer_key
    FROM public.partner_orders_unmasked()
    WHERE status <> 'cancelled'
  ),
  grouped AS (
    SELECT
      (array_agg(o.customer_name ORDER BY o.created_at DESC))[1] AS customer_name,
      count(*)::int AS orders_count,
      min(o.created_at) AS first_order_at,
      max(o.created_at) AS last_order_at,
      min(o.service_date) FILTER (WHERE o.service_date >= current_date) AS next_service_date,
      bool_or(o.bucket <> 'history') OR public.partner_contact_always_visible() AS contact_visible,
      (array_agg(o.customer_phone ORDER BY o.created_at DESC) FILTER (WHERE NULLIF(btrim(o.customer_phone), '') IS NOT NULL))[1] AS customer_phone,
      (array_agg(o.customer_email ORDER BY o.created_at DESC) FILTER (WHERE NULLIF(btrim(o.customer_email), '') IS NOT NULL))[1] AS customer_email
    FROM o
    WHERE o.customer_key IS NOT NULL
    GROUP BY o.customer_key
  )
  SELECT
    g.customer_name, g.orders_count, g.first_order_at, g.last_order_at, g.next_service_date,
    CASE WHEN g.contact_visible THEN g.customer_phone END,
    CASE WHEN g.contact_visible THEN g.customer_email END
  FROM grouped g
  ORDER BY g.last_order_at DESC;
$$;

REVOKE ALL ON FUNCTION public.agency_customers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_customers() TO authenticated;

-- Avis : réponse du partenaire, enregistrée avec l'avis.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS partner_reply TEXT CHECK (partner_reply IS NULL OR char_length(partner_reply) <= 2000),
  ADD COLUMN IF NOT EXISTS partner_replied_at TIMESTAMPTZ;

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
  SELECT r.id, r.created_at, s.name, r.rating, r.comment,
    COALESCE(NULLIF(btrim(r.reviewer_name), ''), 'Client'), r.status, r.partner_reply, r.partner_replied_at
  FROM public.reviews r
  JOIN public.services s ON s.id = r.service_id
  WHERE s.agency_id = public.current_partner_agency_id()
    AND r.status <> 'rejected'
  ORDER BY r.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.agency_reviews() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_reviews() TO authenticated;

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
  FROM public.services s
  WHERE r.id = p_review_id
    AND s.id = r.service_id
    AND s.agency_id = public.current_partner_agency_id()
    AND r.status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avis introuvable ou pas encore publié' USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.agency_reply_review(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_reply_review(UUID, TEXT) TO authenticated;

-- Tickets d'assistance des partenaires. Le message part aussi par e-mail
-- au support (send-support-email) ; le suivi se fait depuis cette table.
CREATE TABLE IF NOT EXISTS public.partner_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  topic TEXT NOT NULL DEFAULT 'other'
    CHECK (topic IN ('finances', 'bookings', 'catalog', 'account', 'technical', 'other')),
  subject TEXT NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 3 AND 150),
  message TEXT NOT NULL CHECK (char_length(btrim(message)) BETWEEN 10 AND 5000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_support_tickets_agency ON public.partner_support_tickets(agency_id, created_at DESC);

ALTER TABLE public.partner_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners read their tickets" ON public.partner_support_tickets;
CREATE POLICY "Partners read their tickets" ON public.partner_support_tickets
  FOR SELECT USING (public.is_agency_owner(auth.uid(), agency_id));
DROP POLICY IF EXISTS "Partners open tickets" ON public.partner_support_tickets;
CREATE POLICY "Partners open tickets" ON public.partner_support_tickets
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'sub_agency')
    AND public.is_agency_owner(auth.uid(), agency_id)
    AND created_by = auth.uid()
    AND status = 'open'
  );
DROP POLICY IF EXISTS "Admins manage partner tickets" ON public.partner_support_tickets;
CREATE POLICY "Admins manage partner tickets" ON public.partner_support_tickets
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
