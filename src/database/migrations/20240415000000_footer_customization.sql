-- Tables pour la personnalisation du footer et la gestion des abonnements

-- Table pour les paramètres de personnalisation du footer
CREATE TABLE IF NOT EXISTS footer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_color VARCHAR(20) DEFAULT '#1f2937',
  text_color VARCHAR(20) DEFAULT '#ffffff',
  link_color VARCHAR(20) DEFAULT '#60a5fa',
  link_hover_color VARCHAR(20) DEFAULT '#3b82f6',
  border_color VARCHAR(20) DEFAULT '#374151',
  logo_url TEXT,
  company_name VARCHAR(255) DEFAULT 'Bossiz Conciergerie',
  description TEXT,
  social_links JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  quick_links JSONB DEFAULT '{}',
  legal_links JSONB DEFAULT '{}',
  newsletter_text TEXT,
  copyright_text VARCHAR(500) DEFAULT '© 2024 Bossiz Conciergerie. Tous droits réservés.',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour la gestion complète des abonnements
CREATE TABLE IF NOT EXISTS subscription_plans_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subtitle VARCHAR(255),
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XOF',
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  trial_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  icon_name VARCHAR(100),
  color_scheme VARCHAR(100),
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les catégories d'abonnements
CREATE TABLE IF NOT EXISTS subscription_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_name VARCHAR(100),
  color_scheme VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour lier les abonnements aux catégories
CREATE TABLE IF NOT EXISTS plan_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans_admin(id) ON DELETE CASCADE,
  category_id UUID REFERENCES subscription_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, category_id)
);

-- Table pour les tarifs par cycle de facturation
CREATE TABLE IF NOT EXISTS subscription_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans_admin(id) ON DELETE CASCADE,
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XOF',
  discount_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, billing_cycle)
);

-- Table pour les fonctionnalités des abonnements
CREATE TABLE IF NOT EXISTS subscription_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans_admin(id) ON DELETE CASCADE,
  feature_name VARCHAR(255) NOT NULL,
  feature_description TEXT,
  icon_name VARCHAR(100),
  is_included BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les témoignages d'abonnements
CREATE TABLE IF NOT EXISTS subscription_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans_admin(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_title VARCHAR(255),
  customer_avatar TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  testimonial_text TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les FAQ d'abonnements
CREATE TABLE IF NOT EXISTS subscription_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans_admin(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les données par défaut pour le footer
INSERT INTO footer_settings (
  background_color, text_color, link_color, link_hover_color, border_color,
  company_name, description, social_links, contact_info, quick_links, legal_links
) VALUES (
  '#1f2937',
  '#ffffff',
  '#60a5fa',
  '#3b82f6',
  '#374151',
  'Bossiz Conciergerie',
  'Votre partenaire de confiance pour des services de conciergerie premium et exclusifs',
  '{"facebook": "https://facebook.com/bossiz", "twitter": "https://twitter.com/bossiz", "instagram": "https://instagram.com/bossiz", "linkedin": "https://linkedin.com/company/bossiz"}',
  '{"phone": "+225 07 00 00 00 00", "email": "contact@bossiz.com", "address": "Abidjan, Côte d''Ivoire"}',
  '{"services": "Services", "about": "À propos", "blog": "Blog", "careers": "Carrières"}',
  '{"privacy": "Politique de confidentialité", "terms": "Conditions d''utilisation", "cookies": "Politique de cookies"}'
) ON CONFLICT DO NOTHING;

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_footer_settings_active ON footer_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_admin_active ON subscription_plans_admin(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_admin_sort ON subscription_plans_admin(sort_order);
CREATE INDEX IF NOT EXISTS idx_subscription_categories_active ON subscription_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_pricing_active ON subscription_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_features_plan ON subscription_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_testimonials_active ON subscription_testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_faqs_active ON subscription_faqs(is_active);

-- Créer des fonctions de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer les triggers
CREATE TRIGGER update_footer_settings_updated_at BEFORE UPDATE ON footer_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_admin_updated_at BEFORE UPDATE ON subscription_plans_admin FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_categories_updated_at BEFORE UPDATE ON subscription_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_pricing_updated_at BEFORE UPDATE ON subscription_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_features_updated_at BEFORE UPDATE ON subscription_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_testimonials_updated_at BEFORE UPDATE ON subscription_testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_faqs_updated_at BEFORE UPDATE ON subscription_faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
