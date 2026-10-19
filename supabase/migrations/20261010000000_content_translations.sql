-- Traduction automatique des contenus saisis dans l'admin et l'espace partenaire.
--
-- Chaque table reçoit une colonne `translations` remplie par l'Edge Function
-- translate-content :
--   {
--     "en":     { "<champ>": "<texte>" | ["<texte>", ...] },
--     "zh":     { ... },
--     "src":    { "<champ>": "<empreinte du texte français>" },  -- retraduit si le français change
--     "manual": { "en": ["<champ>"], "zh": ["<champ>"] }        -- corrections faites à la main
--   }
-- Le site affiche la langue du visiteur et revient au français si une
-- traduction manque. La colonne n'est écrite que par la fonction (clé de
-- service) et par l'écran « Traductions » de l'admin : aucune politique RLS
-- supplémentaire n'est nécessaire, les politiques existantes s'appliquent.

ALTER TABLE public.advertisements    ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.promotions        ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.car_partner_plans ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.homepage_features ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.services          ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.activities        ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.stays             ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.restaurants       ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.artisans          ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.wellness_services ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
