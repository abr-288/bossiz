-- =====================================================================
-- Bossiz Impact : campagne de contribution au développement de Bossiz
-- (« Ensemble pour la croissance de Bossiz »), et avantages des Membres
-- Impact dans le programme de fidélité Bossiz Smiles.
--
-- Principes :
--  * Bossiz Impact collecte ; Bossiz Smiles récompense. Les Smiles restent
--    des points de fidélité (registre loyalty_transactions existant) : pas
--    de solde en argent, pas de retrait, pas de conversion fixée ici. Leur
--    valeur d'utilisation est celle des réglages Smiles (direction).
--  * Aucune écriture financière depuis le navigateur : contributions,
--    avantages attribués et utilisations passent par des fonctions SQL
--    (SECURITY DEFINER) qui contrôlent droits, montants et statuts.
--  * Une contribution n'est « payée » que sur confirmation du webhook Jèko
--    vérifié (signature, montant, devise) : impact_confirm_contribution()
--    n'est appelable que par le serveur (service_role), une seule fois.
--  * Rien n'est supprimé : clés étrangères RESTRICT sur l'historique,
--    corrections par écritures inverses, journal d'audit.
--  * La campagne est créée en brouillon (invisible) : offres, avantages et
--    conditions sont à valider par la direction avant ouverture.
--
-- Prérequis : programme Smiles (20261016010000, 20261016020000).
-- À exécuter dans le SQL Editor AVANT de déployer process-payment,
-- jeko-webhook (et les fonctions utilisant postPaymentSuccess) et le site.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Campagnes, services éligibles, offres et avantages (configuration)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.impact_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 3 AND 160),
  tagline TEXT,
  secondary_tagline TEXT,
  summary TEXT,
  description TEXT,
  goal_xof NUMERIC(14,0) NOT NULL CHECK (goal_xof > 0),
  target_members INTEGER CHECK (target_members IS NULL OR target_members > 0),
  min_contribution_xof NUMERIC(14,0) NOT NULL DEFAULT 5000 CHECK (min_contribution_xof >= 100),
  max_contribution_xof NUMERIC(14,0),
  allow_free_amount BOOLEAN NOT NULL DEFAULT true,
  currency TEXT NOT NULL DEFAULT 'XOF' CHECK (currency = 'XOF'),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended', 'closed')),
  -- Validité des avantages et des Smiles attribués (mois) et date de départ
  -- éventuelle fixée par les conditions du programme (sinon : paiement).
  benefits_validity_months INTEGER NOT NULL DEFAULT 24 CHECK (benefits_validity_months BETWEEN 1 AND 120),
  benefits_valid_from DATE,
  -- [{ "title", "description", "amount_xof" }] : utilisation prévue des fonds
  funding_uses JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(funding_uses) = 'array'),
  -- [{ "title", "description", "target_xof", "done" }] : étapes financées
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(milestones) = 'array'),
  -- [{ "question", "answer" }]
  faq JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(faq) = 'array'),
  terms TEXT,
  terms_version TEXT NOT NULL DEFAULT '1',
  legal_entity TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  -- Moyens de paiement réellement activés sur le compte Jèko (affichés).
  accepted_methods TEXT[] NOT NULL DEFAULT '{}'
    CHECK (accepted_methods <@ ARRAY['wave', 'orange_money', 'mtn', 'moov', 'djamo']::TEXT[]),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (max_contribution_xof IS NULL OR max_contribution_xof >= min_contribution_xof),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

-- Services Bossiz pouvant accepter des avantages : désactivés par défaut,
-- chacun doit être activé explicitement.
CREATE TABLE IF NOT EXISTS public.impact_eligible_services (
  key TEXT PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  label TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS public.impact_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.impact_campaigns(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 80),
  description TEXT,
  min_amount_xof NUMERIC(14,0) NOT NULL CHECK (min_amount_xof >= 100),
  max_amount_xof NUMERIC(14,0),
  -- Smiles attribués à la confirmation du paiement (0 = aucun).
  smiles_awarded INTEGER NOT NULL DEFAULT 0 CHECK (smiles_awarded >= 0),
  -- NULL : durée de la campagne.
  validity_months INTEGER CHECK (validity_months IS NULL OR validity_months BETWEEN 1 AND 120),
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  max_members INTEGER CHECK (max_members IS NULL OR max_members > 0),
  terms TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (max_amount_xof IS NULL OR max_amount_xof >= min_amount_xof)
);
CREATE INDEX IF NOT EXISTS impact_offers_campaign_idx ON public.impact_offers (campaign_id, sort_order);

-- Avantage commercial d'une offre. Ses conditions s'appliquent aux
-- attributions futures : chaque attribution garde une copie (snapshot).
CREATE TABLE IF NOT EXISTS public.impact_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.impact_offers(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 2 AND 120),
  description TEXT,
  benefit_type TEXT NOT NULL DEFAULT 'other'
    CHECK (benefit_type IN ('percent_discount', 'fixed_discount', 'service', 'priority', 'other')),
  -- % pour percent_discount, FCFA pour fixed_discount, sinon NULL.
  value NUMERIC(14,2) CHECK (value IS NULL OR value >= 0),
  max_discount_xof NUMERIC(14,0) CHECK (max_discount_xof IS NULL OR max_discount_xof >= 0),
  uses_per_member INTEGER NOT NULL DEFAULT 1 CHECK (uses_per_member BETWEEN 1 AND 1000),
  eligible_services TEXT[] NOT NULL DEFAULT '{}',
  cumulable BOOLEAN NOT NULL DEFAULT false,
  exclusions TEXT,
  conditions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (benefit_type <> 'percent_discount' OR (value IS NOT NULL AND value <= 100))
);
CREATE INDEX IF NOT EXISTS impact_benefits_offer_idx ON public.impact_benefits (offer_id, sort_order);

-- ---------------------------------------------------------------------
-- 2. Membres, contributions, avantages attribués, utilisations, audit
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.impact_member_seq;

CREATE TABLE IF NOT EXISTS public.impact_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SET NULL : la suppression d'un compte ne supprime pas l'historique.
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  member_reference TEXT NOT NULL UNIQUE
    DEFAULT 'MI-' || lpad(nextval('public.impact_member_seq')::TEXT, 5, '0'),
  display_name TEXT,
  first_contribution_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.impact_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE
    DEFAULT 'IMP-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10)),
  campaign_id UUID NOT NULL REFERENCES public.impact_campaigns(id) ON DELETE RESTRICT,
  offer_id UUID REFERENCES public.impact_offers(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_id UUID REFERENCES public.impact_members(id) ON DELETE RESTRICT,
  amount_xof NUMERIC(14,0) NOT NULL CHECK (amount_xof >= 100),
  currency TEXT NOT NULL DEFAULT 'XOF' CHECK (currency = 'XOF'),
  -- pending : créée ; processing : lien de paiement émis ; paid : confirmé
  -- par le prestataire ; expired : abandonnée ; refunded : remboursée.
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  contributor_name TEXT NOT NULL,
  contributor_email TEXT,
  contributor_phone TEXT,
  terms_version TEXT NOT NULL,
  terms_accepted_at TIMESTAMPTZ NOT NULL,
  -- Offre, avantages et validité tels qu'acceptés au moment de contribuer.
  offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_transaction_id TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  refund_reference TEXT,
  refunded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS impact_contributions_campaign_idx ON public.impact_contributions (campaign_id, status);
CREATE INDEX IF NOT EXISTS impact_contributions_user_idx ON public.impact_contributions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.impact_member_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id UUID NOT NULL REFERENCES public.impact_contributions(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL REFERENCES public.impact_members(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  benefit_id UUID NOT NULL REFERENCES public.impact_benefits(id) ON DELETE RESTRICT,
  -- Copie des conditions au moment de l'attribution.
  title TEXT NOT NULL,
  details JSONB NOT NULL,
  uses_allowed INTEGER NOT NULL CHECK (uses_allowed >= 1),
  valid_from TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  revoked_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contribution_id, benefit_id)
);
CREATE INDEX IF NOT EXISTS impact_member_benefits_member_idx ON public.impact_member_benefits (member_id);

CREATE TABLE IF NOT EXISTS public.impact_benefit_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_benefit_id UUID NOT NULL REFERENCES public.impact_member_benefits(id) ON DELETE RESTRICT,
  service_key TEXT NOT NULL REFERENCES public.impact_eligible_services(key) ON DELETE RESTRICT,
  order_reference TEXT NOT NULL CHECK (length(btrim(order_reference)) BETWEEN 2 AND 120),
  discount_xof NUMERIC(14,0) NOT NULL DEFAULT 0 CHECK (discount_xof >= 0),
  note TEXT,
  recorded_by UUID NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  cancel_reason TEXT
);
-- Une même commande ne consomme un avantage qu'une fois.
CREATE UNIQUE INDEX IF NOT EXISTS impact_benefit_uses_once_idx
  ON public.impact_benefit_uses (member_benefit_id, order_reference)
  WHERE cancelled_at IS NULL;

