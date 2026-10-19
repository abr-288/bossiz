-- Page Culture : articles illustrés de photos réelles.
--
-- Ajoute aux entrées une adresse de page (slug), la légende et le crédit de
-- la photo principale, et une galerie de photos légendées et créditées
-- ([{url, caption, credit, sourceUrl}]). Réécrit les 12 entrées de départ en
-- articles, illustrés de photos de Wikimedia Commons sous licence libre
-- (CC0, CC BY, CC BY-SA : l'auteur et la licence sont affichés sous chaque
-- photo, avec un lien vers sa page source). L'entrée « Art contemporain à
-- Abidjan », sans photo libre disponible, devient « Le pagne baoulé ».
--
-- Une entrée est mise à jour par son slug, ou par son titre de départ ;
-- si elle a été supprimée entre-temps, elle est recréée.
--
-- À exécuter dans le SQL Editor.

ALTER TABLE public.culture_entries
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS image_caption TEXT,
  ADD COLUMN IF NOT EXISTS image_credit TEXT,
  ADD COLUMN IF NOT EXISTS image_source_url TEXT CHECK (image_source_url IS NULL OR image_source_url ~ '^https?://'),
  ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.culture_entries DROP CONSTRAINT IF EXISTS culture_entries_slug_format;
ALTER TABLE public.culture_entries
  ADD CONSTRAINT culture_entries_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

CREATE UNIQUE INDEX IF NOT EXISTS culture_entries_slug_idx ON public.culture_entries (slug);

-- Grand-Bassam, la première capitale
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'grand-bassam',
    title = 'Grand-Bassam, la première capitale',
    category = 'patrimoine',
    location = 'Grand-Bassam, à une quarantaine de kilomètres à l''est d''Abidjan',
    period = 'Toute l''année – fin octobre pour la fête de l''Abissa',
    summary = 'Inscrite au patrimoine mondial de l''UNESCO en 2012, la vieille ville de Grand-Bassam raconte, entre lagune et océan, la naissance de la Côte d''Ivoire moderne.',
    content = 'Il suffit d''une heure de route depuis Abidjan pour changer d''époque. Dans le quartier France de Grand-Bassam, les grandes maisons à galeries et à vérandas, les façades colorées et les jardins rappellent la ville portuaire qui fut, à la fin du XIXe siècle, le cœur administratif et commercial de la colonie.

## Une capitale née du commerce

Les Français s''installent à Grand-Bassam à partir de 1843, à l''embouchure du fleuve Comoé, par où descendaient les caravanes venues de la forêt et de la savane. Lorsque la Côte d''Ivoire devient une colonie autonome en mars 1893, la ville en devient la capitale.

Le règne est bref : une épidémie de fièvre jaune frappe la ville en 1899 et la capitale part pour Bingerville en 1900. Grand-Bassam reste pourtant le premier port de la colonie pendant plusieurs décennies et garde son tribunal jusqu''en 1954.

## Une ville coloniale planifiée

La ville historique est organisée en quartiers spécialisés : le commerce, l''administration, les habitations européennes et le village de pêcheurs n''zima. C''est cet ensemble, et ce qu''il dit des relations entre Européens et Africains puis du mouvement vers l''indépendance, que l''UNESCO a inscrit au patrimoine mondial en 2012.

## Le Musée national du costume

Le bâtiment le plus emblématique est l''ancien palais du gouverneur. Monté à partir d''éléments métalliques préfabriqués livrés en 1893, il a accueilli les quatre premiers gouverneurs de la colonie jusqu''en 1902. Restauré à la fin des années 1970, il est devenu le Musée national du costume : tenues, parures et objets y présentent la diversité des peuples ivoiriens.

## Que voir sur place

- Le quartier France, à pied, de préférence le matin quand la chaleur est encore douce.
- Le Musée national du costume, dans l''ancien palais du gouverneur.
- Le palais royal des N''zima et la place de l''Abissa, où se tient chaque année la grande fête du nouvel an.
- Le village artisanal, présenté comme le plus grand d''Afrique de l''Ouest, pour les tissus, sculptures et bijoux.

## Bon à savoir

L''océan est souvent agité à Grand-Bassam : renseignez-vous auprès des habitants avant de vous baigner. Pour comprendre l''histoire de chaque bâtiment, une visite avec un guide local vaut largement le détour.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Mus%C3%A9e_National_du_costume_de_Grand_Bassam_1.jpg/1920px-Mus%C3%A9e_National_du_costume_de_Grand_Bassam_1.jpg',
    image_caption = 'L''ancien palais du gouverneur, aujourd''hui Musée national du costume.',
    image_credit = 'Photo : Modjou – CC BY-SA 4.0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Mus%C3%A9e_National_du_costume_de_Grand_Bassam_1.jpg',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/2021-08-10_Historic_Town_of_Grand-Bassam_by_Benoit_Soubeyran_01.jpg/1920px-2021-08-10_Historic_Town_of_Grand-Bassam_by_Benoit_Soubeyran_01.jpg", "caption": "Une rue de la ville historique, inscrite au patrimoine mondial en 2012.", "credit": "Photo : Benoit Soubeyran – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:2021-08-10_Historic_Town_of_Grand-Bassam_by_Benoit_Soubeyran_01.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Entr%C3%A9e_du_palais_royal_de_Grand-Bassam.jpg/1920px-Entr%C3%A9e_du_palais_royal_de_Grand-Bassam.jpg", "caption": "L''entrée du palais royal des N''zima, gardiens des traditions de la ville.", "credit": "Photo : Aristidek5maya – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Entr%C3%A9e_du_palais_royal_de_Grand-Bassam.jpg"}]'::jsonb,
    featured = true,
    sort_order = 10
  WHERE slug = 'grand-bassam' OR (slug IS NULL AND title = 'Ville historique de Grand-Bassam')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'grand-bassam', 'Grand-Bassam, la première capitale', 'patrimoine', 'Grand-Bassam, à une quarantaine de kilomètres à l''est d''Abidjan', 'Toute l''année – fin octobre pour la fête de l''Abissa', 'Inscrite au patrimoine mondial de l''UNESCO en 2012, la vieille ville de Grand-Bassam raconte, entre lagune et océan, la naissance de la Côte d''Ivoire moderne.', 'Il suffit d''une heure de route depuis Abidjan pour changer d''époque. Dans le quartier France de Grand-Bassam, les grandes maisons à galeries et à vérandas, les façades colorées et les jardins rappellent la ville portuaire qui fut, à la fin du XIXe siècle, le cœur administratif et commercial de la colonie.

## Une capitale née du commerce

Les Français s''installent à Grand-Bassam à partir de 1843, à l''embouchure du fleuve Comoé, par où descendaient les caravanes venues de la forêt et de la savane. Lorsque la Côte d''Ivoire devient une colonie autonome en mars 1893, la ville en devient la capitale.

Le règne est bref : une épidémie de fièvre jaune frappe la ville en 1899 et la capitale part pour Bingerville en 1900. Grand-Bassam reste pourtant le premier port de la colonie pendant plusieurs décennies et garde son tribunal jusqu''en 1954.

## Une ville coloniale planifiée

La ville historique est organisée en quartiers spécialisés : le commerce, l''administration, les habitations européennes et le village de pêcheurs n''zima. C''est cet ensemble, et ce qu''il dit des relations entre Européens et Africains puis du mouvement vers l''indépendance, que l''UNESCO a inscrit au patrimoine mondial en 2012.

## Le Musée national du costume

Le bâtiment le plus emblématique est l''ancien palais du gouverneur. Monté à partir d''éléments métalliques préfabriqués livrés en 1893, il a accueilli les quatre premiers gouverneurs de la colonie jusqu''en 1902. Restauré à la fin des années 1970, il est devenu le Musée national du costume : tenues, parures et objets y présentent la diversité des peuples ivoiriens.

## Que voir sur place

- Le quartier France, à pied, de préférence le matin quand la chaleur est encore douce.
- Le Musée national du costume, dans l''ancien palais du gouverneur.
- Le palais royal des N''zima et la place de l''Abissa, où se tient chaque année la grande fête du nouvel an.
- Le village artisanal, présenté comme le plus grand d''Afrique de l''Ouest, pour les tissus, sculptures et bijoux.

## Bon à savoir

L''océan est souvent agité à Grand-Bassam : renseignez-vous auprès des habitants avant de vous baigner. Pour comprendre l''histoire de chaque bâtiment, une visite avec un guide local vaut largement le détour.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Mus%C3%A9e_National_du_costume_de_Grand_Bassam_1.jpg/1920px-Mus%C3%A9e_National_du_costume_de_Grand_Bassam_1.jpg', 'L''ancien palais du gouverneur, aujourd''hui Musée national du costume.', 'Photo : Modjou – CC BY-SA 4.0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Mus%C3%A9e_National_du_costume_de_Grand_Bassam_1.jpg', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/2021-08-10_Historic_Town_of_Grand-Bassam_by_Benoit_Soubeyran_01.jpg/1920px-2021-08-10_Historic_Town_of_Grand-Bassam_by_Benoit_Soubeyran_01.jpg", "caption": "Une rue de la ville historique, inscrite au patrimoine mondial en 2012.", "credit": "Photo : Benoit Soubeyran – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:2021-08-10_Historic_Town_of_Grand-Bassam_by_Benoit_Soubeyran_01.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Entr%C3%A9e_du_palais_royal_de_Grand-Bassam.jpg/1920px-Entr%C3%A9e_du_palais_royal_de_Grand-Bassam.jpg", "caption": "L''entrée du palais royal des N''zima, gardiens des traditions de la ville.", "credit": "Photo : Aristidek5maya – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Entr%C3%A9e_du_palais_royal_de_Grand-Bassam.jpg"}]'::jsonb, true, true, 10
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- Basilique Notre-Dame-de-la-Paix de Yamoussoukro
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'basilique-yamoussoukro',
    title = 'Basilique Notre-Dame-de-la-Paix de Yamoussoukro',
    category = 'patrimoine',
    location = 'Yamoussoukro, à environ 240 km au nord d''Abidjan par l''autoroute du Nord',
    period = 'Toute l''année – visites guidées sur place',
    summary = 'Haute de 158 mètres, la basilique de Yamoussoukro est l''un des plus grands édifices chrétiens du monde. Un monument hors norme, au milieu de la savane.',
    content = 'En arrivant à Yamoussoukro, on aperçoit d''abord un dôme immense posé sur la ligne d''horizon. La basilique Notre-Dame-de-la-Paix, voulue par Félix Houphouët-Boigny, premier président du pays, dans sa ville natale, est l''un des plus grands édifices chrétiens au monde.

