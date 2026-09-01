-- NOTE (correctif) : subscription_plans est déjà créée par
-- 20240420_create_subscription_plans.sql (utilisée par le flux de paiement
-- d'abonnement) ; un second "CREATE TABLE" sans IF NOT EXISTS échouait ici avec
-- "relation already exists". On ajoute uniquement les colonnes propres à
-- l'interface d'administration (price_note, popular, color) qui manquaient
-- encore ("price" est ajoutée plus tôt par 20250101120003_user_subscriptions.sql).
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS price_note text,
  ADD COLUMN IF NOT EXISTS popular boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS color text DEFAULT 'from-primary to-primary/80';

-- Create promotions table
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  location text NOT NULL,
  image_url text,
  discount integer NOT NULL CHECK (discount >= 0 AND discount <= 100),
  original_price numeric NOT NULL,
  currency text DEFAULT 'EUR',
  expires_at timestamp with time zone,
  rating numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans
CREATE POLICY "Subscription plans are viewable by everyone"
ON public.subscription_plans FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for promotions
CREATE POLICY "Promotions are viewable by everyone"
ON public.promotions FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage promotions"
ON public.promotions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
-- NOTE (correctif) : "features" est de type JSONB (défini par la création originale
-- de la table dans 20240420_create_subscription_plans.sql), pas TEXT[] ; les
-- littéraux ARRAY[...] sont donc convertis via to_jsonb(). 'premium' et 'business'
-- existent déjà (insérés par 20240420 avec un autre plan_id de même nom) : ON
-- CONFLICT DO NOTHING évite l'échec sur la contrainte UNIQUE(plan_id).
INSERT INTO public.subscription_plans (plan_id, name, subtitle, icon, price, price_note, features, popular, color, sort_order) VALUES
('corporate', 'Corporate Mensuelle', 'Pour les entreprises', 'Building2', '230€ - 460€', 'par mois', to_jsonb(ARRAY['Gestion complète des réservations', 'Négociation de tarifs corporate', 'Support prioritaire 7j/7', 'Gestionnaire dédié']), true, 'from-primary to-primary/80', 1),
('premium', 'Premium VIP', 'Abonnement individuel', 'Crown', '30€ - 55€', 'par mois', to_jsonb(ARRAY['Réservations prioritaires', 'Traitement express visas', 'Assistance 24/7', 'Alertes exclusives']), false, 'from-amber-500 to-amber-600', 2),
('visa', 'Assistance Visa+', 'Personnes & Entreprises', 'FileCheck', 'Sur devis', 'selon destination', to_jsonb(ARRAY['Constitution du dossier', 'Prise de rendez-vous', 'Coaching entretien', 'Suivi prioritaire']), false, 'from-emerald-500 to-emerald-600', 3),
('billets', 'Billets Pro & Famille', 'Tarifs négociés', 'Plane', 'Jusqu''à -18%', 'sur les tarifs publics', to_jsonb(ARRAY['Tarifs professionnels', 'Options flexibles', 'Support complet', 'Tous les vols']), false, 'from-blue-500 to-blue-600', 4),
('family', 'Pack Famille', 'Voyages en famille', 'Users', '70€', 'par mois', to_jsonb(ARRAY['Réservations groupées', 'Tarifs enfants réduits', 'Assurance voyage famille', 'Activités enfants incluses']), false, 'from-pink-500 to-pink-600', 5),
('business', 'Business Traveler', 'Voyageurs fréquents', 'Briefcase', '115€', 'par mois', to_jsonb(ARRAY['Check-in prioritaire', 'Lounge aéroport inclus', 'Modifications illimitées', 'Conciergerie voyage']), false, 'from-slate-600 to-slate-700', 6),
('student', 'Évasion Jeunes', 'Étudiants & -26 ans', 'GraduationCap', '18€', 'par mois', to_jsonb(ARRAY['Tarifs étudiants exclusifs', 'Bagages supplémentaires', 'Annulation flexible', 'Bons plans destinations']), false, 'from-violet-500 to-violet-600', 7),
('events', 'Events & MICE', 'Séminaires & Incentives', 'CalendarDays', 'Sur devis', 'selon groupe', to_jsonb(ARRAY['Organisation complète', 'Logistique événementielle', 'Hébergement groupe', 'Team building inclus']), false, 'from-orange-500 to-orange-600', 8)
ON CONFLICT (plan_id) DO NOTHING;