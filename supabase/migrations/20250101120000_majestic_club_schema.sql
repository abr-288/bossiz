-- ========================================
-- MAJESTIC CLUB VIP MODULE SCHEMA
-- ========================================

-- 1. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.majestic_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('access', 'access_prive', 'access_black')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.majestic_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('flight', 'hotel', 'villa', 'chauffeur', 'service')),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'XOF',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DOCUMENTS TABLE (with Supabase Storage integration)
CREATE TABLE IF NOT EXISTS public.majestic_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.majestic_bookings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_type TEXT NOT NULL,
  file_size INTEGER,
  is_encrypted BOOLEAN DEFAULT false,
  access_code TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.majestic_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('concierge', 'chauffeur', 'chef', 'security', 'custom')),
  base_price DECIMAL(10,2),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SERVICE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.majestic_service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.majestic_services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  requested_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10,2),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MESSAGES TABLE (for VIP Chat)
CREATE TABLE IF NOT EXISTS public.majestic_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  is_from_user BOOLEAN DEFAULT true,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PROPERTIES TABLE (Off-Market)
CREATE TABLE IF NOT EXISTS public.majestic_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  price DECIMAL(12,2),
  currency TEXT DEFAULT 'XOF',
  property_type TEXT NOT NULL CHECK (property_type IN ('villa', 'apartment', 'mansion', 'penthouse')),
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_sqm INTEGER,
  images TEXT[], -- Array of image URLs
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'vip' CHECK (access_level IN ('vip', 'black')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ITINERARIES TABLE
CREATE TABLE IF NOT EXISTS public.majestic_itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed')),
  total_cost DECIMAL(10,2),
  currency TEXT DEFAULT 'XOF',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.majestic_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'service', 'booking', 'property')),
  reference_id UUID, -- Reference to the related table
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.majestic_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.majestic_payments(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'credit')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'XOF',
  description TEXT,
  balance_after DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.majestic_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking', 'chauffeur', 'checkout', 'service', 'payment', 'system')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_majestic_subscriptions_user_id ON public.majestic_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_subscriptions_status ON public.majestic_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_majestic_bookings_user_id ON public.majestic_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_bookings_status ON public.majestic_bookings(status);
CREATE INDEX IF NOT EXISTS idx_majestic_documents_user_id ON public.majestic_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_service_requests_user_id ON public.majestic_service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_messages_user_id ON public.majestic_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_properties_available ON public.majestic_properties(is_available);
CREATE INDEX IF NOT EXISTS idx_majestic_itineraries_user_id ON public.majestic_itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_payments_user_id ON public.majestic_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_transactions_user_id ON public.majestic_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_notifications_user_id ON public.majestic_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_majestic_notifications_unread ON public.majestic_notifications(user_id, is_read);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.majestic_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majestic_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majestic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majestic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majestic_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majestic_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majestic_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majestic_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majestic_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majestic_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majestic_notifications ENABLE ROW LEVEL SECURITY;

-- SUBSCRIPTIONS POLICIES
CREATE POLICY "Users can view their own subscriptions" ON public.majestic_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.majestic_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON public.majestic_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- BOOKINGS POLICIES
CREATE POLICY "Users can view their own bookings" ON public.majestic_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookings" ON public.majestic_bookings
  FOR ALL WITH CHECK (auth.uid() = user_id);

-- DOCUMENTS POLICIES
CREATE POLICY "Users can view their own documents" ON public.majestic_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own documents" ON public.majestic_documents
  FOR ALL WITH CHECK (auth.uid() = user_id);

-- SERVICES POLICIES (Public read access for VIP users)
CREATE POLICY "VIP users can view services" ON public.majestic_services
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.majestic_subscriptions 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- SERVICE REQUESTS POLICIES
CREATE POLICY "Users can view their own service requests" ON public.majestic_service_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own service requests" ON public.majestic_service_requests
  FOR ALL WITH CHECK (auth.uid() = user_id);