## Un chantier hors norme

Conçue par l''architecte ivoirien Pierre Fakhoury, la basilique s''inspire directement de Saint-Pierre de Rome. Sa première pierre est bénie par le pape Jean-Paul II en 1985 ; le chantier, mené par une vingtaine d''entreprises ivoiriennes et étrangères, dure de 1986 à 1989. Jean-Paul II revient la consacrer le 10 septembre 1990.

Le coût de l''ouvrage, estimé à 40 milliards de francs CFA, a suscité de vifs débats à l''époque. Le président a affirmé l''avoir financé sur sa fortune personnelle.

## Des dimensions vertigineuses

- 158 mètres de hauteur et un dôme de 90 mètres de diamètre.
- 150 mètres de largeur : le Livre Guinness des records l''a désignée en 1989 comme l''édifice chrétien le plus large du monde.
- Une esplanade de 30 000 m² bordée de 128 colonnes de 21 mètres de haut.
- Jusqu''à 18 000 fidèles à l''intérieur, et des dizaines de milliers sur le parvis.

## La lumière des vitraux

À l''intérieur, la lumière traverse l''une des plus vastes surfaces de vitraux au monde. Les sièges en bois d''iroko et les milliers de petites croix qui ornent les murs ne sont pas seulement décoratifs : ils participent à l''acoustique de la nef.

## Bon à savoir

Des visites guidées sont proposées sur place. La basilique reste un lieu de culte : une tenue correcte est demandée. Comptez une demi-journée avec la route depuis Abidjan, ou profitez-en pour découvrir aussi les lacs et les avenues de Yamoussoukro, la capitale politique du pays.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_16.jpg/1920px-Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_16.jpg',
    image_caption = 'Le dôme, inspiré de celui de Saint-Pierre de Rome, culmine à 158 mètres.',
    image_credit = 'Photo : Didierwiki – CC0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_16.jpg',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_9.jpg/1920px-Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_9.jpg", "caption": "La colonnade qui entoure l''esplanade, vue depuis la basilique.", "credit": "Photo : Didierwiki – CC0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_9.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Notre-Dame-de-la-Paix_de_Yamoussoukro_2.jpg/1920px-Notre-Dame-de-la-Paix_de_Yamoussoukro_2.jpg", "caption": "La basilique se détache au loin derrière les lacs de Yamoussoukro.", "credit": "Photo : Gregor Rom – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Notre-Dame-de-la-Paix_de_Yamoussoukro_2.jpg"}]'::jsonb,
    featured = true,
    sort_order = 20
  WHERE slug = 'basilique-yamoussoukro' OR (slug IS NULL AND title = 'Basilique Notre-Dame de la Paix')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'basilique-yamoussoukro', 'Basilique Notre-Dame-de-la-Paix de Yamoussoukro', 'patrimoine', 'Yamoussoukro, à environ 240 km au nord d''Abidjan par l''autoroute du Nord', 'Toute l''année – visites guidées sur place', 'Haute de 158 mètres, la basilique de Yamoussoukro est l''un des plus grands édifices chrétiens du monde. Un monument hors norme, au milieu de la savane.', 'En arrivant à Yamoussoukro, on aperçoit d''abord un dôme immense posé sur la ligne d''horizon. La basilique Notre-Dame-de-la-Paix, voulue par Félix Houphouët-Boigny, premier président du pays, dans sa ville natale, est l''un des plus grands édifices chrétiens au monde.

## Un chantier hors norme

Conçue par l''architecte ivoirien Pierre Fakhoury, la basilique s''inspire directement de Saint-Pierre de Rome. Sa première pierre est bénie par le pape Jean-Paul II en 1985 ; le chantier, mené par une vingtaine d''entreprises ivoiriennes et étrangères, dure de 1986 à 1989. Jean-Paul II revient la consacrer le 10 septembre 1990.

Le coût de l''ouvrage, estimé à 40 milliards de francs CFA, a suscité de vifs débats à l''époque. Le président a affirmé l''avoir financé sur sa fortune personnelle.

## Des dimensions vertigineuses

- 158 mètres de hauteur et un dôme de 90 mètres de diamètre.
- 150 mètres de largeur : le Livre Guinness des records l''a désignée en 1989 comme l''édifice chrétien le plus large du monde.
- Une esplanade de 30 000 m² bordée de 128 colonnes de 21 mètres de haut.
- Jusqu''à 18 000 fidèles à l''intérieur, et des dizaines de milliers sur le parvis.

## La lumière des vitraux

À l''intérieur, la lumière traverse l''une des plus vastes surfaces de vitraux au monde. Les sièges en bois d''iroko et les milliers de petites croix qui ornent les murs ne sont pas seulement décoratifs : ils participent à l''acoustique de la nef.

## Bon à savoir

Des visites guidées sont proposées sur place. La basilique reste un lieu de culte : une tenue correcte est demandée. Comptez une demi-journée avec la route depuis Abidjan, ou profitez-en pour découvrir aussi les lacs et les avenues de Yamoussoukro, la capitale politique du pays.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_16.jpg/1920px-Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_16.jpg', 'Le dôme, inspiré de celui de Saint-Pierre de Rome, culmine à 158 mètres.', 'Photo : Didierwiki – CC0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_16.jpg', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_9.jpg/1920px-Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_9.jpg", "caption": "La colonnade qui entoure l''esplanade, vue depuis la basilique.", "credit": "Photo : Didierwiki – CC0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Basilique_notre_Dame_de_la_Paix_de_Yamoussoukro_9.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Notre-Dame-de-la-Paix_de_Yamoussoukro_2.jpg/1920px-Notre-Dame-de-la-Paix_de_Yamoussoukro_2.jpg", "caption": "La basilique se détache au loin derrière les lacs de Yamoussoukro.", "credit": "Photo : Gregor Rom – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Notre-Dame-de-la-Paix_de_Yamoussoukro_2.jpg"}]'::jsonb, true, true, 20
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- Les mosquées soudanaises du nord ivoirien
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'mosquees-soudanaises',
    title = 'Les mosquées soudanaises du nord ivoirien',
    category = 'patrimoine',
    location = 'Kong, Kouto, Tengréla, Kaouara et Nambira, dans le nord du pays',
    period = 'De novembre à mars, pendant la saison sèche',
    summary = 'Hérissées de pièces de bois, bâties en terre crue entre le XVIIe et le XIXe siècle, huit mosquées du nord ivoirien sont inscrites au patrimoine mondial depuis 2021.',
    content = 'Au nord de la Côte d''Ivoire, au bout des pistes de savane, se dressent de petites mosquées aux formes sculptées, couleur de la terre qui les porte. Bâties en terre crue entre le XVIIe et le XIXe siècle, elles comptent parmi les plus beaux témoignages de l''architecture soudanaise en Afrique de l''Ouest.

## Un style venu de l''empire du Mali

Le style dit soudanais s''est diffusé depuis l''empire du Mali à partir du XIVe siècle, en suivant les marchands et les lettrés musulmans qui reliaient le Sahel aux régions forestières. Les villes du nord ivoirien, comme Kong, étaient alors des étapes importantes de ce commerce.

En 2021, l''UNESCO a inscrit au patrimoine mondial un ensemble de huit mosquées de ce style, parmi lesquelles celles de Kong, Kouto, Tengréla, Kaouara et Nambira. Elles sont plus petites que la célèbre mosquée de Djenné, mais tout aussi remarquables.

## Une architecture vivante

Les murs sont faits de banco, un mélange de terre et de fibres, épaissis par des contreforts et surmontés de tours coniques ou pyramidales. Les pièces de bois qui dépassent des murs ne sont pas décoratives : elles servent d''échafaudage permanent.

Chaque année ou presque, les habitants se mobilisent pour recouvrir les murs d''un nouvel enduit de terre, abîmé par les pluies. Cet entretien collectif est ce qui permet à ces édifices de traverser les siècles.

## Bon à savoir

La meilleure période pour le voyage est la saison sèche, de novembre à mars, quand les pistes sont praticables. Ces mosquées sont avant tout des lieux de prière : demandez toujours l''autorisation au responsable avant d''entrer ou de photographier, et évitez les heures de prière.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/Mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_01.jpg/1920px-Mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_01.jpg',
    image_caption = 'La mosquée de Kouto et ses tours coniques en terre crue.',
    image_credit = 'Photo : KONE IF – CC BY 4.0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_01.jpg',
    gallery = '[{"url": "https://upload.wikimedia.org/wikipedia/commons/7/75/Kong3.jpg", "caption": "La mosquée de Kong, ancienne cité marchande du nord.", "credit": "Photo : Ivoire8 – CC BY-SA 3.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kong3.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/L%27int%C3%A9rieur_de_la_mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_10.jpg/1920px-L%27int%C3%A9rieur_de_la_mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_10.jpg", "caption": "L''intérieur de la mosquée de Kouto : piliers massifs et lumière tamisée.", "credit": "Photo : KONE IF – CC BY 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:L%27int%C3%A9rieur_de_la_mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_10.jpg"}]'::jsonb,
    featured = false,
    sort_order = 30
  WHERE slug = 'mosquees-soudanaises' OR (slug IS NULL AND title = 'Mosquées de style soudanais du nord')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'mosquees-soudanaises', 'Les mosquées soudanaises du nord ivoirien', 'patrimoine', 'Kong, Kouto, Tengréla, Kaouara et Nambira, dans le nord du pays', 'De novembre à mars, pendant la saison sèche', 'Hérissées de pièces de bois, bâties en terre crue entre le XVIIe et le XIXe siècle, huit mosquées du nord ivoirien sont inscrites au patrimoine mondial depuis 2021.', 'Au nord de la Côte d''Ivoire, au bout des pistes de savane, se dressent de petites mosquées aux formes sculptées, couleur de la terre qui les porte. Bâties en terre crue entre le XVIIe et le XIXe siècle, elles comptent parmi les plus beaux témoignages de l''architecture soudanaise en Afrique de l''Ouest.

