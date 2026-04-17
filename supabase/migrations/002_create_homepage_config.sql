-- Création des tables de configuration pour la page d'accueil

-- Table pour les fonctionnalités de la page d'accueil
CREATE TABLE IF NOT EXISTS homepage_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  feature_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT,
  order_num INTEGER DEFAULT 0
);

-- Table pour les sections de la page d'accueil
CREATE TABLE IF NOT EXISTS homepage_sections (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  visible BOOLEAN DEFAULT true,
  order_num INTEGER DEFAULT 0
);

-- Insertion des fonctionnalités par défaut
INSERT INTO homepage_features (feature_id, title, description, icon, color, order_num)
VALUES 
(
  'secure-booking',
  'Réservation Sécurisée',
  'Réservez en toute confiance avec notre système de paiement sécurisé et notre protection des données.',
  'Shield',
  'from-blue-500 to-blue-600',
  1
),
(
  'best-prices',
  'Meilleurs Prix Garantis',
  'Trouvez les meilleures offres sur les vols, hôtels et locations de voitures.',
  'Award',
  'from-green-500 to-green-600',
  2
),
(
  'support-247',
  'Support 24/7',
  'Notre équipe d''assistance est disponible à tout moment pour vous aider.',
  'Headphones',
  'from-orange-500 to-orange-600',
  3
)
ON CONFLICT (feature_id) DO NOTHING;

-- Insertion des sections par défaut
INSERT INTO homepage_sections (id, title, subtitle, visible, order_num)
VALUES 
(
  'hero',
  'Hero Section',
  'Section principale avec recherche',
  true,
  1
),
(
  'features',
  'Features Section',
  'Section des fonctionnalités principales',
  true,
  2
),
(
  'destinations',
  'Popular Destinations',
  'Section des destinations populaires',
  true,
  3
),
(
  'seasonal',
  'Seasonal Suggestions',
  'Section des suggestions saisonnières',
  true,
  4
),
(
  'testimonials',
  'Testimonials',
  'Section des témoignages clients',
  true,
  5
),
(
  'special-offers',
  'Special Offers',
  'Section des offres spéciales',
  true,
  6
),
(
  'ai-advisor',
  'AI Travel Advisor',
  'Section du conseiller voyage IA',
  true,
  7
),
(
  'bossiz-portal',
  'Bossiz Portal',
  'Section du portail Bossiz',
  true,
  8
)
ON CONFLICT (id) DO NOTHING;

-- Création des indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_homepage_features_order ON homepage_features(order_num ASC);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_order ON homepage_sections(order_num ASC);
CREATE INDEX IF NOT EXISTS idx_homepage_features_updated_at ON homepage_features(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_updated_at ON homepage_sections(updated_at DESC);

-- Création des RLS (Row Level Security) policies
ALTER TABLE homepage_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Users can read homepage_features" ON homepage_features
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'admin');

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Users can read homepage_sections" ON homepage_sections
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'admin');

-- Politique pour permettre uniquement aux admins de modifier
CREATE POLICY "Admins can update homepage_features" ON homepage_features
  FOR ALL USING (auth.role() = 'admin');

-- Politique pour permettre uniquement aux admins de modifier
CREATE POLICY "Admins can update homepage_sections" ON homepage_sections
  FOR ALL USING (auth.role() = 'admin');
