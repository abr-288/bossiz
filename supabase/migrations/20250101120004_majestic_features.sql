-- Migration for Majestic Club Features and 24/7 Assistance System
-- Tables for concierge requests, VIP events, and exclusive services

-- Table for concierge requests
CREATE TABLE IF NOT EXISTS concierge_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL, -- 'travel', 'dining', 'entertainment', 'shopping', 'wellness', 'business', 'other'
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal', -- 'normal', 'urgent', 'immediate'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    assigned_concierge TEXT,
    response_time TIMESTAMP WITH TIME ZONE,
    completion_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for VIP events
CREATE TABLE IF NOT EXISTS vip_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL, -- 'gala', 'conference', 'sports', 'cultural', 'networking', 'private'
    exclusive BOOLEAN DEFAULT true, -- true for majestic members only
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    image_url TEXT,
    requirements TEXT[], -- specific requirements for attendance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for VIP event registrations
CREATE TABLE IF NOT EXISTS vip_event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES vip_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'confirmed', -- 'confirmed', 'waitlist', 'cancelled'
    notes TEXT,
    UNIQUE(event_id, user_id)
);

-- Table for concierge availability (24/7 staff)
CREATE TABLE IF NOT EXISTS concierge_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    specialization TEXT[], -- areas of expertise
    languages TEXT[], -- languages spoken
    timezone TEXT NOT NULL DEFAULT 'UTC',
    is_available BOOLEAN DEFAULT true,
    max_requests INTEGER DEFAULT 10,
    current_requests INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for exclusive services
CREATE TABLE IF NOT EXISTS exclusive_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'transport', 'accommodation', 'dining', 'entertainment', 'wellness', 'security', 'other'
    service_type TEXT NOT NULL, -- 'private_jet', 'yacht', 'chauffeur', 'private_chef', 'security_detail', etc.
    availability BOOLEAN DEFAULT true,
    pricing_model TEXT, -- 'included', 'premium', 'custom'
    requirements TEXT[],
    booking_required BOOLEAN DEFAULT true,
    booking_lead_time INTEGER DEFAULT 48, -- hours
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for service bookings
CREATE TABLE IF NOT EXISTS service_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES exclusive_services(id) ON DELETE CASCADE,
    booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    special_requests TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
    assigned_staff TEXT,
    total_cost DECIMAL(10,2),
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for 24/7 assistance logs
CREATE TABLE IF NOT EXISTS assistance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assistance_type TEXT NOT NULL, -- 'phone', 'chat', 'email', 'video_call'
    request_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time TIMESTAMP WITH TIME ZONE,
    resolution_time TIMESTAMP WITH TIME ZONE,
    staff_id UUID REFERENCES concierge_staff(id),
    issue_description TEXT,
    resolution TEXT,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    follow_up_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample VIP events