## Un style venu de l''empire du Mali

Le style dit soudanais s''est diffusé depuis l''empire du Mali à partir du XIVe siècle, en suivant les marchands et les lettrés musulmans qui reliaient le Sahel aux régions forestières. Les villes du nord ivoirien, comme Kong, étaient alors des étapes importantes de ce commerce.

En 2021, l''UNESCO a inscrit au patrimoine mondial un ensemble de huit mosquées de ce style, parmi lesquelles celles de Kong, Kouto, Tengréla, Kaouara et Nambira. Elles sont plus petites que la célèbre mosquée de Djenné, mais tout aussi remarquables.

## Une architecture vivante

Les murs sont faits de banco, un mélange de terre et de fibres, épaissis par des contreforts et surmontés de tours coniques ou pyramidales. Les pièces de bois qui dépassent des murs ne sont pas décoratives : elles servent d''échafaudage permanent.

Chaque année ou presque, les habitants se mobilisent pour recouvrir les murs d''un nouvel enduit de terre, abîmé par les pluies. Cet entretien collectif est ce qui permet à ces édifices de traverser les siècles.

## Bon à savoir

La meilleure période pour le voyage est la saison sèche, de novembre à mars, quand les pistes sont praticables. Ces mosquées sont avant tout des lieux de prière : demandez toujours l''autorisation au responsable avant d''entrer ou de photographier, et évitez les heures de prière.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/Mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_01.jpg/1920px-Mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_01.jpg', 'La mosquée de Kouto et ses tours coniques en terre crue.', 'Photo : KONE IF – CC BY 4.0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_01.jpg', '[{"url": "https://upload.wikimedia.org/wikipedia/commons/7/75/Kong3.jpg", "caption": "La mosquée de Kong, ancienne cité marchande du nord.", "credit": "Photo : Ivoire8 – CC BY-SA 3.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kong3.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/L%27int%C3%A9rieur_de_la_mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_10.jpg/1920px-L%27int%C3%A9rieur_de_la_mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_10.jpg", "caption": "L''intérieur de la mosquée de Kouto : piliers massifs et lumière tamisée.", "credit": "Photo : KONE IF – CC BY 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:L%27int%C3%A9rieur_de_la_mosqu%C3%A9e_traditionnelle_du_type_Soudanaise_10.jpg"}]'::jsonb, false, true, 30
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- Cathédrale Saint-Paul d'Abidjan
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'cathedrale-saint-paul',
    title = 'Cathédrale Saint-Paul d''Abidjan',
    category = 'patrimoine',
    location = 'Le Plateau, Abidjan, face à la lagune Ébrié',
    period = 'Toute l''année',
    summary = 'Avec sa croix de 70 mètres et ses haubans d''acier, la cathédrale du Plateau est l''une des silhouettes les plus audacieuses d''Abidjan.',
    content = 'Sur le Plateau, le quartier des affaires d''Abidjan, une immense croix inclinée semble retenir à elle seule une toiture tendue comme une voile. La cathédrale Saint-Paul, œuvre de l''architecte italien Aldo Spirito, est l''un des monuments les plus photographiés de la ville.

## Deux visites d''un pape

Construite à l''initiative du président Félix Houphouët-Boigny, la cathédrale a vu sa première pierre bénie par le pape Jean-Paul II le 11 mai 1980, lors de sa première visite en Côte d''Ivoire. Il est revenu la consacrer le 10 août 1985. L''édifice a valu à son architecte le prix « Europe Architecture » en 1982.

## Une architecture pleine de symboles

- Le plan triangulaire évoque la Sainte Trinité.
- La tour-croix de 70 mètres soutient la toiture grâce à sept haubans d''acier, en écho aux sept sacrements.
- La toiture, qui rappelle une tente, figure le lieu de rencontre entre les fidèles.

## À l''intérieur

La nef, disposée en gradins autour de l''autel, peut accueillir environ 4 500 personnes assises. Les vitraux de l''artiste italien Roberto Franzosi, sur 370 m², racontent l''histoire de l''Église en Côte d''Ivoire et des scènes de la vie du Christ et de l''apôtre Paul. Dans le jardin, un chemin de croix de 300 marches est ponctué de bas-reliefs en céramique.

## Bon à savoir

La cathédrale est un lieu de culte actif : visitez-la en dehors des offices et dans une tenue correcte. Elle se combine facilement avec une balade au Plateau et une visite du Musée des Civilisations, dans le même quartier.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3b/Cath%C3%A9drale_Saint-Paul_d%27Abidjan_en_vue_panoramique.jpg/1920px-Cath%C3%A9drale_Saint-Paul_d%27Abidjan_en_vue_panoramique.jpg',
    image_caption = 'La cathédrale vue de côté : la toiture tendue comme une voile.',
    image_credit = 'Photo : Edison McCullen – CC BY 4.0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Cath%C3%A9drale_Saint-Paul_d%27Abidjan_en_vue_panoramique.jpg',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Cath%C3%A9drale_Saint-Paul_du_Plateau.jpg/1920px-La_Cath%C3%A9drale_Saint-Paul_du_Plateau.jpg", "caption": "La tour-croix de 70 mètres et ses haubans d''acier.", "credit": "Photo : Ebe Junior – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:La_Cath%C3%A9drale_Saint-Paul_du_Plateau.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/La_cath%C3%A9drale_Saint-Paul_Abidjan_03.jpg/1920px-La_cath%C3%A9drale_Saint-Paul_Abidjan_03.jpg", "caption": "La silhouette de la cathédrale sous le ciel d''Abidjan.", "credit": "Photo : Charles BCB – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:La_cath%C3%A9drale_Saint-Paul_Abidjan_03.jpg"}]'::jsonb,
    featured = false,
    sort_order = 40
  WHERE slug = 'cathedrale-saint-paul' OR (slug IS NULL AND title = 'Cathédrale Saint-Paul')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'cathedrale-saint-paul', 'Cathédrale Saint-Paul d''Abidjan', 'patrimoine', 'Le Plateau, Abidjan, face à la lagune Ébrié', 'Toute l''année', 'Avec sa croix de 70 mètres et ses haubans d''acier, la cathédrale du Plateau est l''une des silhouettes les plus audacieuses d''Abidjan.', 'Sur le Plateau, le quartier des affaires d''Abidjan, une immense croix inclinée semble retenir à elle seule une toiture tendue comme une voile. La cathédrale Saint-Paul, œuvre de l''architecte italien Aldo Spirito, est l''un des monuments les plus photographiés de la ville.

## Deux visites d''un pape

Construite à l''initiative du président Félix Houphouët-Boigny, la cathédrale a vu sa première pierre bénie par le pape Jean-Paul II le 11 mai 1980, lors de sa première visite en Côte d''Ivoire. Il est revenu la consacrer le 10 août 1985. L''édifice a valu à son architecte le prix « Europe Architecture » en 1982.

## Une architecture pleine de symboles

- Le plan triangulaire évoque la Sainte Trinité.
- La tour-croix de 70 mètres soutient la toiture grâce à sept haubans d''acier, en écho aux sept sacrements.
- La toiture, qui rappelle une tente, figure le lieu de rencontre entre les fidèles.

## À l''intérieur

La nef, disposée en gradins autour de l''autel, peut accueillir environ 4 500 personnes assises. Les vitraux de l''artiste italien Roberto Franzosi, sur 370 m², racontent l''histoire de l''Église en Côte d''Ivoire et des scènes de la vie du Christ et de l''apôtre Paul. Dans le jardin, un chemin de croix de 300 marches est ponctué de bas-reliefs en céramique.

## Bon à savoir

La cathédrale est un lieu de culte actif : visitez-la en dehors des offices et dans une tenue correcte. Elle se combine facilement avec une balade au Plateau et une visite du Musée des Civilisations, dans le même quartier.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3b/Cath%C3%A9drale_Saint-Paul_d%27Abidjan_en_vue_panoramique.jpg/1920px-Cath%C3%A9drale_Saint-Paul_d%27Abidjan_en_vue_panoramique.jpg', 'La cathédrale vue de côté : la toiture tendue comme une voile.', 'Photo : Edison McCullen – CC BY 4.0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Cath%C3%A9drale_Saint-Paul_d%27Abidjan_en_vue_panoramique.jpg', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Cath%C3%A9drale_Saint-Paul_du_Plateau.jpg/1920px-La_Cath%C3%A9drale_Saint-Paul_du_Plateau.jpg", "caption": "La tour-croix de 70 mètres et ses haubans d''acier.", "credit": "Photo : Ebe Junior – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:La_Cath%C3%A9drale_Saint-Paul_du_Plateau.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/La_cath%C3%A9drale_Saint-Paul_Abidjan_03.jpg/1920px-La_cath%C3%A9drale_Saint-Paul_Abidjan_03.jpg", "caption": "La silhouette de la cathédrale sous le ciel d''Abidjan.", "credit": "Photo : Charles BCB – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:La_cath%C3%A9drale_Saint-Paul_Abidjan_03.jpg"}]'::jsonb, false, true, 40
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- L'Abissa, le nouvel an des N'zima
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'abissa',
    title = 'L''Abissa, le nouvel an des N''zima',
    category = 'festivals',
    location = 'Place de l''Abissa, Grand-Bassam',
    period = 'Une semaine entre fin octobre et début novembre, chaque année',
    summary = 'Pendant une semaine, Grand-Bassam vit au rythme des tambours : l''Abissa, fête du nouvel an du peuple N''zima, attire chaque année des milliers de visiteurs.',
    content = 'Une fois par an, la place de l''Abissa, à Grand-Bassam, devient le cœur battant du peuple N''zima. Pendant sept jours, du dimanche au dimanche, les familles se retrouvent autour du roi et du grand tambour sacré pour célébrer le passage à la nouvelle année.

