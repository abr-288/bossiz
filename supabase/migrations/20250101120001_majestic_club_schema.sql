-- Majestic Club VIP Module Schema
-- Create all necessary tables for the premium VIP features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Majestic Subscriptions Table
CREATE TABLE IF NOT EXISTS majestic_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('access', 'access_prive', 'access_black')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Majestic Bookings Table
CREATE TABLE IF NOT EXISTS majestic_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_type TEXT NOT NULL CHECK (booking_type IN ('flight', 'hotel', 'villa', 'chauffeur', 'service')),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    total_amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'XOF',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Majestic Services Table
CREATE TABLE IF NOT EXISTS majestic_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('concierge', 'chauffeur', 'chef', 'security', 'custom')),
    description TEXT NOT NULL,
    base_price DECIMAL(12,2) NOT NULL,
    image_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Majestic Service Requests Table
CREATE TABLE IF NOT EXISTS majestic_service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    requested_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Majestic Properties Table
CREATE TABLE IF NOT EXISTS majestic_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'XOF',
    property_type TEXT NOT NULL CHECK (property_type IN ('villa', 'apartment', 'mansion', 'penthouse')),
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    area_sqm INTEGER NOT NULL,
    images TEXT[] DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    access_level TEXT NOT NULL DEFAULT 'vip' CHECK (access_level IN ('vip', 'black')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Majestic Messages Table
CREATE TABLE IF NOT EXISTS majestic_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    is_from_user BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Majestic Payments Table
CREATE TABLE IF NOT EXISTS majestic_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'service', 'booking', 'property')),
    reference_id UUID,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'XOF',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method TEXT DEFAULT 'stripe',
    stripe_payment_intent_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Majestic Transactions Table
CREATE TABLE IF NOT EXISTS majestic_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES majestic_payments(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'credit')),
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'XOF',
    description TEXT NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Majestic Documents Table
CREATE TABLE IF NOT EXISTS majestic_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES majestic_bookings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    access_code TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Majestic Notifications Table
CREATE TABLE IF NOT EXISTS majestic_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('booking', 'chauffeur', 'checkout', 'service', 'payment', 'system')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_majestic_subscriptions_user_id ON majestic_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_subscriptions_status ON majestic_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_majestic_bookings_user_id ON majestic_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_bookings_status ON majestic_bookings(status);
CREATE INDEX IF NOT EXISTS idx_majestic_services_user_id ON majestic_services(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_services_active ON majestic_services(is_active);
CREATE INDEX IF NOT EXISTS idx_majestic_service_requests_user_id ON majestic_service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_service_requests_status ON majestic_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_majestic_properties_user_id ON majestic_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_properties_available ON majestic_properties(is_available);
CREATE INDEX IF NOT EXISTS idx_majestic_properties_access_level ON majestic_properties(access_level);
CREATE INDEX IF NOT EXISTS idx_majestic_messages_user_id ON majestic_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_messages_is_read ON majestic_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_majestic_payments_user_id ON majestic_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_payments_status ON majestic_payments(status);
CREATE INDEX IF NOT EXISTS idx_majestic_transactions_user_id ON majestic_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_documents_user_id ON majestic_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_notifications_user_id ON majestic_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_notifications_is_read ON majestic_notifications(is_read);

-- Enable Row Level Security (RLS)
-- Only users can access their own data
ALTER TABLE majestic_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE majestic_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE majestic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE majestic_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE majestic_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE majestic_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE majestic_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE majestic_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE majestic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE majestic_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own data
CREATE POLICY "Users can view own majestic_subscriptions" ON majestic_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own majestic_bookings" ON majestic_bookings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own majestic_services" ON majestic_services
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own majestic_service_requests" ON majestic_service_requests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own majestic_properties" ON majestic_properties
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own majestic_messages" ON majestic_messages
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own majestic_payments" ON majestic_payments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own majestic_transactions" ON majestic_transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own majestic_documents" ON majestic_documents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own majestic_notifications" ON majestic_notifications
    FOR ALL USING (auth.uid() = user_id);

-- Insert sample data for testing
INSERT INTO majestic_services (name, category, description, base_price, metadata, is_active) VALUES
('Chef Privé', 'chef', 'Chef personnel pour dîners gastronomiques exclusifs', 150000, '{"duration": "8h", "cuisine": "française"}', true),
('Chauffeur VIP', 'chauffeur', 'Chauffeur professionnel avec véhicule de luxe', 100000, '{"vehicle": "Mercedes S-Class", "languages": ["FR", "EN"]}', true),
('Concierge Service', 'concierge', 'Service de conciergerie personnalisé 24/7', 50000, '{"features": ["réservations", "recommandations", "assistance"]}', true),
('Sécurité Privée', 'security', 'Équipe de sécurité pour événements et protection', 200000, '{"team_size": 2, "equipment": "professionnel"}', true);

INSERT INTO majestic_properties (title, description, location, price, property_type, bedrooms, bathrooms, area_sqm, images, access_level, metadata, is_available, is_featured) VALUES
('Villa de Luxe - Saint-Tropez', 'Villa privée avec piscine et vue mer méditerranéenne', 2500000, 'villa', 6, 4, 350, '{"piscine": "infinie", "vue": "mer"}', 'black', true),
('Suite Présidentielle - Paris', 'Suite présidentielle avec vue Tour Eiffel', 1500000, 'apartment', 3, 2, 200, '{"hotel": "Crillon", "etage": "penthouse"}', 'black', true),
('Penthouse Exclusif - Monaco', 'Penthouse avec terrasse panoramique sur Monaco', 3000000, 'penthouse', 4, 3, 280, '{"vue": "port", "terrasse": "100m²"}', 'black', false);