CREATE TABLE IF NOT EXISTS public.impact_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor UUID,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS impact_audit_log_entity_idx ON public.impact_audit_log (entity, entity_id, created_at DESC);

-- Paiement Jèko d'une contribution.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS impact_contribution_id UUID
    REFERENCES public.impact_contributions(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS payments_impact_contribution_idx ON public.payments (impact_contribution_id);

-- Même contrainte qu'en 20261008010000, avec la contribution Impact comme
-- cible exclusive supplémentaire.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_target_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_target_check
  CHECK (
    (
      impact_contribution_id IS NOT NULL
      AND agency_branding_subscription_id IS NULL
      AND subscription_id IS NULL
      AND booking_id IS NULL
      AND car_partner_subscription_id IS NULL
    )
    OR (
      impact_contribution_id IS NULL
      AND (
        (
          agency_branding_subscription_id IS NOT NULL
          AND subscription_id IS NULL
          AND booking_id IS NULL
          AND car_partner_subscription_id IS NULL
        )
        OR (
          agency_branding_subscription_id IS NULL
          AND (
            booking_id IS NOT NULL
            OR subscription_id IS NOT NULL
            OR car_partner_subscription_id IS NOT NULL
          )
        )
      )
    )
  );

-- ---------------------------------------------------------------------
-- 3. Accès (RLS)
-- ---------------------------------------------------------------------
ALTER TABLE public.impact_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_eligible_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_member_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_benefit_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_audit_log ENABLE ROW LEVEL SECURITY;

-- Configuration : lisible publiquement hors brouillon, modifiable par un admin.
DROP POLICY IF EXISTS "Public reads published impact campaigns" ON public.impact_campaigns;
CREATE POLICY "Public reads published impact campaigns" ON public.impact_campaigns
  FOR SELECT USING (status <> 'draft' OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins manage impact campaigns" ON public.impact_campaigns;
CREATE POLICY "Admins manage impact campaigns" ON public.impact_campaigns
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public reads impact services" ON public.impact_eligible_services;
CREATE POLICY "Public reads impact services" ON public.impact_eligible_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage impact services" ON public.impact_eligible_services;
CREATE POLICY "Admins manage impact services" ON public.impact_eligible_services
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public reads impact offers" ON public.impact_offers;
CREATE POLICY "Public reads impact offers" ON public.impact_offers
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR (is_active AND EXISTS (SELECT 1 FROM public.impact_campaigns c WHERE c.id = campaign_id AND c.status <> 'draft'))
  );
DROP POLICY IF EXISTS "Admins manage impact offers" ON public.impact_offers;
CREATE POLICY "Admins manage impact offers" ON public.impact_offers
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public reads impact benefits" ON public.impact_benefits;
CREATE POLICY "Public reads impact benefits" ON public.impact_benefits
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR (is_active AND EXISTS (
      SELECT 1 FROM public.impact_offers o JOIN public.impact_campaigns c ON c.id = o.campaign_id
      WHERE o.id = offer_id AND o.is_active AND c.status <> 'draft'
    ))
  );