## Une tradition de plusieurs siècles

L''Abissa existerait depuis le XVIIe siècle. Son nom évoque l''idée de « demander aux amis de venir en aide ». La fête se transmet comme un relais entre les différents groupes n''zima, du Ghana à la Côte d''Ivoire : les Adjoufoulé de Grand-Bassam ferment la marche, après ceux de la région de Tiapoum.

## Le temps de la parole et de la réconciliation

L''Abissa n''est pas seulement une fête. C''est un moment de bilan, où chacun peut exprimer ses vœux et ses critiques devant la communauté, et inviter les notables à mieux gérer les affaires de la cité. On y règle les différends et on y célèbre la cohésion entre les grandes familles.

## Une semaine rythmée

- L''ouverture avec la sortie du tambour sacré, l''Edo N''gbolé, installé sur la place.
- Une journée des jeunes, puis une journée des femmes, chacune avec ses danses et ses tambours.
- La purification du tambour et les sorties du roi, accompagné de sa cour.
- Les danses de la cohésion et de la paix entre les familles, jusqu''à la clôture.

## Bon à savoir

Les dates exactes sont fixées chaque année par la cour royale : renseignez-vous quelques semaines à l''avance. Les hébergements de Grand-Bassam se remplissent vite pendant la fête. Les danses se déroulent en plein air : prévoyez chapeau et eau, et respectez les moments réservés à la communauté.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/Abissa_2016.jpg/1920px-Abissa_2016.jpg',
    image_caption = 'Danse des femmes sur la place de l''Abissa, à Grand-Bassam.',
    image_credit = 'Photo : Michaelill16 – CC BY-SA 4.0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Abissa_2016.jpg',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/ABISSA_originel.jpg/1920px-ABISSA_originel.jpg", "caption": "Les messagers de l''Abissa, en tenues de fête.", "credit": "Photo : ABOUEIZAKHI – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:ABISSA_originel.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Nobles_N%27Zima.JPG/1920px-Nobles_N%27Zima.JPG", "caption": "Les notables n''zima, en pagnes d''apparat, pendant la fête.", "credit": "Photo : Papischou – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Nobles_N%27Zima.JPG"}]'::jsonb,
    featured = true,
    sort_order = 50
  WHERE slug = 'abissa' OR (slug IS NULL AND title = 'Fête de l''Abissa')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'abissa', 'L''Abissa, le nouvel an des N''zima', 'festivals', 'Place de l''Abissa, Grand-Bassam', 'Une semaine entre fin octobre et début novembre, chaque année', 'Pendant une semaine, Grand-Bassam vit au rythme des tambours : l''Abissa, fête du nouvel an du peuple N''zima, attire chaque année des milliers de visiteurs.', 'Une fois par an, la place de l''Abissa, à Grand-Bassam, devient le cœur battant du peuple N''zima. Pendant sept jours, du dimanche au dimanche, les familles se retrouvent autour du roi et du grand tambour sacré pour célébrer le passage à la nouvelle année.

## Une tradition de plusieurs siècles

L''Abissa existerait depuis le XVIIe siècle. Son nom évoque l''idée de « demander aux amis de venir en aide ». La fête se transmet comme un relais entre les différents groupes n''zima, du Ghana à la Côte d''Ivoire : les Adjoufoulé de Grand-Bassam ferment la marche, après ceux de la région de Tiapoum.

## Le temps de la parole et de la réconciliation

L''Abissa n''est pas seulement une fête. C''est un moment de bilan, où chacun peut exprimer ses vœux et ses critiques devant la communauté, et inviter les notables à mieux gérer les affaires de la cité. On y règle les différends et on y célèbre la cohésion entre les grandes familles.

## Une semaine rythmée

- L''ouverture avec la sortie du tambour sacré, l''Edo N''gbolé, installé sur la place.
- Une journée des jeunes, puis une journée des femmes, chacune avec ses danses et ses tambours.
- La purification du tambour et les sorties du roi, accompagné de sa cour.
- Les danses de la cohésion et de la paix entre les familles, jusqu''à la clôture.

## Bon à savoir

Les dates exactes sont fixées chaque année par la cour royale : renseignez-vous quelques semaines à l''avance. Les hébergements de Grand-Bassam se remplissent vite pendant la fête. Les danses se déroulent en plein air : prévoyez chapeau et eau, et respectez les moments réservés à la communauté.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/Abissa_2016.jpg/1920px-Abissa_2016.jpg', 'Danse des femmes sur la place de l''Abissa, à Grand-Bassam.', 'Photo : Michaelill16 – CC BY-SA 4.0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Abissa_2016.jpg', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/ABISSA_originel.jpg/1920px-ABISSA_originel.jpg", "caption": "Les messagers de l''Abissa, en tenues de fête.", "credit": "Photo : ABOUEIZAKHI – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:ABISSA_originel.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Nobles_N%27Zima.JPG/1920px-Nobles_N%27Zima.JPG", "caption": "Les notables n''zima, en pagnes d''apparat, pendant la fête.", "credit": "Photo : Papischou – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Nobles_N%27Zima.JPG"}]'::jsonb, true, true, 50
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- FEMUA, le festival de Magic System
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'femua',
    title = 'FEMUA, le festival de Magic System',
    category = 'festivals',
    location = 'Anoumabo et plusieurs scènes d''Abidjan',
    period = 'Chaque année au printemps, souvent autour de Pâques',
    summary = 'Créé en 2008 par A''salfo, le leader de Magic System, le Festival des musiques urbaines d''Anoumabo est devenu l''un des grands rendez-vous musicaux du continent.',
    content = 'Tout est parti d''un village d''Abidjan. Anoumabo, où ont grandi les quatre membres du groupe Magic System, accueille depuis 2008 l''un des plus grands festivals de musique d''Afrique : le Festival des musiques urbaines d''Anoumabo, ou FEMUA.

## Un cadeau à un quartier

A''salfo, le leader de Magic System, a lancé le festival pour offrir chaque année au village qui les a vus grandir un spectacle avec de grandes stars africaines et internationales. La première édition, autofinancée, dure trois jours. Le festival en compte aujourd''hui près d''une semaine.

L''entrée des concerts est gratuite, et certains artistes reversent leurs droits d''auteur à un projet de développement local. Le FEMUA a attiré plus de 40 000 spectateurs en 2017.

## Plus qu''une série de concerts

- Une grande scène où se succèdent les vedettes de l''afropop, du coupé-décalé et du zouglou.
- Le « FEMUA Kids », un espace dédié aux enfants.
- Des conférences et des panels sur un thème de société choisi chaque année, comme la jeunesse et l''émigration.

## Un moment d''émotion

En 2016, le chanteur congolais Papa Wemba, tête d''affiche, s''est effondré sur la scène du festival et n''a pas survécu. Un hommage lui est rendu depuis, et cet épisode fait partie de l''histoire du FEMUA.

## Bon à savoir

Les dates et le programme sont annoncés quelques semaines avant le festival sur ses réseaux officiels. L''affluence est très forte le soir des grands concerts : arrivez tôt, gardez vos affaires près de vous et prévoyez un moyen de transport pour le retour.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Sc%C3%A8ne_du_FEMUA_01.jpg/1920px-Sc%C3%A8ne_du_FEMUA_01.jpg',
    image_caption = 'La grande scène du FEMUA, à Abidjan.',
    image_credit = 'Photo : Aman ADO – CC BY 4.0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Sc%C3%A8ne_du_FEMUA_01.jpg',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/YEMI_ALADE_IN_FEMUA_02.jpg/1920px-YEMI_ALADE_IN_FEMUA_02.jpg", "caption": "La chanteuse nigériane Yemi Alade sur la scène de la 16e édition.", "credit": "Photo : Aman ADO – CC0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:YEMI_ALADE_IN_FEMUA_02.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Sc%C3%A8ne_du_FEMUA_15.jpg/1920px-Sc%C3%A8ne_du_FEMUA_15.jpg", "caption": "Concert acoustique sur une scène du festival.", "credit": "Photo : Aman ADO – CC BY 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sc%C3%A8ne_du_FEMUA_15.jpg"}]'::jsonb,
    featured = false,
    sort_order = 60
  WHERE slug = 'femua' OR (slug IS NULL AND title = 'FEMUA – Festival des Musiques Urbaines d''Anoumabo')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'femua', 'FEMUA, le festival de Magic System', 'festivals', 'Anoumabo et plusieurs scènes d''Abidjan', 'Chaque année au printemps, souvent autour de Pâques', 'Créé en 2008 par A''salfo, le leader de Magic System, le Festival des musiques urbaines d''Anoumabo est devenu l''un des grands rendez-vous musicaux du continent.', 'Tout est parti d''un village d''Abidjan. Anoumabo, où ont grandi les quatre membres du groupe Magic System, accueille depuis 2008 l''un des plus grands festivals de musique d''Afrique : le Festival des musiques urbaines d''Anoumabo, ou FEMUA.

## Un cadeau à un quartier

A''salfo, le leader de Magic System, a lancé le festival pour offrir chaque année au village qui les a vus grandir un spectacle avec de grandes stars africaines et internationales. La première édition, autofinancée, dure trois jours. Le festival en compte aujourd''hui près d''une semaine.

L''entrée des concerts est gratuite, et certains artistes reversent leurs droits d''auteur à un projet de développement local. Le FEMUA a attiré plus de 40 000 spectateurs en 2017.

## Plus qu''une série de concerts

- Une grande scène où se succèdent les vedettes de l''afropop, du coupé-décalé et du zouglou.
- Le « FEMUA Kids », un espace dédié aux enfants.
- Des conférences et des panels sur un thème de société choisi chaque année, comme la jeunesse et l''émigration.

## Un moment d''émotion

En 2016, le chanteur congolais Papa Wemba, tête d''affiche, s''est effondré sur la scène du festival et n''a pas survécu. Un hommage lui est rendu depuis, et cet épisode fait partie de l''histoire du FEMUA.

## Bon à savoir