INSERT INTO vip_events (title, description, date, location, type, exclusive, max_participants) VALUES
('Gala de Charité Annuel', 'Soirée exclusive de bienfaisance avec dîner et concert', '2025-06-15 19:00:00+00:00', 'Paris, France', 'gala', true, 100),
('Sommet des Leaders Mondiaux', 'Rencontre privé avec des leaders internationaux', '2025-07-20 09:00:00+00:00', 'Genève, Suisse', 'conference', true, 50),
('Course de Formule 1 VIP', 'Accès paddock exclusif et loge privée', '2025-08-10 14:00:00+00:00', 'Monaco', 'sports', true, 30),
('Festival de Cannes Soirée', 'Invitation exclusive au festival et dîner', '2025-05-20 20:00:00+00:00', 'Cannes, France', 'cultural', true, 40),
('Réseau d\\'Investisseurs', 'Rencontre privée avec des investisseurs de premier plan', '2025-09-05 18:00:00+00:00', 'Londres, UK', 'networking', true, 25),
('Dîner Dégustation 3 Étoiles', 'Expérience gastronomique avec chef Michelin', '2025-10-12 19:30:00+00:00', 'Lyon, France', 'dining', true, 20)
ON CONFLICT DO NOTHING;

-- Insert sample exclusive services
INSERT INTO exclusive_services (name, description, category, service_type, availability, pricing_model, booking_lead_time) VALUES
('Jet Privé - Gulfstream G650', 'Avion privé longue distance avec équipage complet', 'transport', 'private_jet', true, 'premium', 24),
('Yacht de Luxe - Sunseeker 131', 'Yacht de 40 mètres avec équipage', 'transport', 'yacht', true, 'premium', 48),
('Chauffeur Personnel - Mercedes S-Class', 'Chauffeur dédié disponible 24/7', 'transport', 'chauffeur', true, 'included', 2),
('Chef Privé à Domicile', 'Chef personnel pour repas et événements', 'dining', 'private_chef', true, 'included', 24),
('Détail de Sécurité', 'Équipe de sécurité professionnelle', 'security', 'security_detail', true, 'included', 12),
('Suite Présidentielle Hôtel', 'Suite de luxe dans les meilleurs hôtels', 'accommodation', 'presidential_suite', true, 'premium', 48),
('Consultations Experts', 'Accès à des experts de renom mondial', 'other', 'expert_consultation', true, 'included', 4),
('Transport Médicalisé', 'Ambulance privée et équipe médicale', 'wellness', 'medical_transport', true, 'premium', 1)
ON CONFLICT DO NOTHING;

-- Insert sample concierge staff
INSERT INTO concierge_staff (name, email, phone, specialization, languages, timezone, max_requests) VALUES
('Marie Dubois', 'marie.dubois@bossiz.com', '+33612345678', ARRAY['travel', 'dining', 'entertainment'], ARRAY['français', 'anglais', 'espagnol'], 'Europe/Paris', 15),
('Jean-Pierre Martin', 'jeanpierre.martin@bossiz.com', '+33687654321', ARRAY['business', 'security', 'transport'], ARRAY['français', 'anglais', 'allemand'], 'Europe/Paris', 12),
('Sophie Laurent', 'sophie.laurent@bossiz.com', '+33698765432', ARRAY['wellness', 'shopping', 'events'], ARRAY['français', 'anglais', 'italien'], 'Europe/Paris', 10),
('Pierre Bernard', 'pierre.bernard@bossiz.com', '+33712345678', ARRAY['travel', 'accommodation', 'transport'], ARRAY['français', 'anglais', 'portugais'], 'Europe/Paris', 8),
('Isabelle Moreau', 'isabelle.moreau@bossiz.com', '+33787654321', ARRAY['events', 'entertainment', 'dining'], ARRAY['français', 'anglais', 'japonais'], 'Europe/Paris', 10)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_concierge_requests_user_id ON concierge_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_concierge_requests_status ON concierge_requests(status);
CREATE INDEX IF NOT EXISTS idx_concierge_requests_priority ON concierge_requests(priority);
CREATE INDEX IF NOT EXISTS idx_vip_events_date ON vip_events(date);
CREATE INDEX IF NOT EXISTS idx_vip_events_exclusive ON vip_events(exclusive);
CREATE INDEX IF NOT EXISTS idx_vip_event_registrations_event_id ON vip_event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_vip_event_registrations_user_id ON vip_event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_concierge_staff_available ON concierge_staff(is_available);
CREATE INDEX IF NOT EXISTS idx_exclusive_services_category ON exclusive_services(category);
CREATE INDEX IF NOT EXISTS idx_service_bookings_user_id ON service_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_assistance_logs_user_id ON assistance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_assistance_logs_request_time ON assistance_logs(request_time);

-- Enable RLS
ALTER TABLE concierge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusive_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Concierge Requests
CREATE POLICY "Users can view their own concierge requests" ON concierge_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own concierge requests" ON concierge_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all concierge requests" ON concierge_requests
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Concierge staff can view assigned requests" ON concierge_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM concierge_staff 
            WHERE name = assigned_concierge 
            AND is_available = true
        )
    );

-- VIP Events
CREATE POLICY "VIP events are viewable by majestic members" ON vip_events
    FOR SELECT USING (
        NOT exclusive OR 
        (auth.jwt() ->> 'subscription_type' = 'majestic')
    );

CREATE POLICY "Admins can manage VIP events" ON vip_events
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- VIP Event Registrations
CREATE POLICY "Users can view their own event registrations" ON vip_event_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own event registrations" ON vip_event_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all event registrations" ON vip_event_registrations
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Concierge Staff
CREATE POLICY "Concierge staff info is viewable by admins and majestic members" ON concierge_staff
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'subscription_type' = 'majestic'
    );

CREATE POLICY "Admins can manage concierge staff" ON concierge_staff
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Exclusive Services
CREATE POLICY "Services are viewable by majestic members" ON exclusive_services
    FOR SELECT USING (auth.jwt() ->> 'subscription_type' = 'majestic');

CREATE POLICY "Admins can manage exclusive services" ON exclusive_services
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Service Bookings
CREATE POLICY "Users can view their own service bookings" ON service_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service bookings" ON service_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all service bookings" ON service_bookings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Assistance Logs
CREATE POLICY "Users can view their own assistance logs" ON assistance_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assistance logs" ON assistance_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all assistance logs" ON assistance_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to auto-assign concierge to requests
CREATE OR REPLACE FUNCTION auto_assign_concierge()
RETURNS TRIGGER AS $$
BEGIN
    -- Find available concierge with least current requests
    UPDATE concierge_requests
    SET assigned_concierge = (
        SELECT name FROM concierge_staff 
        WHERE is_available = true 
        AND current_requests < max_requests
        ORDER BY current_requests ASC, rating DESC
        LIMIT 1
    )
    WHERE id = NEW.id AND assigned_concierge IS NULL;
    
    -- Update concierge request count
    UPDATE concierge_staff 
    SET current_requests = current_requests + 1
    WHERE name = (SELECT assigned_concierge FROM concierge_requests WHERE id = NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment
CREATE TRIGGER assign_concierge_on_request
    AFTER INSERT ON concierge_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_concierge();

-- Update triggers for updated_at columns
CREATE TRIGGER update_concierge_requests_updated_at BEFORE UPDATE ON concierge_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vip_events_updated_at BEFORE UPDATE ON vip_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_concierge_staff_updated_at BEFORE UPDATE ON concierge_staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exclusive_services_updated_at BEFORE UPDATE ON exclusive_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON service_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