DROP POLICY IF EXISTS "Admins manage impact benefits" ON public.impact_benefits;
CREATE POLICY "Admins manage impact benefits" ON public.impact_benefits
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Données des membres : chacun ne lit que les siennes ; l'admin lit tout.
-- Aucune écriture directe (fonctions ci-dessous uniquement).
DROP POLICY IF EXISTS "Members read own impact membership" ON public.impact_members;
CREATE POLICY "Members read own impact membership" ON public.impact_members
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Members read own impact contributions" ON public.impact_contributions;
CREATE POLICY "Members read own impact contributions" ON public.impact_contributions
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Members read own impact benefits" ON public.impact_member_benefits;
CREATE POLICY "Members read own impact benefits" ON public.impact_member_benefits
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Members read own impact benefit uses" ON public.impact_benefit_uses;
CREATE POLICY "Members read own impact benefit uses" ON public.impact_benefit_uses
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.impact_member_benefits mb WHERE mb.id = member_benefit_id AND mb.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Admins read impact audit log" ON public.impact_audit_log;
CREATE POLICY "Admins read impact audit log" ON public.impact_audit_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 4. Audit et horodatage de la configuration
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.impact_log(p_action TEXT, p_entity TEXT, p_entity_id TEXT, p_details JSONB)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.impact_audit_log (actor, action, entity, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.impact_log(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.impact_config_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND to_jsonb(NEW) ? 'updated_at' THEN
    NEW.updated_at := now();
  END IF;
  PERFORM public.impact_log(
    lower(TG_OP),
    TG_TABLE_NAME,
    coalesce((to_jsonb(NEW) ->> 'id'), (to_jsonb(NEW) ->> 'key'), (to_jsonb(OLD) ->> 'id'), (to_jsonb(OLD) ->> 'key')),
    jsonb_build_object(
      'old', CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
      'new', CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END
    )
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['impact_campaigns', 'impact_offers', 'impact_benefits', 'impact_eligible_services'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS impact_config_audit ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER impact_config_audit BEFORE INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.impact_config_audit()', t);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------
-- 5. Bossiz Smiles : attributions Impact, validité propre, corrections
-- ---------------------------------------------------------------------
-- Une attribution peut porter sa propre date d'expiration (24 mois pour
-- Impact) ; sinon la règle générale des Smiles s'applique.
ALTER TABLE public.loyalty_transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE public.loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_kind_check;
ALTER TABLE public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_kind_check
  CHECK (kind IN ('purchase', 'referral', 'referral_welcome', 'checkin', 'streak', 'redeem', 'adjustment', 'expiry',
                  'impact', 'impact_reversal'));

-- Les Smiles Impact ne font pas monter de niveau (les niveaux récompensent
-- les achats) : même règle que les ajustements.
CREATE OR REPLACE FUNCTION public.loyalty_lifetime(p_user UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT coalesce(sum(points), 0)::INTEGER
  FROM public.loyalty_transactions
  WHERE user_id = p_user AND status = 'posted' AND points > 0 AND kind NOT IN ('adjustment', 'impact');
$$;

-- Smiles arrivés à expiration à la date p_at et pas encore consommés. Les
-- utilisations consomment d'abord les Smiles qui expirent le plus tôt.
CREATE OR REPLACE FUNCTION public.loyalty_expirable_at(p_user UUID, p_at TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH s AS (SELECT points_validity_months AS months FROM public.loyalty_settings LIMIT 1)
  SELECT greatest(
    0,
    coalesce(sum(t.points) FILTER (
      WHERE t.points > 0 AND t.status = 'posted'
        AND coalesce(
          t.expires_at,
          CASE WHEN s.months > 0 THEN t.created_at + make_interval(months => s.months) END
        ) <= p_at
    ), 0)
    + coalesce(sum(t.points) FILTER (WHERE t.points < 0 AND t.status IN ('posted', 'pending')), 0)
  )::INTEGER
  FROM public.loyalty_transactions t, s
  WHERE t.user_id = p_user;
$$;
REVOKE ALL ON FUNCTION public.loyalty_expirable_at(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

-- Même tâche quotidienne (cron loyalty-expire-points), avec les dates
-- d'expiration propres à chaque attribution.
CREATE OR REPLACE FUNCTION public.loyalty_expire_points()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  s public.loyalty_settings;
  member RECORD;
  amount INTEGER;
  total INTEGER := 0;
BEGIN
  SELECT * INTO s FROM public.loyalty_settings LIMIT 1;

  FOR member IN
    SELECT DISTINCT t.user_id
    FROM public.loyalty_transactions t
    WHERE t.points > 0 AND t.status = 'posted'
      AND coalesce(
        t.expires_at,
        CASE WHEN s.points_validity_months > 0 THEN t.created_at + make_interval(months => s.points_validity_months) END
      ) <= now()
  LOOP
    PERFORM 1 FROM public.loyalty_accounts WHERE user_id = member.user_id FOR UPDATE;
    amount := public.loyalty_expirable_at(member.user_id, now());
    IF amount > 0 THEN
      INSERT INTO public.loyalty_transactions (user_id, kind, points, description, reference_id)
      VALUES (member.user_id, 'expiry', -amount, 'Smiles arrivés à expiration', 'expiry-' || current_date::TEXT)
      ON CONFLICT DO NOTHING;
      total := total + amount;
    END IF;
  END LOOP;
  RETURN total;
END;
$$;

-- Résumé client (version de 20261016020000) : Smiles qui expirent dans les
-- 30 jours, dates propres comprises.
CREATE OR REPLACE FUNCTION public.loyalty_get_summary()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  acc public.loyalty_accounts;
  lifetime INTEGER;
  tier public.loyalty_tiers;
  next_tier public.loyalty_tiers;
  s public.loyalty_settings;
  expiring INTEGER := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;
  acc := public.loyalty_ensure_account(uid);
  lifetime := public.loyalty_lifetime(uid);
  SELECT * INTO tier FROM public.loyalty_tiers WHERE min_points <= lifetime ORDER BY min_points DESC LIMIT 1;
  SELECT * INTO next_tier FROM public.loyalty_tiers WHERE min_points > lifetime ORDER BY min_points ASC LIMIT 1;
  SELECT * INTO s FROM public.loyalty_settings LIMIT 1;

  expiring := public.loyalty_expirable_at(uid, now() + interval '30 days');

  RETURN jsonb_build_object(
    'balance', public.loyalty_balance(uid),
    'pending', (SELECT coalesce(-sum(points), 0) FROM public.loyalty_transactions WHERE user_id = uid AND status = 'pending'),
    'lifetime', lifetime,
    'tier', to_jsonb(tier),
    'next_tier', to_jsonb(next_tier),
    'referral_code', acc.referral_code,
    'referred', acc.referred_by IS NOT NULL,
    'referrals', (SELECT count(*) FROM public.loyalty_accounts WHERE referred_by = uid AND referral_rewarded),
    'streak', CASE WHEN acc.last_checkin_date >= current_date - 1 THEN acc.checkin_streak ELSE 0 END,
    'checked_in_today', coalesce(acc.last_checkin_date = current_date, false),
    'expiring_soon', expiring,
    'expiring_by', (current_date + 30),
    'settings', to_jsonb(s) - 'id' - 'updated_at'
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 6. Contribution : création, confirmation, expiration
-- ---------------------------------------------------------------------
-- Montant collecté et membres confirmés d'une campagne (paiements
-- confirmés et non remboursés uniquement).
CREATE OR REPLACE FUNCTION public.impact_campaign_totals(p_campaign_id UUID)
RETURNS TABLE (collected_xof NUMERIC, members INTEGER, contributions INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(sum(amount_xof), 0), count(DISTINCT member_id)::int, count(*)::int
  FROM public.impact_contributions
  WHERE campaign_id = p_campaign_id AND status = 'paid';
$$;

-- Page publique : campagne (hors brouillon, sauf aperçu admin), offres
-- disponibles et chiffres agrégés. Aucune donnée personnelle.
CREATE OR REPLACE FUNCTION public.impact_public_campaign(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.impact_campaigns;
  totals RECORD;
BEGIN
  SELECT * INTO c FROM public.impact_campaigns WHERE slug = p_slug;
  IF NOT FOUND OR (c.status = 'draft' AND NOT public.has_role(auth.uid(), 'admin')) THEN
    RETURN NULL;
  END IF;
  SELECT * INTO totals FROM public.impact_campaign_totals(c.id);

  RETURN jsonb_build_object(
    'campaign', to_jsonb(c) - 'created_at' - 'updated_at',
    'collected_xof', totals.collected_xof,
    'members', totals.members,
    'percent', least(100, round(totals.collected_xof * 100 / nullif(c.goal_xof, 0), 1)),
    'is_open', c.status = 'active'
      AND (c.starts_at IS NULL OR c.starts_at <= now())
      AND (c.ends_at IS NULL OR c.ends_at > now()),
    'offers', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'description', o.description,
        'min_amount_xof', o.min_amount_xof,
        'max_amount_xof', o.max_amount_xof,
        'smiles_awarded', o.smiles_awarded,
        'validity_months', coalesce(o.validity_months, c.benefits_validity_months),
        'terms', o.terms,
        'available', (o.available_from IS NULL OR o.available_from <= now())
          AND (o.available_until IS NULL OR o.available_until > now())
          AND (o.max_members IS NULL OR (
            SELECT count(DISTINCT ic.member_id) FROM public.impact_contributions ic
            WHERE ic.offer_id = o.id AND ic.status = 'paid') < o.max_members),
        'benefits', coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'title', b.title,
            'description', b.description,
            'benefit_type', b.benefit_type,
            'value', b.value,
            'max_discount_xof', b.max_discount_xof,
            'uses_per_member', b.uses_per_member,
            'cumulable', b.cumulable,
            'exclusions', b.exclusions,
            'conditions', b.conditions,
            'services', (
              SELECT coalesce(jsonb_agg(s.label ORDER BY s.sort_order), '[]'::jsonb)
              FROM public.impact_eligible_services s
              WHERE s.key = ANY (b.eligible_services) AND s.is_enabled
            )
          ) ORDER BY b.sort_order)
          FROM public.impact_benefits b
          WHERE b.offer_id = o.id AND b.is_active
        ), '[]'::jsonb)
      ) ORDER BY o.sort_order, o.min_amount_xof)
      FROM public.impact_offers o
      WHERE o.campaign_id = c.id AND o.is_active
    ), '[]'::jsonb)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.impact_public_campaign(TEXT) TO anon, authenticated;

-- Crée une contribution « pending » pour le membre connecté. Le montant,
-- l'offre et les conditions sont vérifiés ici ; le paiement est ensuite
-- initié par process-payment, qui relit ce montant.
CREATE OR REPLACE FUNCTION public.impact_start_contribution(
  p_campaign_id UUID,
  p_offer_id UUID,
  p_amount_xof NUMERIC,
  p_name TEXT,
  p_phone TEXT,
  p_accept_terms BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  c public.impact_campaigns;
  o public.impact_offers;
  v_amount NUMERIC(14,0);
  v_name TEXT := left(btrim(coalesce(p_name, '')), 100);
  v_phone TEXT := left(regexp_replace(coalesce(p_phone, ''), '[^0-9+ ]', '', 'g'), 30);
  v_email TEXT;
  v_snapshot JSONB;
  v_id UUID;
  v_reference TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Connectez-vous pour contribuer' USING ERRCODE = '42501';
  END IF;
  IF p_accept_terms IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Vous devez accepter les conditions du programme' USING ERRCODE = '22023';
  END IF;
  IF length(v_name) < 2 THEN
    RAISE EXCEPTION 'Indiquez votre nom' USING ERRCODE = '22023';
  END IF;
  IF p_amount_xof IS NULL OR p_amount_xof <> round(p_amount_xof) THEN
    RAISE EXCEPTION 'Montant invalide' USING ERRCODE = '22023';
  END IF;
  v_amount := p_amount_xof;

  -- Limitation : 5 contributions initiées par 10 minutes.
  IF (SELECT count(*) FROM public.impact_contributions
      WHERE user_id = uid AND created_at > now() - interval '10 minutes') >= 5 THEN
    RAISE EXCEPTION 'Trop de tentatives, réessayez dans quelques minutes' USING ERRCODE = '54000';
  END IF;

  SELECT * INTO c FROM public.impact_campaigns WHERE id = p_campaign_id;
  IF NOT FOUND OR c.status <> 'active'
     OR (c.starts_at IS NOT NULL AND c.starts_at > now())
     OR (c.ends_at IS NOT NULL AND c.ends_at <= now()) THEN
    RAISE EXCEPTION 'Cette campagne n''accepte pas de contribution pour le moment' USING ERRCODE = '22023';
  END IF;
  -- Pas de collecte sans conditions publiées (acceptées par le membre).
  IF coalesce(btrim(c.terms), '') = '' THEN
    RAISE EXCEPTION 'Les conditions du programme ne sont pas encore publiées' USING ERRCODE = '22023';
  END IF;
  IF v_amount < c.min_contribution_xof THEN
    RAISE EXCEPTION 'La contribution minimale est de % FCFA', c.min_contribution_xof USING ERRCODE = '22023';
  END IF;
  IF c.max_contribution_xof IS NOT NULL AND v_amount > c.max_contribution_xof THEN
    RAISE EXCEPTION 'La contribution maximale est de % FCFA', c.max_contribution_xof USING ERRCODE = '22023';
  END IF;

  IF p_offer_id IS NULL THEN
    IF NOT c.allow_free_amount THEN
      RAISE EXCEPTION 'Choisissez une offre' USING ERRCODE = '22023';
    END IF;
    v_snapshot := jsonb_build_object('offer', NULL, 'benefits', '[]'::jsonb, 'smiles_awarded', 0,
                                     'validity_months', c.benefits_validity_months);
  ELSE
    SELECT * INTO o FROM public.impact_offers WHERE id = p_offer_id AND campaign_id = c.id;
    IF NOT FOUND OR NOT o.is_active
       OR (o.available_from IS NOT NULL AND o.available_from > now())
       OR (o.available_until IS NOT NULL AND o.available_until <= now()) THEN
      RAISE EXCEPTION 'Cette offre n''est pas disponible' USING ERRCODE = '22023';
    END IF;
    IF v_amount < o.min_amount_xof OR (o.max_amount_xof IS NOT NULL AND v_amount > o.max_amount_xof) THEN
      IF o.max_amount_xof IS NULL THEN
        RAISE EXCEPTION 'Pour l''offre %, le montant minimum est de % FCFA', o.name, o.min_amount_xof USING ERRCODE = '22023';
      END IF;
      RAISE EXCEPTION 'Pour l''offre %, le montant doit être compris entre % et % FCFA',
        o.name, o.min_amount_xof, o.max_amount_xof USING ERRCODE = '22023';
    END IF;
    IF o.max_members IS NOT NULL AND (
      SELECT count(DISTINCT member_id) FROM public.impact_contributions
      WHERE offer_id = o.id AND status = 'paid'
    ) >= o.max_members THEN
      RAISE EXCEPTION 'Cette offre est complète' USING ERRCODE = '22023';
    END IF;
    v_snapshot := jsonb_build_object(
      'offer', jsonb_build_object('id', o.id, 'name', o.name, 'description', o.description, 'terms', o.terms),
      'smiles_awarded', o.smiles_awarded,
      'validity_months', coalesce(o.validity_months, c.benefits_validity_months),
      'benefits', coalesce((
        SELECT jsonb_agg(to_jsonb(b) - 'created_at' - 'updated_at' ORDER BY b.sort_order)
        FROM public.impact_benefits b
        WHERE b.offer_id = o.id AND b.is_active
      ), '[]'::jsonb)
    );
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = uid;

  INSERT INTO public.impact_contributions (
    campaign_id, offer_id, user_id, amount_xof, contributor_name, contributor_email, contributor_phone,
    terms_version, terms_accepted_at, offer_snapshot
  )
  VALUES (c.id, p_offer_id, uid, v_amount, v_name, v_email, nullif(v_phone, ''), c.terms_version, now(), v_snapshot)
  RETURNING id, reference INTO v_id, v_reference;

  PERFORM public.impact_log('contribution_started', 'impact_contributions', v_id::TEXT,
    jsonb_build_object('amount_xof', v_amount, 'offer_id', p_offer_id));

  RETURN jsonb_build_object('id', v_id, 'reference', v_reference, 'amount_xof', v_amount);
END;
$$;
REVOKE ALL ON FUNCTION public.impact_start_contribution(UUID, UUID, NUMERIC, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_start_contribution(UUID, UUID, NUMERIC, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Confirmation après paiement vérifié (webhook Jèko signé, montant et
-- devise contrôlés). Serveur uniquement. Idempotente : un second appel ne
-- réattribue rien.
CREATE OR REPLACE FUNCTION public.impact_confirm_contribution(p_contribution_id UUID, p_transaction_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ct public.impact_contributions;
  c public.impact_campaigns;
  m public.impact_members;
  v_start TIMESTAMPTZ;
  v_expires TIMESTAMPTZ;
  v_months INTEGER;
  v_smiles INTEGER;
  b JSONB;
BEGIN
  SELECT * INTO ct FROM public.impact_contributions WHERE id = p_contribution_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contribution introuvable' USING ERRCODE = 'P0002';
  END IF;
  IF ct.status = 'paid' THEN
    RETURN jsonb_build_object('status', 'paid', 'already', true);
  END IF;
  -- Un paiement arrivé après expiration de la tentative est bien encaissé :
  -- il est confirmé. Un remboursement ou une annulation ne l'est jamais.
  IF ct.status NOT IN ('pending', 'processing', 'expired') THEN
    RAISE EXCEPTION 'Contribution % non confirmable (statut %)', ct.reference, ct.status USING ERRCODE = '22023';
  END IF;
  IF ct.user_id IS NULL THEN
    RAISE EXCEPTION 'Contribution sans compte membre' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO c FROM public.impact_campaigns WHERE id = ct.campaign_id;

  INSERT INTO public.impact_members (user_id, display_name, first_contribution_at)
  VALUES (ct.user_id, ct.contributor_name, now())
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO m FROM public.impact_members WHERE user_id = ct.user_id;

  UPDATE public.impact_contributions
  SET status = 'paid', paid_at = now(), member_id = m.id,
      provider_transaction_id = coalesce(p_transaction_id, provider_transaction_id), updated_at = now()
  WHERE id = ct.id;

  -- Validité : à partir du paiement, ou de la date fixée par le programme.
  v_start := greatest(now(), coalesce(c.benefits_valid_from::TIMESTAMPTZ, now()));
  v_months := coalesce((ct.offer_snapshot ->> 'validity_months')::INTEGER, c.benefits_validity_months);
  v_expires := v_start + make_interval(months => v_months);

  FOR b IN SELECT * FROM jsonb_array_elements(coalesce(ct.offer_snapshot -> 'benefits', '[]'::jsonb)) LOOP
    INSERT INTO public.impact_member_benefits (
      contribution_id, member_id, user_id, benefit_id, title, details, uses_allowed, valid_from, expires_at
    )
    VALUES (
      ct.id, m.id, ct.user_id, (b ->> 'id')::UUID, b ->> 'title', b,
      coalesce((b ->> 'uses_per_member')::INTEGER, 1), v_start, v_expires
    )
    ON CONFLICT (contribution_id, benefit_id) DO NOTHING;
  END LOOP;

  v_smiles := coalesce((ct.offer_snapshot ->> 'smiles_awarded')::INTEGER, 0);
  IF v_smiles > 0 THEN
    PERFORM public.loyalty_ensure_account(ct.user_id);
    INSERT INTO public.loyalty_transactions (user_id, kind, points, description, reference_id, expires_at)
    VALUES (ct.user_id, 'impact', v_smiles,
            'Bossiz Impact - ' || coalesce(ct.offer_snapshot #>> '{offer,name}', 'contribution'),
            'impact:' || ct.id::TEXT, v_expires)
    ON CONFLICT DO NOTHING;
  END IF;

  PERFORM public.impact_log('contribution_paid', 'impact_contributions', ct.id::TEXT,
    jsonb_build_object('transaction_id', p_transaction_id, 'amount_xof', ct.amount_xof, 'smiles', v_smiles));

  RETURN jsonb_build_object('status', 'paid', 'member_reference', m.member_reference, 'smiles', v_smiles);
END;
$$;
REVOKE ALL ON FUNCTION public.impact_confirm_contribution(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.impact_confirm_contribution(UUID, TEXT) TO service_role;

-- Tentatives sans paiement depuis 24 h : expirées (non comptées).
CREATE OR REPLACE FUNCTION public.impact_expire_stale_contributions()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH expired AS (
    UPDATE public.impact_contributions
    SET status = 'expired', updated_at = now()
    WHERE status IN ('pending', 'processing') AND created_at < now() - interval '24 hours'
    RETURNING 1
  )
  SELECT count(*)::INTEGER FROM expired;
$$;
REVOKE ALL ON FUNCTION public.impact_expire_stale_contributions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.impact_expire_stale_contributions() TO service_role;

-- ---------------------------------------------------------------------
-- 7. Espace membre
-- ---------------------------------------------------------------------
-- État d'un avantage, calculé côté serveur.
CREATE OR REPLACE FUNCTION public.impact_benefit_state(mb public.impact_member_benefits)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN mb.revoked_at IS NOT NULL THEN 'revoked'
    WHEN (SELECT count(*) FROM public.impact_benefit_uses u
          WHERE u.member_benefit_id = mb.id AND u.cancelled_at IS NULL) >= mb.uses_allowed THEN 'used'
    WHEN mb.expires_at <= now() THEN 'expired'
    WHEN mb.valid_from > now() THEN 'upcoming'
    ELSE 'available'
  END;
$$;
REVOKE ALL ON FUNCTION public.impact_benefit_state(public.impact_member_benefits) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.impact_my_overview()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  m public.impact_members;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO m FROM public.impact_members WHERE user_id = uid;

  RETURN jsonb_build_object(
    'member_reference', m.member_reference,
    'member_since', m.first_contribution_at,
    'total_paid_xof', (SELECT coalesce(sum(amount_xof), 0) FROM public.impact_contributions
                       WHERE user_id = uid AND status = 'paid'),
    'contributions', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ct.id, 'reference', ct.reference, 'amount_xof', ct.amount_xof, 'status', ct.status,
        'offer_name', ct.offer_snapshot #>> '{offer,name}', 'campaign', cp.name,
        'created_at', ct.created_at, 'paid_at', ct.paid_at, 'refunded_at', ct.refunded_at
      ) ORDER BY ct.created_at DESC)
      FROM public.impact_contributions ct JOIN public.impact_campaigns cp ON cp.id = ct.campaign_id
      WHERE ct.user_id = uid
    ), '[]'::jsonb),
    'benefits', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', mb.id, 'title', mb.title, 'details', mb.details - 'id' - 'offer_id',
        'uses_allowed', mb.uses_allowed,
        'uses', (SELECT count(*) FROM public.impact_benefit_uses u WHERE u.member_benefit_id = mb.id AND u.cancelled_at IS NULL),
        'valid_from', mb.valid_from, 'expires_at', mb.expires_at,
        'state', public.impact_benefit_state(mb),
        'history', coalesce((
          SELECT jsonb_agg(jsonb_build_object('used_at', u.used_at, 'order_reference', u.order_reference,
                                              'discount_xof', u.discount_xof, 'cancelled', u.cancelled_at IS NOT NULL)
                           ORDER BY u.used_at DESC)
          FROM public.impact_benefit_uses u WHERE u.member_benefit_id = mb.id
        ), '[]'::jsonb)
      ) ORDER BY mb.expires_at)
      FROM public.impact_member_benefits mb
      WHERE mb.user_id = uid
    ), '[]'::jsonb),
    'smiles', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'kind', t.kind, 'points', t.points, 'description', t.description, 'created_at', t.created_at,
        'expires_at', t.expires_at
      ) ORDER BY t.created_at DESC)
      FROM public.loyalty_transactions t
      WHERE t.user_id = uid AND t.kind IN ('impact', 'impact_reversal') AND t.status = 'posted'
    ), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.impact_my_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_my_overview() TO authenticated;