Les dates et le programme sont annoncés quelques semaines avant le festival sur ses réseaux officiels. L''affluence est très forte le soir des grands concerts : arrivez tôt, gardez vos affaires près de vous et prévoyez un moyen de transport pour le retour.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Sc%C3%A8ne_du_FEMUA_01.jpg/1920px-Sc%C3%A8ne_du_FEMUA_01.jpg', 'La grande scène du FEMUA, à Abidjan.', 'Photo : Aman ADO – CC BY 4.0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Sc%C3%A8ne_du_FEMUA_01.jpg', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/YEMI_ALADE_IN_FEMUA_02.jpg/1920px-YEMI_ALADE_IN_FEMUA_02.jpg", "caption": "La chanteuse nigériane Yemi Alade sur la scène de la 16e édition.", "credit": "Photo : Aman ADO – CC0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:YEMI_ALADE_IN_FEMUA_02.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Sc%C3%A8ne_du_FEMUA_15.jpg/1920px-Sc%C3%A8ne_du_FEMUA_15.jpg", "caption": "Concert acoustique sur une scène du festival.", "credit": "Photo : Aman ADO – CC BY 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sc%C3%A8ne_du_FEMUA_15.jpg"}]'::jsonb, false, true, 60
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- MASA, le rendez-vous des arts de la scène
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'masa',
    title = 'MASA, le rendez-vous des arts de la scène',
    category = 'festivals',
    location = 'Palais de la Culture de Treichville et autres scènes d''Abidjan',
    period = 'Tous les deux ans, au printemps (avril lors des dernières éditions)',
    summary = 'Depuis 1993, le Marché des arts du spectacle d''Abidjan réunit tous les deux ans artistes, programmateurs et public autour du théâtre, de la danse, de la musique et du conte.',
    content = 'Pendant une semaine, Abidjan devient la capitale des arts vivants africains. Le MASA, Marché des arts du spectacle d''Abidjan, rassemble des troupes de tout le continent et des programmateurs venus du monde entier.

## Une vitrine pour les artistes africains

Le MASA est né d''une décision des ministres de la Culture de la Francophonie en 1990. L''objectif : aider les artistes africains de la musique, du théâtre et de la danse à se professionnaliser et à faire tourner leurs spectacles à l''international. La première édition s''est tenue à Abidjan en 1993.

Le « marché » porte bien son nom : en plus des représentations, les artistes y rencontrent des directeurs de festivals et de salles qui peuvent les programmer ailleurs.

## Que voir pendant le MASA

- Des concerts de musiques traditionnelles et actuelles.
- Des pièces de théâtre et des spectacles de conte.
- Des créations de danse, traditionnelle comme contemporaine.
- Des scènes dans plusieurs communes, dont le Palais de la Culture de Treichville.

## Bon à savoir

Le MASA a lieu tous les deux ans ; les dernières éditions se sont tenues en avril. Le programme officiel est publié quelques semaines avant l''ouverture. Beaucoup de spectacles sont accessibles au grand public : c''est l''occasion de découvrir en une semaine la création de tout un continent.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Les_sc%C3%A8nes_-_Masa_2024._04.jpg/1920px-Les_sc%C3%A8nes_-_Masa_2024._04.jpg',
    image_caption = 'Concert au Palais de la Culture pendant le MASA 2024.',
    image_credit = 'Photo : ArnoBOUJIKA – CC0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Les_sc%C3%A8nes_-_Masa_2024._04.jpg',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Les_sc%C3%A8nes_-_Masa_2024._13.jpg/1920px-Les_sc%C3%A8nes_-_Masa_2024._13.jpg", "caption": "Spectacle de danse contemporaine pendant le MASA 2024.", "credit": "Photo : ArnoBOUJIKA – CC0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Les_sc%C3%A8nes_-_Masa_2024._13.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Les_sc%C3%A8nes_-_Masa_2024._16.jpg/1920px-Les_sc%C3%A8nes_-_Masa_2024._16.jpg", "caption": "Une scène en plein air du MASA, le soir.", "credit": "Photo : ArnoBOUJIKA – CC0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Les_sc%C3%A8nes_-_Masa_2024._16.jpg"}]'::jsonb,
    featured = false,
    sort_order = 70
  WHERE slug = 'masa' OR (slug IS NULL AND title = 'MASA – Marché des Arts du Spectacle')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'masa', 'MASA, le rendez-vous des arts de la scène', 'festivals', 'Palais de la Culture de Treichville et autres scènes d''Abidjan', 'Tous les deux ans, au printemps (avril lors des dernières éditions)', 'Depuis 1993, le Marché des arts du spectacle d''Abidjan réunit tous les deux ans artistes, programmateurs et public autour du théâtre, de la danse, de la musique et du conte.', 'Pendant une semaine, Abidjan devient la capitale des arts vivants africains. Le MASA, Marché des arts du spectacle d''Abidjan, rassemble des troupes de tout le continent et des programmateurs venus du monde entier.

## Une vitrine pour les artistes africains

Le MASA est né d''une décision des ministres de la Culture de la Francophonie en 1990. L''objectif : aider les artistes africains de la musique, du théâtre et de la danse à se professionnaliser et à faire tourner leurs spectacles à l''international. La première édition s''est tenue à Abidjan en 1993.

Le « marché » porte bien son nom : en plus des représentations, les artistes y rencontrent des directeurs de festivals et de salles qui peuvent les programmer ailleurs.

## Que voir pendant le MASA

- Des concerts de musiques traditionnelles et actuelles.
- Des pièces de théâtre et des spectacles de conte.
- Des créations de danse, traditionnelle comme contemporaine.
- Des scènes dans plusieurs communes, dont le Palais de la Culture de Treichville.

## Bon à savoir

Le MASA a lieu tous les deux ans ; les dernières éditions se sont tenues en avril. Le programme officiel est publié quelques semaines avant l''ouverture. Beaucoup de spectacles sont accessibles au grand public : c''est l''occasion de découvrir en une semaine la création de tout un continent.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Les_sc%C3%A8nes_-_Masa_2024._04.jpg/1920px-Les_sc%C3%A8nes_-_Masa_2024._04.jpg', 'Concert au Palais de la Culture pendant le MASA 2024.', 'Photo : ArnoBOUJIKA – CC0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Les_sc%C3%A8nes_-_Masa_2024._04.jpg', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Les_sc%C3%A8nes_-_Masa_2024._13.jpg/1920px-Les_sc%C3%A8nes_-_Masa_2024._13.jpg", "caption": "Spectacle de danse contemporaine pendant le MASA 2024.", "credit": "Photo : ArnoBOUJIKA – CC0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Les_sc%C3%A8nes_-_Masa_2024._13.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Les_sc%C3%A8nes_-_Masa_2024._16.jpg/1920px-Les_sc%C3%A8nes_-_Masa_2024._16.jpg", "caption": "Une scène en plein air du MASA, le soir.", "credit": "Photo : ArnoBOUJIKA – CC0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Les_sc%C3%A8nes_-_Masa_2024._16.jpg"}]'::jsonb, false, true, 70
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- Musée des Civilisations de Côte d'Ivoire
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'musee-des-civilisations',
    title = 'Musée des Civilisations de Côte d''Ivoire',
    category = 'musees',
    location = 'Le Plateau, Abidjan',
    period = 'Toute l''année',
    summary = 'Plus de 15 000 pièces venues de toutes les régions du pays : masques, statues, poids à peser l''or, textiles… La meilleure introduction aux cultures ivoiriennes.',
    content = 'Avant de partir à la découverte des régions, une visite au Musée des Civilisations, au cœur du Plateau, permet de comprendre la richesse des cultures ivoiriennes. Ses collections couvrent tout le pays, du littoral aux savanes du nord.

## Une histoire de huit décennies

Le lieu commence sa vie comme centre artisanal en 1942. Rattaché deux ans plus tard à l''Institut français d''Afrique noire, il devient un lieu de collecte et de conservation d''objets. L''ethnologue Bohumil Holas le dirige de 1947 à 1979 et en fait une institution scientifique.

Devenu musée national d''Abidjan en 1972, il prend son nom actuel en 1994. Pendant la crise de 2011, le musée a été pillé et une centaine d''objets ont disparu : leur recherche reste un enjeu important.

## Des collections d''une grande variété

Le musée conserve environ 15 000 pièces ethnographiques, archéologiques et photographiques :

- des masques et des statues de nombreux peuples du pays ;
- des instruments de musique et des attributs du pouvoir des chefs ;
- des poids à peser l''or akan, de minuscules sculptures en laiton ;
- des textiles, des parures, des poteries et des portes sculptées.

## Bon à savoir

Le musée s''étend sur deux hectares, avec un jardin agréable. Les expositions changent régulièrement : renseignez-vous sur place sur l''exposition du moment. La visite se combine facilement avec la cathédrale Saint-Paul, à quelques minutes.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Musee_civilisations_Abidjan.jpg/1920px-Musee_civilisations_Abidjan.jpg',
    image_caption = 'Une salle d''exposition consacrée aux peuples akan.',
    image_credit = 'Photo : ATV – CC BY-SA 4.0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Musee_civilisations_Abidjan.jpg',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Incursion_dans_le_Mus%C3%A9e_des_Civilisations_de_C%C3%B4te_d%27Ivoire_08.jpg/1920px-Incursion_dans_le_Mus%C3%A9e_des_Civilisations_de_C%C3%B4te_d%27Ivoire_08.jpg", "caption": "Vitrine sur les sites archéologiques de la région lagunaire.", "credit": "Photo : Kod B – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Incursion_dans_le_Mus%C3%A9e_des_Civilisations_de_C%C3%B4te_d%27Ivoire_08.jpg"}]'::jsonb,
    featured = true,
    sort_order = 80
  WHERE slug = 'musee-des-civilisations' OR (slug IS NULL AND title = 'Musée des Civilisations de Côte d''Ivoire')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'musee-des-civilisations', 'Musée des Civilisations de Côte d''Ivoire', 'musees', 'Le Plateau, Abidjan', 'Toute l''année', 'Plus de 15 000 pièces venues de toutes les régions du pays : masques, statues, poids à peser l''or, textiles… La meilleure introduction aux cultures ivoiriennes.', 'Avant de partir à la découverte des régions, une visite au Musée des Civilisations, au cœur du Plateau, permet de comprendre la richesse des cultures ivoiriennes. Ses collections couvrent tout le pays, du littoral aux savanes du nord.