-- MESSAGES POLICIES
CREATE POLICY "Users can view their own messages" ON public.majestic_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON public.majestic_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PROPERTIES POLICIES (VIP access only)
CREATE POLICY "VIP users can view properties" ON public.majestic_properties
  FOR SELECT USING (
    is_available = true AND
    EXISTS (
      SELECT 1 FROM public.majestic_subscriptions 
      WHERE user_id = auth.uid() AND status = 'active' AND plan IN ('access_prive', 'access_black')
    )
  );

-- ITINERARIES POLICIES
CREATE POLICY "Users can view their own itineraries" ON public.majestic_itineraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own itineraries" ON public.majestic_itineraries
  FOR ALL WITH CHECK (auth.uid() = user_id);

-- PAYMENTS POLICIES
CREATE POLICY "Users can view their own payments" ON public.majestic_payments
  FOR SELECT USING (auth.uid() = user_id);

-- TRANSACTIONS POLICIES
CREATE POLICY "Users can view their own transactions" ON public.majestic_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their own notifications" ON public.majestic_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.majestic_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

CREATE TRIGGER update_majestic_subscriptions_updated_at
  BEFORE UPDATE ON public.majestic_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_majestic_bookings_updated_at
  BEFORE UPDATE ON public.majestic_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_majestic_documents_updated_at
  BEFORE UPDATE ON public.majestic_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_majestic_services_updated_at
  BEFORE UPDATE ON public.majestic_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_majestic_service_requests_updated_at
  BEFORE UPDATE ON public.majestic_service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_majestic_properties_updated_at
  BEFORE UPDATE ON public.majestic_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_majestic_itineraries_updated_at
  BEFORE UPDATE ON public.majestic_itineraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_majestic_payments_updated_at
  BEFORE UPDATE ON public.majestic_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- INITIAL DATA SEED
-- ========================================

-- Insert default services
INSERT INTO public.majestic_services (name, description, category, base_price, metadata) VALUES
('Private Chef', 'Personal chef for your villa', 'chef', 150000, '{"duration": "full_day", "cuisines": ["french", "italian", "japanese", "local"]}'),
('Personal Chauffeur', 'Luxury vehicle with professional driver', 'chauffeur', 75000, '{"vehicle_types": ["mercedes_s_class", "bmw_7_series", "range_rover"]}'),
('Security Detail', 'Professional security team', 'security', 200000, '{"team_size": "2-4", "equipment": "advanced"}'),
('Private Jet Transfer', 'Luxury air transportation', 'concierge', 1500000, '{"aircraft_types": ["citation", "gulfstream", "falcon"]}'),
('Yacht Rental', 'Luxury sea transportation', 'concierge', 500000, '{"yacht_types": ["azimut", "ferretti", "sunseeker"]}'),
('Event Planning', 'Complete event organization', 'concierge', 300000, '{"event_types": ["corporate", "private", "wedding"]}'),
('Personal Shopper', 'Luxury shopping assistance', 'concierge', 100000, '{"specialties": ["fashion", "jewelry", "art"]}'),
('Wellness & Spa', 'Private wellness services', 'concierge', 80000, '{"services": ["massage", "yoga", "meditation"]}')
ON CONFLICT DO NOTHING;

-- Insert sample off-market properties
INSERT INTO public.majestic_properties (title, description, location, price, property_type, bedrooms, bathrooms, area_sqm, images, access_level, metadata) VALUES
('Villa Azure', 'Stunning beachfront villa with private beach access', 'Abidjan, Riviera', 250000000, 'villa', 6, 8, 1200, '{"main": "https://example.com/villa1.jpg"}', 'vip', '{"features": ["private_beach", "infinity_pool", "home_cinema", "wine_cellar"]}'),
('Penthouse Gold', 'Luxury penthouse with panoramic city views', 'Abidjan, Plateau', 180000000, 'penthouse', 4, 5, 800, '{"main": "https://example.com/penthouse1.jpg"}', 'vip', '{"features": ["rooftop_terrace", "private_elevator", "smart_home", "concierge_service"]}'),
('Mansion Noir', 'Exclusive black card members only property', 'Abidjan, Cocody', 500000000, 'mansion', 10, 12, 2500, '{"main": "https://example.com/mansion1.jpg"}', 'black', '{"features": ["private_cinema", "indoor_pool", "tennis_court", "helipad", "butler_service"]}')
ON CONFLICT DO NOTHING;