-- ---------------------------------------------------------------------
-- 8. Administration
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.impact_require_admin()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.impact_require_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_require_admin() TO authenticated;

-- Tableau de bord. « net » = confirmé (non remboursé) ; les montants
-- remboursés sont donnés à part. Définition à valider par le comptable.
CREATE OR REPLACE FUNCTION public.impact_admin_overview(p_campaign_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.impact_campaigns;
  point_value NUMERIC;
BEGIN
  PERFORM public.impact_require_admin();
  SELECT * INTO c FROM public.impact_campaigns WHERE id = p_campaign_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campagne introuvable' USING ERRCODE = 'P0002';
  END IF;
  SELECT point_value_xof INTO point_value FROM public.loyalty_settings LIMIT 1;

  RETURN jsonb_build_object(
    'goal_xof', c.goal_xof,
    'confirmed_xof', (SELECT coalesce(sum(amount_xof), 0) FROM public.impact_contributions WHERE campaign_id = c.id AND status = 'paid'),
    'pending_xof', (SELECT coalesce(sum(amount_xof), 0) FROM public.impact_contributions WHERE campaign_id = c.id AND status IN ('pending', 'processing')),
    'refunded_xof', (SELECT coalesce(sum(amount_xof), 0) FROM public.impact_contributions WHERE campaign_id = c.id AND status = 'refunded'),
    'members', (SELECT count(DISTINCT member_id) FROM public.impact_contributions WHERE campaign_id = c.id AND status = 'paid'),
    'paid_count', (SELECT count(*) FROM public.impact_contributions WHERE campaign_id = c.id AND status = 'paid'),
    'failed_count', (SELECT count(*) FROM public.impact_contributions WHERE campaign_id = c.id AND status IN ('failed', 'expired', 'cancelled')),
    'pending_count', (SELECT count(*) FROM public.impact_contributions WHERE campaign_id = c.id AND status IN ('pending', 'processing')),
    'refunded_count', (SELECT count(*) FROM public.impact_contributions WHERE campaign_id = c.id AND status = 'refunded'),
    'by_offer', coalesce((
      SELECT jsonb_agg(jsonb_build_object('offer', name, 'count', n, 'amount_xof', total) ORDER BY total DESC)
      FROM (
        SELECT coalesce(ct.offer_snapshot #>> '{offer,name}', 'Contribution libre') AS name, count(*) AS n, sum(ct.amount_xof) AS total
        FROM public.impact_contributions ct WHERE ct.campaign_id = c.id AND ct.status = 'paid'
        GROUP BY 1
      ) x
    ), '[]'::jsonb),
    'by_method', coalesce((
      SELECT jsonb_agg(jsonb_build_object('method', method, 'count', n, 'amount_xof', total) ORDER BY total DESC)
      FROM (
        SELECT coalesce(p.payment_data ->> 'payment_method', 'inconnu') AS method, count(*) AS n, sum(ct.amount_xof) AS total
        FROM public.impact_contributions ct
        LEFT JOIN LATERAL (
          SELECT payment_data FROM public.payments
          WHERE impact_contribution_id = ct.id AND status = 'completed' ORDER BY created_at DESC LIMIT 1
        ) p ON true
        WHERE ct.campaign_id = c.id AND ct.status = 'paid'
        GROUP BY 1
      ) x
    ), '[]'::jsonb),
    'by_day', coalesce((
      SELECT jsonb_agg(jsonb_build_object('day', d, 'amount_xof', total) ORDER BY d)
      FROM (
        SELECT (paid_at AT TIME ZONE 'Africa/Abidjan')::DATE AS d, sum(amount_xof) AS total
        FROM public.impact_contributions WHERE campaign_id = c.id AND status = 'paid'
        GROUP BY 1
      ) x
    ), '[]'::jsonb),
    -- Engagements commerciaux en cours (avantages non utilisés et non
    -- expirés, Smiles Impact restant à honorer).
    'obligations', jsonb_build_object(
      'open_benefits', (
        SELECT count(*) FROM public.impact_member_benefits mb
        JOIN public.impact_contributions ct ON ct.id = mb.contribution_id
        WHERE ct.campaign_id = c.id AND public.impact_benefit_state(mb) IN ('available', 'upcoming')
      ),
      'max_discount_open_xof', (
        SELECT coalesce(sum(
          (mb.details ->> 'max_discount_xof')::NUMERIC
          * (mb.uses_allowed - (SELECT count(*) FROM public.impact_benefit_uses u
                                WHERE u.member_benefit_id = mb.id AND u.cancelled_at IS NULL))
        ), 0)
        FROM public.impact_member_benefits mb
        JOIN public.impact_contributions ct ON ct.id = mb.contribution_id
        WHERE ct.campaign_id = c.id AND public.impact_benefit_state(mb) IN ('available', 'upcoming')
          AND mb.details ->> 'max_discount_xof' IS NOT NULL
      ),
      'uncapped_open_benefits', (
        SELECT count(*) FROM public.impact_member_benefits mb
        JOIN public.impact_contributions ct ON ct.id = mb.contribution_id
        WHERE ct.campaign_id = c.id AND public.impact_benefit_state(mb) IN ('available', 'upcoming')
          AND mb.details ->> 'max_discount_xof' IS NULL
      ),
      'impact_smiles_awarded', (
        SELECT coalesce(sum(t.points), 0) FROM public.loyalty_transactions t
        JOIN public.impact_contributions ct ON t.reference_id = 'impact:' || ct.id::TEXT
        WHERE ct.campaign_id = c.id AND t.kind = 'impact' AND t.status = 'posted'
      ),
      'smile_value_xof', point_value
    )
  );
END;
$$;
REVOKE ALL ON FUNCTION public.impact_admin_overview(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_admin_overview(UUID) TO authenticated;

-- Transactions (contributions + paiement Jèko associé), filtrables.
CREATE OR REPLACE FUNCTION public.impact_admin_transactions(
  p_campaign_id UUID,
  p_status TEXT DEFAULT NULL,
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  contribution_id UUID,
  reference TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  status TEXT,
  amount_xof NUMERIC,
  offer_name TEXT,
  member_reference TEXT,
  contributor_name TEXT,
  contributor_email TEXT,
  payment_method TEXT,
  provider_transaction_id TEXT,
  provider_status TEXT,
  payment_status TEXT,
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  refund_reference TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  pattern TEXT := '%' || coalesce(btrim(p_search), '') || '%';
BEGIN
  PERFORM public.impact_require_admin();
  RETURN QUERY
  SELECT ct.id, ct.reference, ct.created_at, ct.paid_at, ct.status, ct.amount_xof,
    coalesce(ct.offer_snapshot #>> '{offer,name}', 'Contribution libre'),
    m.member_reference, ct.contributor_name, ct.contributor_email,
    p.payment_data ->> 'payment_method', coalesce(ct.provider_transaction_id, p.transaction_id),
    p.payment_data ->> 'jeko_status', p.status,
    ct.refunded_at, ct.refund_reason, ct.refund_reference
  FROM public.impact_contributions ct
  LEFT JOIN public.impact_members m ON m.id = ct.member_id
  LEFT JOIN LATERAL (
    SELECT * FROM public.payments py WHERE py.impact_contribution_id = ct.id ORDER BY py.created_at DESC LIMIT 1
  ) p ON true
  WHERE ct.campaign_id = p_campaign_id
    AND (p_status IS NULL OR ct.status = p_status)
    AND (p_from IS NULL OR ct.created_at >= p_from::TIMESTAMPTZ)
    AND (p_to IS NULL OR ct.created_at < (p_to + 1)::TIMESTAMPTZ)
    AND (coalesce(btrim(p_search), '') = ''
         OR ct.reference ILIKE pattern OR ct.contributor_name ILIKE pattern
         OR ct.contributor_email ILIKE pattern OR m.member_reference ILIKE pattern
         OR coalesce(ct.provider_transaction_id, p.transaction_id) ILIKE pattern)
  ORDER BY ct.created_at DESC
  LIMIT 2000;
END;
$$;
REVOKE ALL ON FUNCTION public.impact_admin_transactions(UUID, TEXT, DATE, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_admin_transactions(UUID, TEXT, DATE, DATE, TEXT) TO authenticated;

-- Membres d'une campagne, avec leurs totaux et leur solde de Smiles.
CREATE OR REPLACE FUNCTION public.impact_admin_members(p_campaign_id UUID, p_search TEXT DEFAULT NULL)
RETURNS TABLE (
  member_id UUID,
  member_reference TEXT,
  user_id UUID,
  display_name TEXT,
  email TEXT,
  paid_xof NUMERIC,
  contributions INTEGER,
  open_benefits INTEGER,
  smiles_balance INTEGER,
  first_contribution_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  pattern TEXT := '%' || coalesce(btrim(p_search), '') || '%';
BEGIN
  PERFORM public.impact_require_admin();
  RETURN QUERY
  SELECT m.id, m.member_reference, m.user_id, m.display_name, u.email::TEXT,
    coalesce(sum(ct.amount_xof) FILTER (WHERE ct.status = 'paid'), 0),
    (count(ct.id) FILTER (WHERE ct.status = 'paid'))::INTEGER,
    (SELECT count(*)::INTEGER FROM public.impact_member_benefits mb
     WHERE mb.member_id = m.id AND public.impact_benefit_state(mb) = 'available'),
    CASE WHEN m.user_id IS NULL THEN 0 ELSE public.loyalty_balance(m.user_id) END,
    m.first_contribution_at
  FROM public.impact_members m
  JOIN public.impact_contributions ct ON ct.member_id = m.id AND ct.campaign_id = p_campaign_id
  LEFT JOIN auth.users u ON u.id = m.user_id
  WHERE coalesce(btrim(p_search), '') = ''
     OR m.member_reference ILIKE pattern OR m.display_name ILIKE pattern OR u.email ILIKE pattern
  GROUP BY m.id, u.email
  ORDER BY 6 DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.impact_admin_members(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_admin_members(UUID, TEXT) TO authenticated;

-- Avantages d'un membre (référence MI-xxxxx) avec leur état : sert à
-- vérifier l'éligibilité avant d'appliquer un avantage à une commande.
CREATE OR REPLACE FUNCTION public.impact_admin_member_benefits(p_member_reference TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m public.impact_members;
BEGIN
  PERFORM public.impact_require_admin();
  SELECT * INTO m FROM public.impact_members WHERE member_reference = upper(btrim(p_member_reference));
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object(
    'member', jsonb_build_object('id', m.id, 'reference', m.member_reference, 'name', m.display_name),
    'smiles_balance', CASE WHEN m.user_id IS NULL THEN 0 ELSE public.loyalty_balance(m.user_id) END,
    'benefits', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', mb.id, 'title', mb.title, 'details', mb.details, 'uses_allowed', mb.uses_allowed,
        'uses', (SELECT count(*) FROM public.impact_benefit_uses u WHERE u.member_benefit_id = mb.id AND u.cancelled_at IS NULL),
        'valid_from', mb.valid_from, 'expires_at', mb.expires_at, 'state', public.impact_benefit_state(mb),
        'revoked_reason', mb.revoked_reason,
        'history', coalesce((
          SELECT jsonb_agg(jsonb_build_object('id', u.id, 'used_at', u.used_at, 'service_key', u.service_key,
                                              'order_reference', u.order_reference, 'discount_xof', u.discount_xof,
                                              'note', u.note, 'cancelled_at', u.cancelled_at, 'cancel_reason', u.cancel_reason)
                           ORDER BY u.used_at DESC)
          FROM public.impact_benefit_uses u WHERE u.member_benefit_id = mb.id
        ), '[]'::jsonb)
      ) ORDER BY mb.expires_at)
      FROM public.impact_member_benefits mb WHERE mb.member_id = m.id
    ), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.impact_admin_member_benefits(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_admin_member_benefits(TEXT) TO authenticated;

-- Utilisation d'un avantage sur une commande : vérifie l'état (non expiré,
-- non révoqué, utilisations restantes), le service et le plafond, avec un
-- verrou contre la double utilisation.
CREATE OR REPLACE FUNCTION public.impact_admin_use_benefit(
  p_member_benefit_id UUID,
  p_service_key TEXT,
  p_order_reference TEXT,
  p_discount_xof NUMERIC,
  p_note TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mb public.impact_member_benefits;
  v_services TEXT[];
  v_cap NUMERIC;
  v_id UUID;
BEGIN
  PERFORM public.impact_require_admin();
  SELECT * INTO mb FROM public.impact_member_benefits WHERE id = p_member_benefit_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avantage introuvable' USING ERRCODE = 'P0002';
  END IF;
  IF public.impact_benefit_state(mb) <> 'available' THEN
    RAISE EXCEPTION 'Avantage non utilisable (%)', public.impact_benefit_state(mb) USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.impact_eligible_services WHERE key = p_service_key AND is_enabled) THEN
    RAISE EXCEPTION 'Service non activé pour les avantages Impact' USING ERRCODE = '22023';
  END IF;
  SELECT coalesce(array_agg(x), '{}') INTO v_services
  FROM jsonb_array_elements_text(coalesce(mb.details -> 'eligible_services', '[]'::jsonb)) x;
  IF NOT (p_service_key = ANY (v_services)) THEN
    RAISE EXCEPTION 'Cet avantage ne s''applique pas à ce service' USING ERRCODE = '22023';
  END IF;
  IF p_discount_xof IS NULL OR p_discount_xof < 0 OR p_discount_xof <> round(p_discount_xof) THEN
    RAISE EXCEPTION 'Montant de réduction invalide' USING ERRCODE = '22023';
  END IF;
  v_cap := (mb.details ->> 'max_discount_xof')::NUMERIC;
  IF v_cap IS NOT NULL AND p_discount_xof > v_cap THEN
    RAISE EXCEPTION 'Réduction plafonnée à % FCFA pour cet avantage', v_cap USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.impact_benefit_uses (member_benefit_id, service_key, order_reference, discount_xof, note, recorded_by)
  VALUES (mb.id, p_service_key, btrim(p_order_reference), p_discount_xof, nullif(btrim(p_note), ''), auth.uid())
  RETURNING id INTO v_id;

  PERFORM public.impact_log('benefit_used', 'impact_member_benefits', mb.id::TEXT,
    jsonb_build_object('use_id', v_id, 'service', p_service_key, 'order', p_order_reference, 'discount_xof', p_discount_xof));
  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Cet avantage est déjà appliqué à cette commande' USING ERRCODE = '23505';
END;
$$;
REVOKE ALL ON FUNCTION public.impact_admin_use_benefit(UUID, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_admin_use_benefit(UUID, TEXT, TEXT, NUMERIC, TEXT) TO authenticated;

-- Annulation d'une utilisation (commande annulée) : écriture conservée.
CREATE OR REPLACE FUNCTION public.impact_admin_cancel_benefit_use(p_use_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.impact_require_admin();
  IF coalesce(btrim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Le motif est obligatoire' USING ERRCODE = '22023';
  END IF;
  UPDATE public.impact_benefit_uses
  SET cancelled_at = now(), cancelled_by = auth.uid(), cancel_reason = left(btrim(p_reason), 300)
  WHERE id = p_use_id AND cancelled_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisation introuvable ou déjà annulée' USING ERRCODE = 'P0002';
  END IF;
  PERFORM public.impact_log('benefit_use_cancelled', 'impact_benefit_uses', p_use_id::TEXT,
    jsonb_build_object('reason', p_reason));
END;
$$;
REVOKE ALL ON FUNCTION public.impact_admin_cancel_benefit_use(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_admin_cancel_benefit_use(UUID, TEXT) TO authenticated;

-- Remboursement : à exécuter APRÈS le remboursement réel chez le
-- prestataire (référence obligatoire). Révoque les avantages non utilisés
-- et retire les Smiles Impact encore disponibles par écriture corrective ;
-- ce qui a déjà été utilisé est indiqué dans le résultat.
CREATE OR REPLACE FUNCTION public.impact_admin_refund(p_contribution_id UUID, p_reason TEXT, p_provider_reference TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ct public.impact_contributions;
  v_awarded INTEGER;
  v_reversed INTEGER := 0;
  v_used_benefits INTEGER;
BEGIN
  PERFORM public.impact_require_admin();
  IF coalesce(btrim(p_reason), '') = '' OR coalesce(btrim(p_provider_reference), '') = '' THEN
    RAISE EXCEPTION 'Motif et référence du remboursement chez le prestataire obligatoires' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO ct FROM public.impact_contributions WHERE id = p_contribution_id FOR UPDATE;
  IF NOT FOUND OR ct.status <> 'paid' THEN
    RAISE EXCEPTION 'Seule une contribution payée peut être remboursée' USING ERRCODE = '22023';
  END IF;

  UPDATE public.impact_contributions
  SET status = 'refunded', refunded_at = now(), refund_reason = left(btrim(p_reason), 500),
      refund_reference = left(btrim(p_provider_reference), 120), refunded_by = auth.uid(), updated_at = now()
  WHERE id = ct.id;

  SELECT count(*) INTO v_used_benefits
  FROM public.impact_member_benefits mb
  WHERE mb.contribution_id = ct.id
    AND EXISTS (SELECT 1 FROM public.impact_benefit_uses u WHERE u.member_benefit_id = mb.id AND u.cancelled_at IS NULL);

  UPDATE public.impact_member_benefits
  SET revoked_at = now(), revoked_reason = 'Contribution remboursée', revoked_by = auth.uid()
  WHERE contribution_id = ct.id AND revoked_at IS NULL;

  SELECT coalesce(sum(points), 0) INTO v_awarded
  FROM public.loyalty_transactions
  WHERE reference_id = 'impact:' || ct.id::TEXT AND kind = 'impact' AND status = 'posted';
  IF v_awarded > 0 AND ct.user_id IS NOT NULL THEN
    PERFORM 1 FROM public.loyalty_accounts WHERE user_id = ct.user_id FOR UPDATE;
    v_reversed := least(v_awarded, greatest(public.loyalty_balance(ct.user_id), 0));
    IF v_reversed > 0 THEN
      INSERT INTO public.loyalty_transactions (user_id, kind, points, description, reference_id, created_by)
      VALUES (ct.user_id, 'impact_reversal', -v_reversed, 'Bossiz Impact - contribution remboursée',
              'impact-reversal:' || ct.id::TEXT, auth.uid())
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  PERFORM public.impact_log('contribution_refunded', 'impact_contributions', ct.id::TEXT,
    jsonb_build_object('reason', p_reason, 'provider_reference', p_provider_reference,
                       'smiles_awarded', v_awarded, 'smiles_reversed', v_reversed,
                       'benefits_already_used', v_used_benefits));

  RETURN jsonb_build_object('smiles_awarded', v_awarded, 'smiles_reversed', v_reversed,
                            'smiles_already_used', v_awarded - v_reversed, 'benefits_already_used', v_used_benefits);
END;
$$;
REVOKE ALL ON FUNCTION public.impact_admin_refund(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_admin_refund(UUID, TEXT, TEXT) TO authenticated;

-- Révocation d'un avantage (erreur, fraude…) : motif obligatoire, tracée.
CREATE OR REPLACE FUNCTION public.impact_admin_revoke_benefit(p_member_benefit_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.impact_require_admin();
  IF coalesce(btrim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Le motif est obligatoire' USING ERRCODE = '22023';
  END IF;
  UPDATE public.impact_member_benefits
  SET revoked_at = now(), revoked_reason = left(btrim(p_reason), 300), revoked_by = auth.uid()
  WHERE id = p_member_benefit_id AND revoked_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avantage introuvable ou déjà révoqué' USING ERRCODE = 'P0002';
  END IF;
  PERFORM public.impact_log('benefit_revoked', 'impact_member_benefits', p_member_benefit_id::TEXT,
    jsonb_build_object('reason', p_reason));
END;
$$;
REVOKE ALL ON FUNCTION public.impact_admin_revoke_benefit(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_admin_revoke_benefit(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------
-- 9. Données initiales (à valider par la direction) et tâche planifiée
-- ---------------------------------------------------------------------
INSERT INTO public.impact_eligible_services (key, label, description, sort_order) VALUES
  ('conciergerie', 'Conciergerie', 'Prestations de la conciergerie Bossiz', 10),
  ('voyages', 'Voyages et billetterie', 'Vols, trains, billets d''événements', 20),
  ('assistance_voyage', 'Assistance voyage', 'Assistance et prestations liées aux voyages', 30),
  ('hotels', 'Hébergement', 'Hôtels et séjours réservés via Bossiz', 40),
  ('location_vehicules', 'Location de véhicules', 'Locations de voitures', 50),
  ('services_numeriques', 'Services numériques', 'Abonnements et services numériques Bossiz', 60),
  ('autres', 'Autres prestations', 'Autres prestations commerciales approuvées par Bossiz', 90)
ON CONFLICT (key) DO NOTHING;

-- Campagne en brouillon : invisible tant qu'un admin ne l'a pas activée.
INSERT INTO public.impact_campaigns (
  slug, name, tagline, secondary_tagline, summary, goal_xof, target_members, min_contribution_xof,
  benefits_validity_months, status
)
VALUES (
  'ensemble-pour-la-croissance-de-bossiz',
  'Ensemble pour la croissance de Bossiz',
  'Ensemble, faisons grandir Bossiz.',
  'Votre soutien, notre avenir commun.',
  'Bossiz Impact invite sa communauté à soutenir le développement de Bossiz par une contribution volontaire. En remerciement, les Membres Impact bénéficient d''avantages commerciaux Bossiz Smiles.',
  5000000, 200, 5000, 24, 'draft'
)
ON CONFLICT (slug) DO NOTHING;

-- Offres proposées (montants indicatifs, sans Smiles ni avantages tant que
-- la direction ne les a pas définis).
INSERT INTO public.impact_offers (campaign_id, name, description, min_amount_xof, max_amount_xof, sort_order)
SELECT c.id, o.name, o.description, o.min_amount, o.max_amount, o.sort_order
FROM public.impact_campaigns c
CROSS JOIN (VALUES
  ('Découverte', 'Accès au programme Bossiz Smiles.', 5000, 9999, 10),
  ('Soutien', 'Accès au programme Bossiz Smiles et avantages supplémentaires.', 10000, 24999, 20),
  ('Partenaire Smile', 'Avantages commerciaux renforcés.', 25000, 49999, 30),
  ('Grand soutien', 'Avantages commerciaux de niveau supérieur.', 50000, NULL, 40)
) AS o(name, description, min_amount, max_amount, sort_order)
WHERE c.slug = 'ensemble-pour-la-croissance-de-bossiz'
  AND NOT EXISTS (SELECT 1 FROM public.impact_offers x WHERE x.campaign_id = c.id);

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron absent : tâche impact-expire-contributions non planifiée';
    RETURN;
  END IF;
  SELECT jobid INTO existing_job_id FROM cron.job WHERE jobname = 'impact-expire-contributions';
  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
  PERFORM cron.schedule('impact-expire-contributions', '15 * * * *', 'SELECT public.impact_expire_stale_contributions();');
END;
$$;