## Une histoire de huit décennies

Le lieu commence sa vie comme centre artisanal en 1942. Rattaché deux ans plus tard à l''Institut français d''Afrique noire, il devient un lieu de collecte et de conservation d''objets. L''ethnologue Bohumil Holas le dirige de 1947 à 1979 et en fait une institution scientifique.

Devenu musée national d''Abidjan en 1972, il prend son nom actuel en 1994. Pendant la crise de 2011, le musée a été pillé et une centaine d''objets ont disparu : leur recherche reste un enjeu important.

## Des collections d''une grande variété

Le musée conserve environ 15 000 pièces ethnographiques, archéologiques et photographiques :

- des masques et des statues de nombreux peuples du pays ;
- des instruments de musique et des attributs du pouvoir des chefs ;
- des poids à peser l''or akan, de minuscules sculptures en laiton ;
- des textiles, des parures, des poteries et des portes sculptées.

## Bon à savoir

Le musée s''étend sur deux hectares, avec un jardin agréable. Les expositions changent régulièrement : renseignez-vous sur place sur l''exposition du moment. La visite se combine facilement avec la cathédrale Saint-Paul, à quelques minutes.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Musee_civilisations_Abidjan.jpg/1920px-Musee_civilisations_Abidjan.jpg', 'Une salle d''exposition consacrée aux peuples akan.', 'Photo : ATV – CC BY-SA 4.0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Musee_civilisations_Abidjan.jpg', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Incursion_dans_le_Mus%C3%A9e_des_Civilisations_de_C%C3%B4te_d%27Ivoire_08.jpg/1920px-Incursion_dans_le_Mus%C3%A9e_des_Civilisations_de_C%C3%B4te_d%27Ivoire_08.jpg", "caption": "Vitrine sur les sites archéologiques de la région lagunaire.", "credit": "Photo : Kod B – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Incursion_dans_le_Mus%C3%A9e_des_Civilisations_de_C%C3%B4te_d%27Ivoire_08.jpg"}]'::jsonb, true, true, 80
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- Le pagne baoulé, tissé à la main
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'pagne-baoule',
    title = 'Le pagne baoulé, tissé à la main',
    category = 'arts',
    location = 'Villages de tisserands du centre, autour de Bouaké et de Yamoussoukro',
    period = 'Toute l''année',
    summary = 'Bande après bande, les tisserands baoulés composent des pagnes qui accompagnent toutes les grandes étapes de la vie. Un savoir-faire à voir à l''œuvre dans les villages du centre.',
    content = 'Dans les villages du centre de la Côte d''Ivoire, on entend souvent avant de voir : le claquement régulier des métiers à tisser. Les tisserands baoulés y fabriquent à la main des pagnes qui comptent parmi les plus beaux textiles du pays.

## Un peuple, un savoir-faire

Les Baoulés, qui vivent surtout dans le centre du pays autour de Bouaké et de Yamoussoukro, font partie du grand groupe akan. Selon la tradition, ils se sont établis entre les fleuves Bandama et Comoé au XVIIIe siècle, guidés par la reine Abla Pokou. Le tissage fait partie de leurs arts les plus réputés, avec la sculpture et l''orfèvrerie.

## Bande après bande

Le pagne baoulé se tisse en bandes étroites sur un métier traditionnel en bois. Les fils de la chaîne sont tendus sur plusieurs mètres, souvent en plein air, devant l''atelier. Une fois tissées, les bandes sont cousues bord à bord pour former un grand tissu.

Les couleurs, les motifs et leur disposition ne doivent rien au hasard : certains pagnes sont réservés aux cérémonies, d''autres se portent au quotidien. Un beau pagne demande de longues heures de travail.

## Un tissu pour les grands moments

On porte le pagne tissé lors des fêtes, des mariages, des funérailles ou des cérémonies de chefferie. Il se transmet souvent d''une génération à l''autre et peut constituer un cadeau précieux.

## Où le découvrir

- Dans les villages de tisserands du centre du pays, où l''on peut voir les artisans au travail.
- Sur les marchés de Bouaké.
- Au village artisanal de Grand-Bassam, qui rassemble des tissus de tout le pays.

Acheter directement à un tisserand, c''est l''occasion de comprendre son travail et de faire vivre ce savoir-faire.',
    image_url = 'https://upload.wikimedia.org/wikipedia/commons/9/98/Tissage_du_pagne_baoule.JPG',
    image_caption = 'Un tisserand baoulé à son métier, bande après bande.',
    image_credit = 'Photo : Pagnebaoule – CC BY-SA 4.0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Tissage_du_pagne_baoule.JPG',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Tisserands_au_travail.JPG/1920px-Tisserands_au_travail.JPG", "caption": "Les fils de la chaîne tendus en plein air, devant les métiers.", "credit": "Photo : Pagnebaoule – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Tisserands_au_travail.JPG"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Sechage_de_file_a_tisser.JPG/1920px-Sechage_de_file_a_tisser.JPG", "caption": "Séchage des fils teints avant le tissage.", "credit": "Photo : Pagnebaoule – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sechage_de_file_a_tisser.JPG"}]'::jsonb,
    featured = false,
    sort_order = 90
  WHERE slug = 'pagne-baoule' OR (slug IS NULL AND title = 'Art contemporain à Abidjan')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'pagne-baoule', 'Le pagne baoulé, tissé à la main', 'arts', 'Villages de tisserands du centre, autour de Bouaké et de Yamoussoukro', 'Toute l''année', 'Bande après bande, les tisserands baoulés composent des pagnes qui accompagnent toutes les grandes étapes de la vie. Un savoir-faire à voir à l''œuvre dans les villages du centre.', 'Dans les villages du centre de la Côte d''Ivoire, on entend souvent avant de voir : le claquement régulier des métiers à tisser. Les tisserands baoulés y fabriquent à la main des pagnes qui comptent parmi les plus beaux textiles du pays.

## Un peuple, un savoir-faire

Les Baoulés, qui vivent surtout dans le centre du pays autour de Bouaké et de Yamoussoukro, font partie du grand groupe akan. Selon la tradition, ils se sont établis entre les fleuves Bandama et Comoé au XVIIIe siècle, guidés par la reine Abla Pokou. Le tissage fait partie de leurs arts les plus réputés, avec la sculpture et l''orfèvrerie.

## Bande après bande

Le pagne baoulé se tisse en bandes étroites sur un métier traditionnel en bois. Les fils de la chaîne sont tendus sur plusieurs mètres, souvent en plein air, devant l''atelier. Une fois tissées, les bandes sont cousues bord à bord pour former un grand tissu.

Les couleurs, les motifs et leur disposition ne doivent rien au hasard : certains pagnes sont réservés aux cérémonies, d''autres se portent au quotidien. Un beau pagne demande de longues heures de travail.

## Un tissu pour les grands moments

On porte le pagne tissé lors des fêtes, des mariages, des funérailles ou des cérémonies de chefferie. Il se transmet souvent d''une génération à l''autre et peut constituer un cadeau précieux.

## Où le découvrir

- Dans les villages de tisserands du centre du pays, où l''on peut voir les artisans au travail.
- Sur les marchés de Bouaké.
- Au village artisanal de Grand-Bassam, qui rassemble des tissus de tout le pays.

Acheter directement à un tisserand, c''est l''occasion de comprendre son travail et de faire vivre ce savoir-faire.', 'https://upload.wikimedia.org/wikipedia/commons/9/98/Tissage_du_pagne_baoule.JPG', 'Un tisserand baoulé à son métier, bande après bande.', 'Photo : Pagnebaoule – CC BY-SA 4.0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Tissage_du_pagne_baoule.JPG', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Tisserands_au_travail.JPG/1920px-Tisserands_au_travail.JPG", "caption": "Les fils de la chaîne tendus en plein air, devant les métiers.", "credit": "Photo : Pagnebaoule – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Tisserands_au_travail.JPG"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Sechage_de_file_a_tisser.JPG/1920px-Sechage_de_file_a_tisser.JPG", "caption": "Séchage des fils teints avant le tissage.", "credit": "Photo : Pagnebaoule – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sechage_de_file_a_tisser.JPG"}]'::jsonb, false, true, 90
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- Les masques dan de la région de Man
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'masques-dan',
    title = 'Les masques dan de la région de Man',
    category = 'arts',
    location = 'Man, Danané, Biankouma et la région des montagnes de l''Ouest',
    period = 'Toute l''année, surtout lors des fêtes et cérémonies',
    summary = 'Dans la région de Man, chez les Dan (ou Yacouba), les masques rendent la justice, éduquent et divertissent. Une tradition vivante, au milieu des montagnes de l''Ouest.',
    content = 'Dans l''ouest montagneux de la Côte d''Ivoire, autour de Man, Danané et Biankouma, vivent les Dan, aussi appelés Yacouba. Leur société s''organise autour des masques, qui comptent parmi les plus célèbres de l''art africain.

## Bien plus que des objets

Pour les Dan, le masque n''est pas un simple objet sculpté : il incarne un esprit. Selon sa fonction, il peut rendre la justice, accompagner l''initiation des jeunes, apaiser un conflit ou simplement divertir le village lors d''une fête.

Chaque sortie de masque est un véritable spectacle, avec ses musiciens, ses chants et ses costumes de fibres et de tissus. Certains masques dansent, d''autres courent, d''autres encore, perchés sur de hautes échasses, impressionnent par leurs acrobaties.

## Un art reconnu dans le monde entier

Les sculpteurs dan sont réputés pour leurs masques au visage ovale et lisse, souvent patinés de noir, aux yeux fendus ou circulaires. On en trouve aujourd''hui dans de grands musées du monde. Leurs cuillères cérémonielles sculptées sont également très recherchées.

## Une région à découvrir

La région de Man offre aussi des paysages de montagnes rares en Côte d''Ivoire : la Dent de Man, les cascades et les forêts environnantes se prêtent aux randonnées.

