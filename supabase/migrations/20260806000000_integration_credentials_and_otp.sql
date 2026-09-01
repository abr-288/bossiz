-- Stocke les clés d'API des prestataires externes (email, SMS, autres) pour
-- que l'admin puisse les saisir directement depuis le dashboard, sans passer
-- par la CLI Supabase (supabase secrets set) à chaque fois.
--
-- Sécurité : cette table n'est accessible qu'aux admins authentifiés (RLS),
-- jamais en lecture publique. Les Edge Functions y accèdent via la clé
-- service_role, qui contourne RLS comme pour toutes les autres tables de la
-- plateforme.
--
-- N'a pas pu être appliquée automatiquement (même blocage de permission
-- côté plateforme Supabase que les migrations précédentes — voir
-- 20260805000000_drop_majestic_club.sql). À exécuter manuellement dans le
-- SQL Editor du dashboard Supabase.

CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,           -- 'resend', 'twilio', 'orange_sms_ci', 'africastalking', 'cinetpay', 'jeko', ...
  category text NOT NULL,                  -- 'email' | 'sms' | 'push' | 'payment' | 'other'
  label text NOT NULL,                     -- Nom affiché dans l'admin
  credentials jsonb NOT NULL DEFAULT '{}', -- { api_key, api_secret, from, sender_id, account_sid, ... } selon le prestataire
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage integration credentials"
ON public.integration_credentials
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_updated_at_integration_credentials
  BEFORE UPDATE ON public.integration_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Lignes par défaut (inactives, sans clé) pour que l'admin les voie
-- immédiatement dans le formulaire et n'ait qu'à coller les identifiants.
INSERT INTO public.integration_credentials (provider, category, label, credentials, is_active) VALUES
  -- Resend et CinetPay restent actifs par défaut : leurs clés vivent déjà
  -- dans les secrets d'Edge Function (RESEND_API_KEY, CINETPAY_API_KEY /
  -- CINETPAY_SITE_ID), pas dans cette table. Basculer "actif" vers un autre
  -- prestataire ci-dessous change le comportement immédiatement, sans toucher au code.
  ('resend', 'email', 'Resend (Email)', '{}', true),
  ('smtp', 'email', 'SMTP générique', '{}', false),
  ('twilio', 'sms', 'Twilio (SMS)', '{}', false),
  ('orange_sms_ci', 'sms', 'Orange SMS API (Côte d''Ivoire)', '{}', false),
  ('africastalking', 'sms', 'Africa''s Talking (SMS)', '{}', false),
  ('cinetpay', 'payment', 'CinetPay', '{}', true),
  ('jeko', 'payment', 'Jeko (Mobile Money & Cartes — CI)', '{}', false)
ON CONFLICT (provider) DO NOTHING;

-- ============================================================
-- Système OTP (code à usage unique) pour la connexion par SMS/email
-- ============================================================

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination text NOT NULL,        -- numéro de téléphone ou email
  channel text NOT NULL,            -- 'sms' | 'email'
  code_hash text NOT NULL,          -- hash du code (jamais le code en clair)
  purpose text NOT NULL DEFAULT 'login', -- 'login' | 'signup' | 'verify_phone'
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_destination ON public.otp_codes (destination, purpose);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Aucun accès direct depuis le client : uniquement via les Edge Functions
-- send-otp / verify-otp, en service_role. Pas de policy = accès refusé par
-- défaut à tous les rôles authentifiés/anon.
