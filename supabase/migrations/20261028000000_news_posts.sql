-- Page Actualités : toute l'actualité Bossiz au même endroit (/actualites).
--
-- Articles rédigés et publiés depuis /admin/actualites : annonces,
-- nouveautés du site, nouveaux partenaires, offres, événements, presse.
-- Un article peut être programmé (published_at dans le futur) et mis à la
-- une. Le texte suit le même format que la page Culture (paragraphes,
-- « ## Intertitre », listes « - »).
--
-- À exécuter dans le SQL Editor avant de déployer le site.

CREATE TABLE IF NOT EXISTS public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  category TEXT NOT NULL DEFAULT 'annonce'
    CHECK (category IN ('annonce', 'nouveaute', 'partenaire', 'offre', 'evenement', 'presse')),
  excerpt TEXT NOT NULL CHECK (length(btrim(excerpt)) BETWEEN 1 AND 400),
  content TEXT,
  cover_image_url TEXT,
  cover_caption TEXT,
  -- Bouton d'action en fin d'article (« Réserver », « Découvrir »...) :
  -- chemin du site (/hotels-partenaires) ou adresse https.
  cta_label TEXT CHECK (cta_label IS NULL OR length(btrim(cta_label)) BETWEEN 1 AND 60),
  cta_url TEXT CHECK (cta_url IS NULL OR cta_url ~ '^(/|https://)'),
  pinned BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_posts_published_idx ON public.news_posts (published, published_at DESC);

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

-- Visible par tous une fois publié et la date de publication atteinte.
DROP POLICY IF EXISTS "Public reads published news" ON public.news_posts;
CREATE POLICY "Public reads published news" ON public.news_posts
  FOR SELECT USING (published = true AND published_at <= now());
DROP POLICY IF EXISTS "Admins manage news" ON public.news_posts;
CREATE POLICY "Admins manage news" ON public.news_posts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_news_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_news_post ON public.news_posts;
CREATE TRIGGER touch_news_post BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_news_post();

-- En-tête de la page (modifiable dans /admin/actualites).
INSERT INTO public.site_config (config_key, config_value, category, description)
VALUES (
  'news_page',
  '{"title": "Actualités", "subtitle": "Toute l''actualité Bossiz+ : nouveautés, partenaires, offres et événements."}'::jsonb,
  'content',
  'Page Actualités : titre et sous-titre'
)
ON CONFLICT (config_key) DO NOTHING;

-- Deux premiers articles, en brouillon : à relire puis publier depuis
-- /admin/actualites.
INSERT INTO public.news_posts (slug, title, category, excerpt, content, cta_label, cta_url, pinned, published)
VALUES
(
  'notez-vos-prestations',
  'Notez vos séjours, sorties et achats sur Bossiz+',
  'nouveaute',
  'Hôtels, voitures, circuits, activités, restaurants, bien-être et artisanat : après chaque prestation, donnez votre avis et aidez les autres voyageurs à bien choisir.',
  'Vos avis comptent. Après chaque prestation réservée sur Bossiz+, vous pouvez désormais la noter, quelle qu''elle soit : séjour à l''hôtel, location de voiture, circuit, activité, table au restaurant, soin bien-être ou création d''artisan.

## Comment ça marche

- Une fois la prestation terminée, elle apparaît dans « Mes avis », dans votre espace client.
- Vous recevez aussi une invitation par e-mail dans les jours qui suivent.
- Choisissez une note de 1 à 5 étoiles et racontez votre expérience.

## Des avis vérifiés

Seuls les clients ayant réellement profité de la prestation peuvent la noter, une seule fois. Chaque avis est relu par notre équipe avant sa publication, et nos partenaires peuvent y répondre.',
  'Donner mon avis',
  '/mes-avis',
  true,
  false
),
(
  'nouvel-espace-partenaire',
  'Un espace partenaire repensé pour chaque activité',
  'partenaire',
  'Hôtels, restaurants, garages, artisans, bien-être : chaque partenaire dispose désormais d''un espace adapté à son activité, avec le détail de ses revenus et commissions.',
  'Nous avons repensé l''espace partenaire à partir de vos retours. Chaque partenaire retrouve désormais un menu limité à son activité, sans rubriques inutiles.

## Ce qui change

- Un tableau de bord avec les réservations du jour, les revenus du mois et la note moyenne.
- Toutes les demandes au même endroit : nouvelles, en cours et historique.
- Une rubrique Finances complète : pour chaque transaction, le montant brut, le taux de commission, la commission et le montant net qui vous revient.
- Des relevés mensuels à télécharger, et une assistance accessible depuis votre espace.

## Rejoindre Bossiz+

Vous avez un hôtel, un restaurant, une activité ou un savoir-faire à partager ? Rejoignez nos partenaires.',
  'Devenir partenaire',
  '/devenir-partenaire',
  false,
  false
)
ON CONFLICT (slug) DO NOTHING;