## Bon à savoir

Certaines sorties de masques sont réservées aux initiés. Suivez les consignes de vos hôtes, en particulier pour les photos, et passez si possible par un guide local qui saura vous expliquer le sens de chaque masque.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Danse_de_masque_%C3%A0_Man_%28C%C3%B4te_d%27Ivoire%29_01.jpg/1920px-Danse_de_masque_%C3%A0_Man_%28C%C3%B4te_d%27Ivoire%29_01.jpg',
    image_caption = 'Sortie de masque lors d''une fête à Man.',
    image_credit = 'Photo : Dadrik – CC BY-SA 4.0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Danse_de_masque_%C3%A0_Man_(C%C3%B4te_d%27Ivoire)_01.jpg',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Danse_de_masque_%C3%A0_Man_%28C%C3%B4te_d%27Ivoire%29_02.jpg/1920px-Danse_de_masque_%C3%A0_Man_%28C%C3%B4te_d%27Ivoire%29_02.jpg", "caption": "Les masques dansent au milieu de la foule, accompagnés de musiciens.", "credit": "Photo : Dadrik – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Danse_de_masque_%C3%A0_Man_(C%C3%B4te_d%27Ivoire)_02.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d2/Mask_in_wood_and_koalin_-_Dan_-_Ivory_Coast_-_Royal_Palace%2C_Brussels.jpg/1920px-Mask_in_wood_and_koalin_-_Dan_-_Ivory_Coast_-_Royal_Palace%2C_Brussels.jpg", "caption": "Masque dan en bois et kaolin, exposé au Palais royal de Bruxelles.", "credit": "Photo : Wikimedia Commons (Palais royal de Bruxelles) – CC BY-SA 3.0", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Mask_in_wood_and_koalin_-_Dan_-_Ivory_Coast_-_Royal_Palace,_Brussels.jpg"}]'::jsonb,
    featured = false,
    sort_order = 100
  WHERE slug = 'masques-dan' OR (slug IS NULL AND title = 'Les masques Dan de l''Ouest')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'masques-dan', 'Les masques dan de la région de Man', 'arts', 'Man, Danané, Biankouma et la région des montagnes de l''Ouest', 'Toute l''année, surtout lors des fêtes et cérémonies', 'Dans la région de Man, chez les Dan (ou Yacouba), les masques rendent la justice, éduquent et divertissent. Une tradition vivante, au milieu des montagnes de l''Ouest.', 'Dans l''ouest montagneux de la Côte d''Ivoire, autour de Man, Danané et Biankouma, vivent les Dan, aussi appelés Yacouba. Leur société s''organise autour des masques, qui comptent parmi les plus célèbres de l''art africain.

## Bien plus que des objets

Pour les Dan, le masque n''est pas un simple objet sculpté : il incarne un esprit. Selon sa fonction, il peut rendre la justice, accompagner l''initiation des jeunes, apaiser un conflit ou simplement divertir le village lors d''une fête.

Chaque sortie de masque est un véritable spectacle, avec ses musiciens, ses chants et ses costumes de fibres et de tissus. Certains masques dansent, d''autres courent, d''autres encore, perchés sur de hautes échasses, impressionnent par leurs acrobaties.

## Un art reconnu dans le monde entier

Les sculpteurs dan sont réputés pour leurs masques au visage ovale et lisse, souvent patinés de noir, aux yeux fendus ou circulaires. On en trouve aujourd''hui dans de grands musées du monde. Leurs cuillères cérémonielles sculptées sont également très recherchées.

## Une région à découvrir

La région de Man offre aussi des paysages de montagnes rares en Côte d''Ivoire : la Dent de Man, les cascades et les forêts environnantes se prêtent aux randonnées.

## Bon à savoir

Certaines sorties de masques sont réservées aux initiés. Suivez les consignes de vos hôtes, en particulier pour les photos, et passez si possible par un guide local qui saura vous expliquer le sens de chaque masque.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Danse_de_masque_%C3%A0_Man_%28C%C3%B4te_d%27Ivoire%29_01.jpg/1920px-Danse_de_masque_%C3%A0_Man_%28C%C3%B4te_d%27Ivoire%29_01.jpg', 'Sortie de masque lors d''une fête à Man.', 'Photo : Dadrik – CC BY-SA 4.0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Danse_de_masque_%C3%A0_Man_(C%C3%B4te_d%27Ivoire)_01.jpg', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Danse_de_masque_%C3%A0_Man_%28C%C3%B4te_d%27Ivoire%29_02.jpg/1920px-Danse_de_masque_%C3%A0_Man_%28C%C3%B4te_d%27Ivoire%29_02.jpg", "caption": "Les masques dansent au milieu de la foule, accompagnés de musiciens.", "credit": "Photo : Dadrik – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Danse_de_masque_%C3%A0_Man_(C%C3%B4te_d%27Ivoire)_02.jpg"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d2/Mask_in_wood_and_koalin_-_Dan_-_Ivory_Coast_-_Royal_Palace%2C_Brussels.jpg/1920px-Mask_in_wood_and_koalin_-_Dan_-_Ivory_Coast_-_Royal_Palace%2C_Brussels.jpg", "caption": "Masque dan en bois et kaolin, exposé au Palais royal de Bruxelles.", "credit": "Photo : Wikimedia Commons (Palais royal de Bruxelles) – CC BY-SA 3.0", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Mask_in_wood_and_koalin_-_Dan_-_Ivory_Coast_-_Royal_Palace,_Brussels.jpg"}]'::jsonb, false, true, 100
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- Le Zaouli, la danse aux 200 pas par minute
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'zaouli',
    title = 'Le Zaouli, la danse aux 200 pas par minute',
    category = 'musique_danse',
    location = 'Pays gouro, autour de Bouaflé et de Zuénoula',
    period = 'Lors des fêtes, funérailles et festivals',
    summary = 'Masque, costume et danse du peuple gouro, le Zaouli est inscrit depuis 2017 au patrimoine culturel immatériel de l''UNESCO. Ses meilleurs danseurs dépassent les 200 pas par minute.',
    content = 'Il faut le voir pour le croire. Sous un masque au visage féminin, surmonté d''animaux sculptés, le danseur de Zaouli frappe le sol à une vitesse qui semble impossible, au son des tambours et des flûtes. Ses pieds bougent si vite qu''on les distingue à peine.

## La fille de Djela

Le Zaouli désigne à la fois un masque, un costume et une danse du peuple gouro, dans le centre-ouest du pays. Les légendes sur son origine varient, mais toutes parlent d''une jeune fille d''une beauté extraordinaire, Djela lou Zaouli, « Zaouli, la fille de Djela », dont le masque perpétue le souvenir.

Le masque serait apparu dans les années 1950. Il réunit des traits de deux autres masques gouro et se décline en plusieurs variantes, chacune liée à une légende. Il est exclusivement porté par des hommes.

## Une danse d''une virtuosité rare

Le danseur porte des grelots aux chevilles et des jambières de fibres peintes de couleurs vives, jaune, rouge ou orange. Tout repose sur la dextérité des pieds : lors de l''examen de la candidature par l''UNESCO, les meilleurs danseurs ont été chronométrés à plus de 200 pas par minute.

En 2017, le Zaouli a été inscrit au patrimoine culturel immatériel de l''humanité. Profane, il se danse aujourd''hui aussi bien lors des fêtes de village que dans les grands festivals, et d''autres peuples voisins l''ont adopté.

## Bon à savoir

Les sorties de Zaouli accompagnent les fêtes, les funérailles et les festivals du pays gouro, comme le Festival des arts et de la culture de Gohitafla (FESTIGO), dont la première édition s''est tenue en août 2026. Vous en verrez aussi lors de grandes manifestations à Abidjan. Placez-vous au premier rang du cercle : c''est là que l''énergie du danseur est la plus saisissante.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Festigo_2026-danse_Zaouli_03.jpg/1920px-Festigo_2026-danse_Zaouli_03.jpg',
    image_caption = 'Sortie du masque Zaouli de Manfla au Festival des arts et de la culture de Gohitafla (FESTIGO), en 2026.',
    image_credit = 'Photo : Koume marcel – CC BY-SA 4.0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Festigo_2026-danse_Zaouli_03.jpg',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Festigo_2026-danse_Zaouli_16.jpg/1920px-Festigo_2026-danse_Zaouli_16.jpg", "caption": "Le danseur, pieds frappant le sol à un rythme effréné.", "credit": "Photo : Koume marcel – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Festigo_2026-danse_Zaouli_16.jpg"}, {"url": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Zaouli_Gouro_01.jpg", "caption": "Masque Zaouli et son costume de fibres colorées.", "credit": "Photo : KONE IF – CC BY 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Zaouli_Gouro_01.jpg"}]'::jsonb,
    featured = true,
    sort_order = 110
  WHERE slug = 'zaouli' OR (slug IS NULL AND title = 'Le Zaouli')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'zaouli', 'Le Zaouli, la danse aux 200 pas par minute', 'musique_danse', 'Pays gouro, autour de Bouaflé et de Zuénoula', 'Lors des fêtes, funérailles et festivals', 'Masque, costume et danse du peuple gouro, le Zaouli est inscrit depuis 2017 au patrimoine culturel immatériel de l''UNESCO. Ses meilleurs danseurs dépassent les 200 pas par minute.', 'Il faut le voir pour le croire. Sous un masque au visage féminin, surmonté d''animaux sculptés, le danseur de Zaouli frappe le sol à une vitesse qui semble impossible, au son des tambours et des flûtes. Ses pieds bougent si vite qu''on les distingue à peine.

## La fille de Djela

Le Zaouli désigne à la fois un masque, un costume et une danse du peuple gouro, dans le centre-ouest du pays. Les légendes sur son origine varient, mais toutes parlent d''une jeune fille d''une beauté extraordinaire, Djela lou Zaouli, « Zaouli, la fille de Djela », dont le masque perpétue le souvenir.

Le masque serait apparu dans les années 1950. Il réunit des traits de deux autres masques gouro et se décline en plusieurs variantes, chacune liée à une légende. Il est exclusivement porté par des hommes.

