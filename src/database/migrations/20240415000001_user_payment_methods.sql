-- Tables pour la gestion des profils utilisateurs et méthodes de paiement

-- Table pour les profils utilisateurs étendus
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(255),
  country VARCHAR(255) DEFAULT 'Côte d\'Ivoire',
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  avatar_url TEXT,
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{"email": true, "sms": true, "push": true}',
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table pour les méthodes de paiement des utilisateurs
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('card', 'mobile_money', 'bank_transfer')),
  
  -- Carte bancaire
  card_number VARCHAR(255),
  card_expiry VARCHAR(10),
  card_cvv VARCHAR(10),
  card_holder_name VARCHAR(255),
  card_brand VARCHAR(50),
  card_last_four VARCHAR(10),
  
  -- Mobile Money
  mobile_operator VARCHAR(50),
  mobile_number VARCHAR(50),
  mobile_country_code VARCHAR(10) DEFAULT '+225',
  
  -- Virement bancaire
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(255),
  bank_account_name VARCHAR(255),
  bank_code VARCHAR(50),
  bank_iban VARCHAR(255),
  bank_swift VARCHAR(50),
  
  -- Champs communs
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CHECK (
    (type = 'card' AND card_number IS NOT NULL) OR
    (type = 'mobile_money' AND mobile_number IS NOT NULL) OR
    (type = 'bank_transfer' AND bank_account_number IS NOT NULL)
  )
);

-- Table pour les transactions de paiement
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_method_id UUID REFERENCES user_payment_methods(id) ON DELETE SET NULL,
  transaction_id VARCHAR(255) UNIQUE, -- ID de la transaction externe (CinetPay, etc.)
  type VARCHAR(50) NOT NULL CHECK (type IN ('subscription', 'booking', 'service', 'refund')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  
  -- Montants
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XOF',
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Détails
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Références
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL
);

-- Table pour les tentatives de paiement échouées
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_method_id UUID REFERENCES user_payment_methods(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
  
  -- Détails de l'erreur
  error_code VARCHAR(100),
  error_message TEXT,
  gateway_response JSONB DEFAULT '{}',
  
  -- Informations de la tentative
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les abonnements utilisateurs (mise à jour de la table existante)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id VARCHAR(100) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  
  -- Tarification
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XOF',
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Statut
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'pending')),
  auto_renew BOOLEAN DEFAULT true,
  
  -- Périodes
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_ends_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  features JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Références
  payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  
  UNIQUE(user_id, plan_id, status)
);

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_verified ON user_profiles(is_verified);

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_type ON user_payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_is_default ON user_payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_is_active ON user_payment_methods(is_active);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_user_id ON payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_transaction_id ON payment_attempts(transaction_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_current_period_ends ON user_subscriptions(current_period_ends_at);

-- Créer des fonctions pour la gestion automatique des abonnements
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le statut des abonnements expirés
  UPDATE user_subscriptions 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
    AND current_period_ends_at < NOW();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour la mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer les triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_payment_methods_updated_at BEFORE UPDATE ON user_payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insérer des données de test pour les utilisateurs existants
INSERT INTO user_profiles (user_id, first_name, last_name, email, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'first_name', 'Test'),
  COALESCE(raw_user_meta_data->>'last_name', 'User'),
  email,
  CASE 
    WHEN email LIKE '%admin%' THEN 'admin'
    ELSE 'user'
  END
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Politique RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour user_payment_methods
CREATE POLICY "Users can view own payment methods" ON user_payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own payment methods" ON user_payment_methods FOR ALL USING (auth.uid() = user_id);

-- Politiques pour payment_transactions
CREATE POLICY "Users can view own transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour payment_attempts
CREATE POLICY "Users can view own payment attempts" ON payment_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment attempts" ON payment_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscriptions" ON user_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Politiques admin pour toutes les tables
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all profiles" ON user_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view all payment methods" ON user_payment_methods FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all payment methods" ON user_payment_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view all transactions" ON payment_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all transactions" ON payment_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all subscriptions" ON user_subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);
