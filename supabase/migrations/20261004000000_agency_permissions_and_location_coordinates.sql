-- Admin-managed partner capabilities. Existing partner access stays enabled
-- by default so this migration does not remove any current agency feature.
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS enabled_features jsonb NOT NULL DEFAULT '{
    "services": true,
    "activities": true,
    "stays": true,
    "restaurants": true,
    "artisans": true,
    "wellness": true,
    "promotions": true
  }'::jsonb;

UPDATE public.agencies
SET enabled_features = '{
  "services": true,
  "activities": true,
  "stays": true,
  "restaurants": true,
  "artisans": true,
  "wellness": true,
  "promotions": true
}'::jsonb || COALESCE(enabled_features, '{}'::jsonb)
WHERE enabled_features IS NULL;

-- Coordinates are optional; shared input forms populate them when a pasted
-- Maps URL contains coordinates or when the partner enters the pin manually.
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS maps_url text,
  ADD COLUMN IF NOT EXISTS available_dates date[] NOT NULL DEFAULT '{}';
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS maps_url text,
  ADD COLUMN IF NOT EXISTS available_dates date[] NOT NULL DEFAULT '{}';
ALTER TABLE public.stays
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS maps_url text,
  ADD COLUMN IF NOT EXISTS available_dates date[] NOT NULL DEFAULT '{}';
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS maps_url text;
ALTER TABLE public.artisans
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS maps_url text;
ALTER TABLE public.wellness_services
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS maps_url text;

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['services', 'activities', 'stays', 'restaurants', 'artisans', 'wellness_services'] LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', target_table, target_table || '_latitude_range');
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90)', target_table, target_table || '_latitude_range');
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', target_table, target_table || '_longitude_range');
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)', target_table, target_table || '_longitude_range');
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.agency_feature_enabled(_agency_id uuid, _feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((a.enabled_features ->> _feature)::boolean, true)
  FROM public.agencies a
  WHERE a.id = _agency_id AND a.is_active = true
$$;

GRANT EXECUTE ON FUNCTION public.agency_feature_enabled(uuid, text) TO authenticated;

-- Keep partner-owned rows readable while the associated menu/form is disabled.
-- RLS independently blocks writes, including requests sent outside the UI.
DROP POLICY IF EXISTS "Sub-agencies can manage their own services" ON public.services;
CREATE POLICY "Sub-agencies can read their own services" ON public.services
  FOR SELECT USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id));
CREATE POLICY "Sub-agencies can insert services when enabled" ON public.services
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'services'));
CREATE POLICY "Sub-agencies can update services when enabled" ON public.services
  FOR UPDATE USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'services'))
  WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'services'));
CREATE POLICY "Sub-agencies can delete services when enabled" ON public.services
  FOR DELETE USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'services'));

DROP POLICY IF EXISTS "Sub-agencies can manage their own activities" ON public.activities;
CREATE POLICY "Sub-agencies can read their own activities" ON public.activities
  FOR SELECT USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id));
CREATE POLICY "Sub-agencies can insert activities when enabled" ON public.activities
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'activities'));
CREATE POLICY "Sub-agencies can update activities when enabled" ON public.activities
  FOR UPDATE USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'activities'))
  WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'activities'));
CREATE POLICY "Sub-agencies can delete activities when enabled" ON public.activities
  FOR DELETE USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'activities'));

DROP POLICY IF EXISTS "Sub-agencies can manage their own stays" ON public.stays;
CREATE POLICY "Sub-agencies can read their own stays" ON public.stays
  FOR SELECT USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id));
CREATE POLICY "Sub-agencies can insert stays when enabled" ON public.stays
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'stays'));
CREATE POLICY "Sub-agencies can update stays when enabled" ON public.stays
  FOR UPDATE USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'stays'))
  WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'stays'));
CREATE POLICY "Sub-agencies can delete stays when enabled" ON public.stays
  FOR DELETE USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'stays'));

DROP POLICY IF EXISTS "Sub-agencies can manage their own promotions" ON public.promotions;
CREATE POLICY "Sub-agencies can read their own promotions" ON public.promotions
  FOR SELECT USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id));
CREATE POLICY "Sub-agencies can insert promotions when enabled" ON public.promotions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'promotions'));
CREATE POLICY "Sub-agencies can update promotions when enabled" ON public.promotions
  FOR UPDATE USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'promotions'))
  WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'promotions'));
CREATE POLICY "Sub-agencies can delete promotions when enabled" ON public.promotions
  FOR DELETE USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'promotions'));

DROP POLICY IF EXISTS "Agency owners manage their own restaurants" ON public.restaurants;
CREATE POLICY "Agency owners read their own restaurants" ON public.restaurants
  FOR SELECT USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id));
CREATE POLICY "Agency owners manage enabled restaurants" ON public.restaurants
  FOR ALL USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'restaurants'))
  WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'restaurants'));

DROP POLICY IF EXISTS "Agency owners manage their own artisans" ON public.artisans;
CREATE POLICY "Agency owners read their own artisans" ON public.artisans
  FOR SELECT USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id));
CREATE POLICY "Agency owners manage enabled artisans" ON public.artisans
  FOR ALL USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'artisans'))
  WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'artisans'));

DROP POLICY IF EXISTS "Agency owners manage their own wellness services" ON public.wellness_services;
CREATE POLICY "Agency owners read their own wellness services" ON public.wellness_services
  FOR SELECT USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id));
CREATE POLICY "Agency owners manage enabled wellness services" ON public.wellness_services
  FOR ALL USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'wellness'))
  WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id) AND public.agency_feature_enabled(agency_id, 'wellness'));

DROP POLICY IF EXISTS "Artisan owners manage their orders" ON public.artisan_orders;
CREATE POLICY "Artisan owners manage their orders"
  ON public.artisan_orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.artisans ar
    WHERE ar.id = artisan_id AND public.is_agency_owner(auth.uid(), ar.agency_id)
      AND public.agency_feature_enabled(ar.agency_id, 'artisans')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.artisans ar
    WHERE ar.id = artisan_id AND public.is_agency_owner(auth.uid(), ar.agency_id)
      AND public.agency_feature_enabled(ar.agency_id, 'artisans')
  ));