## Une danse d''une virtuosité rare

Le danseur porte des grelots aux chevilles et des jambières de fibres peintes de couleurs vives, jaune, rouge ou orange. Tout repose sur la dextérité des pieds : lors de l''examen de la candidature par l''UNESCO, les meilleurs danseurs ont été chronométrés à plus de 200 pas par minute.

En 2017, le Zaouli a été inscrit au patrimoine culturel immatériel de l''humanité. Profane, il se danse aujourd''hui aussi bien lors des fêtes de village que dans les grands festivals, et d''autres peuples voisins l''ont adopté.

## Bon à savoir

Les sorties de Zaouli accompagnent les fêtes, les funérailles et les festivals du pays gouro, comme le Festival des arts et de la culture de Gohitafla (FESTIGO), dont la première édition s''est tenue en août 2026. Vous en verrez aussi lors de grandes manifestations à Abidjan. Placez-vous au premier rang du cercle : c''est là que l''énergie du danseur est la plus saisissante.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Festigo_2026-danse_Zaouli_03.jpg/1920px-Festigo_2026-danse_Zaouli_03.jpg', 'Sortie du masque Zaouli de Manfla au Festival des arts et de la culture de Gohitafla (FESTIGO), en 2026.', 'Photo : Koume marcel – CC BY-SA 4.0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Festigo_2026-danse_Zaouli_03.jpg', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Festigo_2026-danse_Zaouli_16.jpg/1920px-Festigo_2026-danse_Zaouli_16.jpg", "caption": "Le danseur, pieds frappant le sol à un rythme effréné.", "credit": "Photo : Koume marcel – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Festigo_2026-danse_Zaouli_16.jpg"}, {"url": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Zaouli_Gouro_01.jpg", "caption": "Masque Zaouli et son costume de fibres colorées.", "credit": "Photo : KONE IF – CC BY 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Zaouli_Gouro_01.jpg"}]'::jsonb, true, true, 110
WHERE NOT EXISTS (SELECT 1 FROM updated);

-- Attiéké, alloco et garba : la cuisine ivoirienne de rue
WITH updated AS (
  UPDATE public.culture_entries SET
    slug = 'attieke-alloco-garba',
    title = 'Attiéké, alloco et garba : la cuisine ivoirienne de rue',
    category = 'gastronomie',
    location = 'Partout dans le pays, dans les maquis et les allocodromes',
    period = 'Toute l''année',
    summary = 'Semoule de manioc fermentée, bananes plantains frites, poisson braisé : trois incontournables pour goûter la Côte d''Ivoire comme les Ivoiriens.',
    content = 'On ne connaît pas vraiment la Côte d''Ivoire tant qu''on ne s''est pas assis dans un maquis, ces restaurants souvent en plein air où l''on partage un poisson braisé, de l''attiéké et de l''alloco, les doigts dans le plat.

## L''attiéké, fierté nationale

L''attiéké est une semoule de manioc fermenté, cuite à la vapeur, au goût légèrement acidulé. Originaire des peuples lagunaires du sud, comme les Ébrié, les Adioukrou et les Avikam, il est traditionnellement préparé par les femmes, selon un savoir-faire transmis de mère en fille.

Il se mange aujourd''hui dans tout le pays et bien au-delà. Depuis mai 2024, l''attiéké est protégé par une marque collective enregistrée auprès de l''Organisation africaine de la propriété intellectuelle : seule la semoule produite en Côte d''Ivoire peut porter ce nom.

## L''alloco, la banane plantain frite

L''alloco, ce sont des bananes plantains bien mûres, coupées en morceaux et frites, souvent dans l''huile de palme. Son nom viendrait du baoulé et de l''agni, et signifie « banane mûre ». On le déguste avec du poisson frit, du poulet, des œufs ou une sauce pimentée. À Abidjan, les « allocodromes » sont de véritables quartiers de grillades à ciel ouvert.

## Le garba, le plat des étudiants

Le garba associe de l''attiéké à des morceaux de thon frit, du piment frais, de la tomate et de l''oignon. Bon marché et copieux, vendu dans de petites échoppes, il est devenu le plat populaire par excellence, notamment près des cités universitaires d''Abidjan.

## Bon à savoir

- Dans les maquis, on choisit souvent son poisson ou son poulet cru avant de le faire braiser.
- Demandez le piment à part si vous n''êtes pas habitué : il est souvent très fort.
- Le soir, les allocodromes et les maquis sont aussi des lieux de musique et de rencontre.',
    image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Sole_brais%C3%A9_et_atti%C3%A9k%C3%A9.jpg/1920px-Sole_brais%C3%A9_et_atti%C3%A9k%C3%A9.jpg',
    image_caption = 'Sole braisée et attiéké, un classique des maquis.',
    image_credit = 'Photo : Likikouet Raïssa – CC BY-SA 4.0, via Wikimedia Commons',
    image_source_url = 'https://commons.wikimedia.org/wiki/File:Sole_brais%C3%A9_et_atti%C3%A9k%C3%A9.jpg',
    gallery = '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Plat_atti%C3%A9k%C3%A9.jpg/1920px-Plat_atti%C3%A9k%C3%A9.jpg", "caption": "Un plat d''attiéké, semoule de manioc fermentée cuite à la vapeur.", "credit": "Photo : Zak Le Messager – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Plat_atti%C3%A9k%C3%A9.jpg"}, {"url": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Du_bon_Alloko.JPG", "caption": "L''alloco : des bananes plantains bien mûres, frites.", "credit": "Photo : Aboukam – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Du_bon_Alloko.JPG"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/Atti%C3%A9k%C3%A9_au_poissons_mangne_brais%C3%A9.jpg/1920px-Atti%C3%A9k%C3%A9_au_poissons_mangne_brais%C3%A9.jpg", "caption": "Attiéké, poisson braisé et sauce tomate-oignon.", "credit": "Photo : Leturk – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Atti%C3%A9k%C3%A9_au_poissons_mangne_brais%C3%A9.jpg"}]'::jsonb,
    featured = false,
    sort_order = 120
  WHERE slug = 'attieke-alloco-garba' OR (slug IS NULL AND title = 'Attiéké, alloco et garba')
  RETURNING id
)
INSERT INTO public.culture_entries (slug, title, category, location, period, summary, content, image_url, image_caption, image_credit, image_source_url, gallery, featured, published, sort_order)
SELECT 'attieke-alloco-garba', 'Attiéké, alloco et garba : la cuisine ivoirienne de rue', 'gastronomie', 'Partout dans le pays, dans les maquis et les allocodromes', 'Toute l''année', 'Semoule de manioc fermentée, bananes plantains frites, poisson braisé : trois incontournables pour goûter la Côte d''Ivoire comme les Ivoiriens.', 'On ne connaît pas vraiment la Côte d''Ivoire tant qu''on ne s''est pas assis dans un maquis, ces restaurants souvent en plein air où l''on partage un poisson braisé, de l''attiéké et de l''alloco, les doigts dans le plat.

## L''attiéké, fierté nationale

L''attiéké est une semoule de manioc fermenté, cuite à la vapeur, au goût légèrement acidulé. Originaire des peuples lagunaires du sud, comme les Ébrié, les Adioukrou et les Avikam, il est traditionnellement préparé par les femmes, selon un savoir-faire transmis de mère en fille.

Il se mange aujourd''hui dans tout le pays et bien au-delà. Depuis mai 2024, l''attiéké est protégé par une marque collective enregistrée auprès de l''Organisation africaine de la propriété intellectuelle : seule la semoule produite en Côte d''Ivoire peut porter ce nom.

## L''alloco, la banane plantain frite

L''alloco, ce sont des bananes plantains bien mûres, coupées en morceaux et frites, souvent dans l''huile de palme. Son nom viendrait du baoulé et de l''agni, et signifie « banane mûre ». On le déguste avec du poisson frit, du poulet, des œufs ou une sauce pimentée. À Abidjan, les « allocodromes » sont de véritables quartiers de grillades à ciel ouvert.

## Le garba, le plat des étudiants

Le garba associe de l''attiéké à des morceaux de thon frit, du piment frais, de la tomate et de l''oignon. Bon marché et copieux, vendu dans de petites échoppes, il est devenu le plat populaire par excellence, notamment près des cités universitaires d''Abidjan.

## Bon à savoir

- Dans les maquis, on choisit souvent son poisson ou son poulet cru avant de le faire braiser.
- Demandez le piment à part si vous n''êtes pas habitué : il est souvent très fort.
- Le soir, les allocodromes et les maquis sont aussi des lieux de musique et de rencontre.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Sole_brais%C3%A9_et_atti%C3%A9k%C3%A9.jpg/1920px-Sole_brais%C3%A9_et_atti%C3%A9k%C3%A9.jpg', 'Sole braisée et attiéké, un classique des maquis.', 'Photo : Likikouet Raïssa – CC BY-SA 4.0, via Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Sole_brais%C3%A9_et_atti%C3%A9k%C3%A9.jpg', '[{"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Plat_atti%C3%A9k%C3%A9.jpg/1920px-Plat_atti%C3%A9k%C3%A9.jpg", "caption": "Un plat d''attiéké, semoule de manioc fermentée cuite à la vapeur.", "credit": "Photo : Zak Le Messager – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Plat_atti%C3%A9k%C3%A9.jpg"}, {"url": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Du_bon_Alloko.JPG", "caption": "L''alloco : des bananes plantains bien mûres, frites.", "credit": "Photo : Aboukam – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Du_bon_Alloko.JPG"}, {"url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/Atti%C3%A9k%C3%A9_au_poissons_mangne_brais%C3%A9.jpg/1920px-Atti%C3%A9k%C3%A9_au_poissons_mangne_brais%C3%A9.jpg", "caption": "Attiéké, poisson braisé et sauce tomate-oignon.", "credit": "Photo : Leturk – CC BY-SA 4.0, via Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Atti%C3%A9k%C3%A9_au_poissons_mangne_brais%C3%A9.jpg"}]'::jsonb, false, true, 120
WHERE NOT EXISTS (SELECT 1 FROM updated);
