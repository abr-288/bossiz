-- Page éditoriale « Culture » (/culture), gérée depuis /admin/culture.
--
-- - culture_entries : lieux, festivals, traditions... présentés par
--   catégorie ; seules les entrées publiées sont visibles du public ;
-- - site_config 'culture_page' : titre, sous-titre, introduction et image
--   d'en-tête de la page.
-- Les entrées ci-dessous servent de point de départ et sont à relire et
-- illustrer depuis l'admin.
--
-- À exécuter dans le SQL Editor.

CREATE TABLE IF NOT EXISTS public.culture_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  category TEXT NOT NULL CHECK (category IN ('patrimoine', 'festivals', 'musees', 'arts', 'musique_danse', 'gastronomie')),
  location TEXT,
  -- Quand y aller / dates (ex. « Fin octobre, chaque année »).
  period TEXT,
  summary TEXT NOT NULL CHECK (length(btrim(summary)) BETWEEN 1 AND 400),
  content TEXT,
  image_url TEXT,
  link_url TEXT CHECK (link_url IS NULL OR link_url ~ '^https?://'),
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS culture_entries_published_idx
  ON public.culture_entries (published, category, sort_order);

DROP TRIGGER IF EXISTS set_updated_at_culture_entries ON public.culture_entries;
CREATE TRIGGER set_updated_at_culture_entries
  BEFORE UPDATE ON public.culture_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.culture_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published culture entries" ON public.culture_entries;
CREATE POLICY "Public can view published culture entries" ON public.culture_entries
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins manage culture entries" ON public.culture_entries;
CREATE POLICY "Admins manage culture entries" ON public.culture_entries
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_config (config_key, config_value, category, description)
VALUES (
  'culture_page',
  jsonb_build_object(
    'title', 'La culture ivoirienne',
    'subtitle', 'Patrimoine, festivals, arts et traditions à découvrir pendant votre séjour',
    'intro', 'Des masques de l''Ouest aux rues coloniales de Grand-Bassam, des grands festivals d''Abidjan aux saveurs de la cuisine locale : voici notre sélection pour vivre la Côte d''Ivoire de l''intérieur.',
    'heroImage', ''
  ),
  'content',
  'Page Culture : titre, sous-titre, introduction et image d''en-tête'
)
ON CONFLICT (config_key) DO NOTHING;

-- Contenu de départ, inséré une seule fois (table vide).
INSERT INTO public.culture_entries (title, category, location, period, summary, content, featured, sort_order)
SELECT * FROM (VALUES
  ('Ville historique de Grand-Bassam', 'patrimoine', 'Grand-Bassam', 'Toute l''année',
   'Première capitale coloniale du pays, inscrite au patrimoine mondial de l''UNESCO : maisons à arcades, quartier France et bord de lagune.',
   'Le quartier France de Grand-Bassam conserve ses bâtiments de l''époque coloniale, dont l''ancien palais du gouverneur qui abrite le Musée national du costume. À une heure d''Abidjan, la visite se combine facilement avec une journée à la plage.',
   true, 10),
  ('Basilique Notre-Dame de la Paix', 'patrimoine', 'Yamoussoukro', 'Toute l''année',
   'L''une des plus grandes églises du monde, consacrée en 1990, avec sa coupole et ses vitraux monumentaux.',
   'Inspirée de Saint-Pierre de Rome, la basilique domine Yamoussoukro, capitale politique du pays. Des visites guidées présentent son architecture et ses vitraux.',
   true, 20),
  ('Mosquées de style soudanais du nord', 'patrimoine', 'Kong et région du nord', 'De novembre à mars (saison sèche)',
   'Mosquées en terre crue hérissées de poutres de bois, inscrites au patrimoine mondial de l''UNESCO.',
   'Ces mosquées en banco, dont celle de Kong, témoignent des routes commerciales transsahariennes. Leur enduit est entretenu régulièrement par les communautés locales.',
   false, 30),
  ('Cathédrale Saint-Paul', 'patrimoine', 'Plateau, Abidjan', 'Toute l''année',
   'Silhouette emblématique du Plateau, face à la lagune Ébrié, à l''architecture moderne audacieuse.',
   NULL, false, 40),
  ('Fête de l''Abissa', 'festivals', 'Grand-Bassam', 'Fin octobre – début novembre, chaque année',
   'Grande fête traditionnelle du peuple N''zima : tambours, danses et défilés pendant une semaine.',
   'L''Abissa marque la nouvelle année chez les N''zima. Pendant une semaine, la ville vit au rythme des tam-tams et des danses ; c''est aussi un moment de pardon et de réconciliation.',
   true, 50),
  ('FEMUA – Festival des Musiques Urbaines d''Anoumabo', 'festivals', 'Abidjan', 'Chaque année',
   'Le grand festival de musiques urbaines créé par Magic System, avec des artistes de toute l''Afrique.',
   NULL, false, 60),
  ('MASA – Marché des Arts du Spectacle', 'festivals', 'Abidjan', 'Tous les deux ans',
   'Rendez-vous des arts de la scène africains : théâtre, danse, musique et conte.',
   NULL, false, 70),
  ('Musée des Civilisations de Côte d''Ivoire', 'musees', 'Plateau, Abidjan', 'Toute l''année',
   'Masques, statues, instruments et objets du quotidien des peuples ivoiriens.',
   'Le musée présente la diversité des cultures du pays à travers ses collections d''art traditionnel. Une bonne introduction avant de partir à la découverte des régions.',
   true, 80),
  ('Art contemporain à Abidjan', 'musees', 'Abidjan', 'Toute l''année',
   'Fondations et galeries font d''Abidjan une scène majeure de l''art contemporain africain.',
   'La Fondation Donwahi, la Rotonde des Arts et de nombreuses galeries exposent artistes ivoiriens et africains. Vérifiez les expositions en cours avant votre visite.',
   false, 90),
  ('Les masques Dan de l''Ouest', 'arts', 'Man et région du Tonkpi', 'Toute l''année',
   'Dans la région de Man, les masques sont au cœur de la vie sociale et des cérémonies.',
   'Masques danseurs, masques échassiers : les sorties de masques accompagnent fêtes et rites. La région offre aussi des paysages de montagnes et de cascades.',
   false, 100),
  ('Le Zaouli', 'musique_danse', 'Région de Bouaflé et Zuénoula', 'Lors des fêtes et cérémonies',
   'Danse de masque gouro à la virtuosité impressionnante, inscrite au patrimoine culturel immatériel de l''UNESCO.',
   NULL, true, 110),
  ('Attiéké, alloco et garba', 'gastronomie', 'Partout dans le pays', 'Toute l''année',
   'Semoule de manioc, bananes plantains frites, poisson braisé : les incontournables de la cuisine ivoirienne.',
   'Dans les maquis, on partage le poisson ou le poulet braisé avec de l''attiéké et de l''alloco. Le garba (attiéké et thon frit) est le plat populaire par excellence.',
   false, 120)
) AS seed(title, category, location, period, summary, content, featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.culture_entries);
