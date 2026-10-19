-- Local artisans showcase. Unlike restaurants/cars/tours this isn't a
-- reservation or checkout flow - the brief was to "mettre en valeur les
-- artisans locaux" (highlight local artisans), so this is a browsable
-- profile + product gallery that drives a direct contact (phone/WhatsApp)
-- rather than an in-app purchase/cart/shipping system, which would be a
-- much larger, separately-scoped feature.
--
-- Reuses the agency/sub_agency ownership model already used for cars/tours/
-- restaurants: an existing agency can also showcase an artisan, same
-- has_role('sub_agency') + is_agency_owner() gate.
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI
-- direct-connection path is broken for this project - run this file
-- manually in the Supabase Dashboard SQL Editor.

CREATE TABLE IF NOT EXISTS public.artisans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  craft_type TEXT NOT NULL,
  bio TEXT,
  location TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  image_url TEXT,
  gallery TEXT[] NOT NULL DEFAULT '{}',
  -- Lightweight product catalog: [{name, description, price, currency,
  -- image_url}, ...]. No stock/cart/checkout - browsing a product just
  -- surfaces the artisan's contact info, matching the "showcase, not
  -- marketplace" scope of this feature.
  products JSONB NOT NULL DEFAULT '[]',
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artisans_agency_id ON public.artisans(agency_id);

ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active artisans are viewable by everyone" ON public.artisans;
CREATE POLICY "Active artisans are viewable by everyone"
  ON public.artisans FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Agency owners manage their own artisans" ON public.artisans;
CREATE POLICY "Agency owners manage their own artisans"
  ON public.artisans FOR ALL
  USING (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id))
  WITH CHECK (public.has_role(auth.uid(), 'sub_agency') AND public.is_agency_owner(auth.uid(), agency_id));

DROP POLICY IF EXISTS "Admins manage all artisans" ON public.artisans;
CREATE POLICY "Admins manage all artisans"
  ON public.artisans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS set_updated_at_artisans ON public.artisans;
CREATE TRIGGER set_updated_at_artisans
  BEFORE UPDATE ON public.artisans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
