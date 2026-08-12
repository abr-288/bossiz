-- Création des tables de configuration pour Bossiz

-- Table pour la configuration globale de Bossiz
-- NOTE (correctif) : id était déclaré UUID alors que la donnée insérée plus bas
-- utilise le slug 'main' comme identifiant (comme bossiz_sites_config ci-dessous),
-- ce qui provoquait "invalid input syntax for type uuid: main".
CREATE TABLE IF NOT EXISTS bossiz_global_config (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Table pour la configuration des sites Bossiz
CREATE TABLE IF NOT EXISTS bossiz_sites_config (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  image TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  color TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  border_color TEXT NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  highlights TEXT[] DEFAULT '{}',
  route TEXT NOT NULL
);

-- Insertion de la configuration globale par défaut
INSERT INTO bossiz_global_config (id, config)
VALUES (
  'main',
  '{
    "hero": {
      "title": "BOSSIZ Group",
      "subtitle": "Votre Portail Conciergerie",
      "description": "L''excellence de la conciergerie premium en Afrique de l''Ouest"
    },
    "services": [
      {
        "id": "voyage",
        "title": "Voyage & Tourisme",
        "description": "Billetterie premium, hébergements de luxe, circuits exclusifs",
        "features": ["Jets privés", "Hôtels 5*", "Circuits VIP", "Assistance voyage"],
        "color": "from-blue-500 to-blue-600",
        "image": "https://images.unsplash.com/photo-1436777815745-23d67422a4c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      {
        "id": "immobilier",
        "title": "Immobilier & Patrimoine",
        "description": "Gestion, location, conseil patrimonial et transactions premium",
        "features": ["Villas de luxe", "Gestion locative", "Conseil patrimonial", "Investissements"],
        "color": "from-green-500 to-green-600",
        "image": "https://images.unsplash.com/photo-1560448214-04b83dc834d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      {
        "id": "transport",
        "title": "Transport Premium",
        "description": "Véhicules de luxe, jets privés, yachts et services VIP",
        "features": ["Voitures luxe", "Jets privés", "Yachts", "Chauffeurs VIP"],
        "color": "from-purple-500 to-purple-600",
        "image": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      {
        "id": "evenements",
        "title": "Événements & Célébrations",
        "description": "Wedding planners, événements corporatifs, galas et soirées prestige",
        "features": ["Mariages", "Événements corporatifs", "Galas", "Soirées privées"],
        "color": "from-orange-500 to-orange-600",
        "image": "https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      {
        "id": "hotellerie",
        "title": "Hôtellerie & Restauration",
        "description": "Réservations exclusives, chefs privés, expériences gastronomiques",
        "features": ["Réservations VIP", "Chefs privés", "Gastronomie", "Dégustations"],
        "color": "from-pink-500 to-pink-600",
        "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      {
        "id": "services-vip",
        "title": "Services VIP",
        "description": "Assistance personnalisée 24/7, gestionnaire dédié, services sur-mesure",
        "features": ["Assistant personnel", "Manager dédié", "Services 24/7", "Conciergerie privée"],
        "color": "from-yellow-500 to-yellow-600",
        "image": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      }
    ],
    "companyValues": [
      {
        "id": "confiance",
        "title": "Confiance Absolue",
        "description": "Discrétion et confidentialité garanties pour tous nos clients.",
        "color": "from-blue-500 to-blue-600",
        "icon": "Shield"
      },
      {
        "id": "excellence",
        "title": "Excellence",
        "description": "Standards d''excellence dans chaque service rendu.",
        "color": "from-orange-500 to-orange-600",
        "icon": "Star"
      },
      {
        "id": "innovation",
        "title": "Innovation",
        "description": "Solutions modernes et technologies de pointe.",
        "color": "from-purple-500 to-purple-600",
        "icon": "Zap"
      },
      {
        "id": "passion",
        "title": "Passion",
        "description": "Un engagement passionné pour votre satisfaction.",
        "color": "from-pink-500 to-pink-600",
        "icon": "Heart"
      }
    ],
    "globalStats": [
      {
        "value": "25+",
        "label": "Années d''Excellence",
        "description": "Expertise reconnue",
        "icon": "Award"
      },
      {
        "value": "8000+",
        "label": "Clients Satisfaits",
        "description": "Confiance établie",
        "icon": "Users"
      },
      {
        "value": "1800+",
        "label": "Partenaires Premium",
        "description": "Réseau mondial",
        "icon": "Globe"
      },
      {
        "value": "24/7",
        "label": "Support Premium",
        "description": "Disponibilité totale",
        "icon": "Headphones"
      }
    ]
  }'
)
ON CONFLICT (id) DO NOTHING;

-- Insertion des configurations des sites par défaut
INSERT INTO bossiz_sites_config (id, title, subtitle, tagline, description, location, image, features, color, bg_color, border_color, stats, contact, highlights, route)
VALUES 
(
  'cote-d-ivoire',
  'Bossiz Côte d''Ivoire',
  'Excellence en Conciergerie',
  'L''élégance ivoirienne au service de l''excellence',
  'Découvrez une expérience de conciergerie unique en Côte d''Ivoire, où tradition et modernité se rencontrent pour offrir des services d''exception.',
  'Abidjan, Yamoussoukro, San Pedro',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  ARRAY['Voyages & Tourisme Premium', 'Immobilier de Luxe', 'Transport VIP & Jets Privés', 'Événements Corporatifs', 'Services Personnalisés', 'Assistance 24/7', 'Gastronomie & Bien-être', 'Shopping Privé'],
  'from-orange-600 to-red-600',
  'from-orange-50 via-white to-red-50',
  'border-orange-200',
  '[
    {"value": "15+", "label": "Années d''Excellence", "icon": "Award"},
    {"value": "5000+", "label": "Clients Satisfaits", "icon": "Users"},
    {"value": "1000+", "label": "Partenaires Premium", "icon": "Globe"},
    {"value": "98%", "label": "Satisfaction", "icon": "Star"}
  ]',
  '{"phone": "+225 XX XX XX XX", "email": "ci@bossiz.com", "address": "Abidjan, Plateau - Tour BOSSIZ"}',
  ARRAY['Expertise locale approfondie', 'Réseau exclusif de partenaires', 'Services sur-mesure', 'Discrétion absolue'],
  '/bossiz-conciergerie-ci'
),
(
  'senegal',
  'Bossiz Sénégal',
  'Conciergerie d''Exception',
  'La tradition sénégalaise au service du luxe',
  'Vivez une expérience de conciergerie d''exception au Sénégal, alliant savoir-faire local et standards internationaux pour des services inégalés.',
  'Dakar, Thiès, Saint-Louis',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  ARRAY['Voyages d''Affaires', 'Gestion Immobilière', 'Transport Premium', 'Organisation d''Événements', 'Services aux Entreprises', 'Conciergerie Digitale', 'Bien-être & Loisirs', 'Shopping Premium'],
  'from-green-600 to-blue-600',
  'from-green-50 via-white to-blue-50',
  'border-green-200',
  '[
    {"value": "10+", "label": "Années d''Expertise", "icon": "Award"},
    {"value": "3000+", "label": "Clients Satisfaits", "icon": "Users"},
    {"value": "800+", "label": "Partenaires Premium", "icon": "Globe"},
    {"value": "97%", "label": "Satisfaction", "icon": "Star"}
  ]',
  '{"phone": "+221 XX XX XX XX", "email": "sn@bossiz.com", "address": "Dakar, Plateau - Centre BOSSIZ"}',
  ARRAY['Innovation technologique', 'Approche client personnalisée', 'Services intégrés', 'Excellence opérationnelle'],
  '/bossiz-conciergerie-sn'
)
ON CONFLICT (id) DO NOTHING;

-- Création des indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_bossiz_sites_config_updated_at ON bossiz_sites_config(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_bossiz_global_config_updated_at ON bossiz_global_config(updated_at DESC);

-- Création des RLS (Row Level Security) policies
ALTER TABLE bossiz_global_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE bossiz_sites_config ENABLE ROW LEVEL SECURITY;

-- Contenu public (pages vitrine Bossiz) : lecture ouverte à tous, y compris
-- les visiteurs non connectés, à l'image de site_config.
CREATE POLICY "bossiz_global_config is readable by everyone" ON bossiz_global_config
  FOR SELECT USING (true);

CREATE POLICY "bossiz_sites_config is readable by everyone" ON bossiz_sites_config
  FOR SELECT USING (true);

-- Seuls les admins (via la table user_roles) peuvent modifier.
-- Remarque : auth.role() renvoie 'anon'/'authenticated'/'service_role', jamais
-- 'admin' ; l'ancienne politique ne permettait donc jamais l'écriture admin.
CREATE POLICY "Admins can update bossiz_global_config" ON bossiz_global_config
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bossiz_sites_config" ON bossiz_sites_config
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
