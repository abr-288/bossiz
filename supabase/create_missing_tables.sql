-- Script pour créer les tables manquantes dans Supabase
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Créer la table user_subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  trial_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  payment_id TEXT,
  payment_provider TEXT DEFAULT 'cinetpay',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Activer RLS pour user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Créer la table payment_transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT,
  payment_provider TEXT DEFAULT 'cinetpay',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON public.payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON public.payment_transactions(transaction_id);

-- Activer RLS pour payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour payment_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.payment_transactions;
CREATE POLICY "Users can insert own transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Créer la fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers
DROP TRIGGER IF EXISTS handle_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER handle_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER handle_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Insérer des données de test si nécessaire
-- Vérifier si la table subscription_plans existe, sinon la créer
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

-- Insérer des plans par défaut si la table est vide
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
  ('corporate', 'Corporate', 'Entreprises et organisations', 'Solutions sur mesure pour entreprises', 'building', 
   '["Tout Business +", "Gestion multi-utilisateurs", "Reporting avancé", "Support dédié"]', 
   'standard', 'corporate', 'enterprise', 4)
ON CONFLICT (plan_id) DO NOTHING;

-- Créer la table subscription_pricing si elle n'existe pas
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

-- Insérer des tarifs par défaut
INSERT INTO public.subscription_pricing (plan_id, billing_cycle, price, currency, discount_percentage, trial_days, setup_fee) VALUES
  ('basic', 'monthly', 15000, 'XOF', 0, 0, 0),
  ('basic', 'yearly', 150000, 'XOF', 17, 7, 0),
  ('premium', 'monthly', 25000, 'XOF', 0, 0, 0),
  ('premium', 'yearly', 250000, 'XOF', 17, 14, 0),
  ('business', 'monthly', 50000, 'XOF', 0, 0, 0),
  ('business', 'yearly', 500000, 'XOF', 17, 30, 0),
  ('corporate', 'monthly', 100000, 'XOF', 0, 0, 0),
  ('corporate', 'yearly', 1000000, 'XOF', 17, 60, 0)
ON CONFLICT (plan_id, billing_cycle) DO NOTHING;

-- Activer RLS pour subscription_plans et subscription_pricing
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_pricing ENABLE ROW LEVEL SECURITY;

-- Politiques pour subscription_plans
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Politiques pour subscription_pricing
DROP POLICY IF EXISTS "Anyone can view active pricing" ON public.subscription_pricing;
CREATE POLICY "Anyone can view active pricing" ON public.subscription_pricing
  FOR SELECT USING (is_active = true);

-- Donner les permissions nécessaires
GRANT ALL ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.payment_transactions TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated, anon;
GRANT SELECT ON public.subscription_pricing TO authenticated, anon;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Tables créées avec succès: user_subscriptions, payment_transactions, subscription_plans, subscription_pricing';
END $$;
