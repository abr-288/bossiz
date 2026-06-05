-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  icon TEXT DEFAULT 'crown',
  features JSONB DEFAULT '[]',
  subscription_type TEXT NOT NULL DEFAULT 'standard' CHECK (subscription_type IN ('standard', 'majestic')),
  assigned_role TEXT DEFAULT 'user',
  assistance_level TEXT DEFAULT 'basic',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_pricing table
CREATE TABLE IF NOT EXISTS public.subscription_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(plan_id) ON DELETE CASCADE,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  discount_percentage INTEGER DEFAULT 0,
  trial_days INTEGER DEFAULT 0,
  setup_fee DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, billing_cycle)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_id ON public.subscription_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_type ON public.subscription_plans(subscription_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_pricing_plan_id ON public.subscription_pricing(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_pricing_cycle ON public.subscription_pricing(billing_cycle);

-- Enable RLS (Row Level Security)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_pricing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscription_plans
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@bossiz.com'
    )
  );

-- Create RLS policies for subscription_pricing
CREATE POLICY "Anyone can view active pricing" ON public.subscription_pricing
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage pricing" ON public.subscription_pricing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@bossiz.com'
    )
  );

-- Create updated_at triggers
CREATE TRIGGER handle_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_subscription_pricing_updated_at
  BEFORE UPDATE ON public.subscription_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (plan_id, name, subtitle, description, icon, features, subscription_type, assigned_role, assistance_level, sort_order) VALUES
  ('basic', 'Basic', 'Idéal pour commencer', 'Accès essentiel aux services Bossiz', 'star', 
   '["Assistance voyage 24/7", "Réservations vols/hôtels", "Support client dédié"]', 
   'standard', 'user', 'basic', 1),
  ('premium', 'Premium', 'Pour les voyageurs réguliers', 'Services avancés et priorité', 'crown', 
   '["Tout Basic +", "Accès lounges VIP", "Transferts premium", "Assurance voyage"]', 
   'standard', 'premium', 'priority', 2),
  ('business', 'Business', 'Professionnels et entreprises', 'Solutions complètes pour voyageurs d''affaires', 'briefcase', 
   '["Tout Premium +", "Réservations espaces meeting", "Gestion dépenses", "Support business 24/7"]', 
   'standard', 'business', 'enterprise', 3),
  ('majestic_access', 'Majestic Access', 'Accès Premium exclusif', 'Services VIP et exclusifs', 'crown', 
   '["Assistance prioritaire 24/7", "Conciergerie personnelle", "Réservations prioritaires", "Accès lounges VIP", "Transport premium", "Support multilingue"]', 
   'majestic', 'vip', 'premium', 10),
  ('majestic_prive', 'Majestic Privé', 'Ultra-exclusif et personnalisé', 'Expérience sur-mesure et exclusive', 'gem', 
   '["Tout Majestic Access +", "Chef personnel privé", "Yacht et jet privé", "Événements exclusifs", "Conseiller dédié 24/7"]', 
   'majestic', 'vip', 'ultra_premium', 11),
  ('majestic_black', 'Majestic Black', 'Le nec plus ultra', 'Excellence absolue et sans limites', 'shield', 
   '["Tout Majestic Privé +", "Black Card personnelle", "Accès illimité mondial", "Équipe personnelle dédiée", "Investissements exclusifs"]', 
   'majestic', 'vip', 'ultimate', 12)
ON CONFLICT (plan_id) DO NOTHING;

-- Insert default pricing
INSERT INTO public.subscription_pricing (plan_id, billing_cycle, price, currency, discount_percentage, trial_days, setup_fee) VALUES
  ('basic', 'monthly', 15000, 'XOF', 0, 0, 0),
  ('basic', 'yearly', 150000, 'XOF', 17, 7, 0),
  ('premium', 'monthly', 25000, 'XOF', 0, 0, 0),
  ('premium', 'yearly', 250000, 'XOF', 17, 14, 0),
  ('business', 'monthly', 50000, 'XOF', 0, 0, 0),
  ('business', 'yearly', 500000, 'XOF', 17, 30, 0),
  ('majestic_access', 'monthly', 100000, 'XOF', 0, 7, 10000),
  ('majestic_access', 'yearly', 1000000, 'XOF', 17, 14, 10000),
  ('majestic_prive', 'monthly', 200000, 'XOF', 0, 14, 20000),
  ('majestic_prive', 'yearly', 2000000, 'XOF', 17, 30, 20000),
  ('majestic_black', 'monthly', 500000, 'XOF', 0, 30, 50000),
  ('majestic_black', 'yearly', 5000000, 'XOF', 17, 60, 50000)
ON CONFLICT (plan_id, billing_cycle) DO NOTHING;
