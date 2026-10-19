-- Migration: Eden Circle Luxury Schema
-- Description: Tables for Off-market properties, VIP Concierge services and detailed Stay management

-- 1. Off-market properties
CREATE TABLE IF NOT EXISTS public.luxe_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    price_info TEXT, -- e.g. "À partir de 1500€ / nuit"
    images TEXT[] DEFAULT '{}',
    virtual_tour_url TEXT,
    specifications JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. VIP Concierge services
CREATE TABLE IF NOT EXISTS public.concierge_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Chef', 'Chauffeur', 'Sécurité', 'Autre')),
    description TEXT,
    price_range TEXT,
    icon_name TEXT, -- Lucide icon name
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Detailed stay management (extension of bookings)
CREATE TABLE IF NOT EXISTS public.luxe_stay_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    timeline JSONB DEFAULT '[]', -- List of events: {time, label, icon, status}
    smart_lock_code TEXT,
    welcome_guide_url TEXT,
    documents JSONB DEFAULT '[]', -- List of docs: {name, url, type}
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_booking_luxe UNIQUE (booking_id)
);

-- Enable RLS
ALTER TABLE public.luxe_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.luxe_stay_details ENABLE ROW LEVEL SECURITY;

-- Polices (Assuming 'premium' role or similar logic check in frontend, for now simple authenticated read)
CREATE POLICY "Allow authenticated read on luxe_properties" ON public.luxe_properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on concierge_services" ON public.concierge_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow owners to read their luxe_stay_details" ON public.luxe_stay_details FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.bookings WHERE id = luxe_stay_details.booking_id AND user_id = auth.uid()));

-- Insert some dummy data for the prototype
INSERT INTO public.concierge_services (name, category, description, price_range, icon_name) VALUES
('Chef Gastronomique', 'Chef', 'Menu personnalisé préparé à domicile par un chef étoilé.', 'Sur devis', 'Utensils'),
('Chauffeur de Maître', 'Chauffeur', 'Berline de luxe avec chauffeur privé disponible 24/7.', '150€ / trajet', 'Car'),
('Sécurité Rapprochée', 'Sécurité', 'Protection VIP discrète pour vous et vos proches.', 'À partir de 500€ / jour', 'Shield');

INSERT INTO public.luxe_properties (name, description, location, price_info, images) VALUES
('Villa Azure', 'Propriété d’exception avec vue sur mer et piscine à débordement.', 'Riviera', '2500€ / nuit', ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811']),
('Manoir des Cimes', 'Un refuge ultra-luxueux au cœur des montagnes.', 'Courchevel', '5000€ / nuit', ARRAY['https://images.unsplash.com/photo-1518780664697-55e3ad937233']);
