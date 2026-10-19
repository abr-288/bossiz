-- Migration for Content Management System
-- Allows admin to modify subscription page content dynamically

-- Table for page sections content
CREATE TABLE IF NOT EXISTS page_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_key TEXT NOT NULL, -- 'subscriptions', 'dashboard', etc.
    section_key TEXT NOT NULL, -- 'hero', 'values', 'majestic_club', etc.
    title TEXT,
    subtitle TEXT,
    description TEXT,
    background_color TEXT DEFAULT 'white',
    text_color TEXT DEFAULT 'black',
    button_text TEXT,
    button_color TEXT DEFAULT 'black',
    button_hover_color TEXT DEFAULT 'gray-800',
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_key, section_key)
);

-- Table for customizable plans
CREATE TABLE IF NOT EXISTS customizable_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    price_note TEXT,
    features TEXT[], -- Array of features
    color_scheme TEXT DEFAULT 'black', -- 'black', 'primary', 'secondary', etc.
    is_popular BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for value propositions
CREATE TABLE IF NOT EXISTS value_propositions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    icon_name TEXT NOT NULL, -- lucide icon name
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    color_scheme TEXT DEFAULT 'black',
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for global settings
CREATE TABLE IF NOT EXISTS global_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'text', -- 'text', 'color', 'boolean', 'number'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription page content
INSERT INTO page_sections (page_key, section_key, title, subtitle, description, button_text) VALUES
('subscriptions', 'hero', 'Transformez Votre Vie', 'Avec Nos Services Premium', 'Plus de 1000 clients nous font déjà confiance. Rejoignez l''élite qui accède à un monde d''opportunités illimitées.', 'Découvrir Nos Offres'),
('subscriptions', 'values', 'Pourquoi Choisir Bossiz Conciergerie ?', 'Nous ne sommes pas juste un service, nous sommes Votre partenaire de succès', NULL, NULL),
('subscriptions', 'majestic_club', 'L''Excellence Redéfinie', 'Pour ceux qui exigent l''incomparable. Découvrez nos plans VIP qui transforment chaque expérience en moment inoubliable.', NULL, NULL),
('subscriptions', 'testimonials', 'Ce Que Disent Nos Clients', 'Des histoires de succès qui inspirent confiance', NULL, NULL),
('subscriptions', 'cta', 'Prêt à Transformer Votre Vie ?', 'Rejoignez plus de 1000 clients qui ont déjà fait le choix de l''excellence.', NULL, 'Choisir Mon Plan')
ON CONFLICT (page_key, section_key) DO NOTHING;

-- Insert default value propositions
INSERT INTO value_propositions (icon_name, title, description, sort_order) VALUES
('Crown', 'Exclusivité Totale', 'Accès à des services et opportunités réservés à notre clientèle d''élite', 1),
('Zap', 'Rapidité Exceptionnelle', 'Solutions en temps réel, 24/7. Votre temps est Notre priorité absolue', 2),
('Shield', 'Sécurité Maximale', 'Protection totale de vos données et transactions avec cryptage militaire', 3)
ON CONFLICT DO NOTHING;

-- Insert default testimonials
INSERT INTO testimonials (name, role, content, rating, sort_order) VALUES
('Marie K.', 'CEO, Tech Startup', 'Bossiz Conciergerie a transformé ma façon de travailler. Plus besoin de me soucier des détails, je me concentre sur l''essentiel.', 5, 1),
('Jean-Luc M.', 'Investisseur', 'Le service Majestic Club vaut chaque centime. L''accès aux opportunités exclusives a décuplé mes investissements.', 5, 2),
('Sophie D.', 'Directrice Marketing', 'Le support 24/7 est incroyable. Quelle que soit l''heure, quelqu''un est là pour aider. C''est rassurant.', 5, 3)
ON CONFLICT DO NOTHING;

-- Insert default global settings
INSERT INTO global_settings (setting_key, setting_value, setting_type, description) VALUES
('site_name', 'Bossiz Conciergerie', 'text', 'Nom du site'),
('primary_color', '#192342', 'color', 'Couleur principale de la marque'),
('secondary_color', '#00F59B', 'color', 'Couleur secondaire de la marque'),
('enable_majestic_club', 'true', 'boolean', 'Activer la section Majestic Club'),
('contact_phone', '+33612345678', 'text', 'Numéro de téléphone de contact'),
('contact_email', 'contact@bossiz.com', 'text', 'Email de contact')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_page_sections_page_key ON page_sections(page_key);
CREATE INDEX IF NOT EXISTS idx_page_sections_visible ON page_sections(is_visible);
CREATE INDEX IF NOT EXISTS idx_customizable_plans_visible ON customizable_plans(is_visible);
CREATE INDEX IF NOT EXISTS idx_testimonials_visible ON testimonials(is_visible);
CREATE INDEX IF NOT EXISTS idx_value_propositions_visible ON value_propositions(is_visible);

-- Enable RLS
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE customizable_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_propositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow admins to manage, public to read)
CREATE POLICY "Admins can manage page sections" ON page_sections
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Public can read page sections" ON page_sections
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage customizable plans" ON customizable_plans
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Public can read customizable plans" ON customizable_plans
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage testimonials" ON testimonials
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Public can read testimonials" ON testimonials
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage value propositions" ON value_propositions
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Public can read value propositions" ON value_propositions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage global settings" ON global_settings
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Public can read global settings" ON global_settings
    FOR SELECT USING (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_page_sections_updated_at BEFORE UPDATE ON page_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customizable_plans_updated_at BEFORE UPDATE ON customizable_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_value_propositions_updated_at BEFORE UPDATE ON value_propositions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_settings_updated_at BEFORE UPDATE ON global_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
