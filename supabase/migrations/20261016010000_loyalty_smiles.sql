-- =====================================================================
-- Programme de fidélité « Smiles Bossiz+ »
--
-- Les clients gagnent des Smiles en achetant (réservations, abonnements),
-- en revenant sur l'application chaque jour et en parrainant des amis, puis
-- les utilisent pour payer une partie de leurs achats.
--
-- Règles de sécurité :
--  * le registre (loyalty_transactions) n'est jamais écrit par le navigateur :
--    uniquement par les fonctions ci-dessous (SECURITY DEFINER) ;
--  * les gains sur achat sont posés par un trigger quand un paiement passe à
--    'completed' : impossible de les déclencher sans payer ;
--  * l'utilisation est réservée par process-payment (service_role) puis
--    confirmée au paiement, ou rendue en cas d'échec / d'abandon / de
--    remboursement.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Paramètres (une seule ligne, modifiable par un admin)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  points_per_100_xof NUMERIC NOT NULL DEFAULT 1,      -- Smiles gagnés par 100 FCFA payés
  point_value_xof NUMERIC NOT NULL DEFAULT 1,         -- valeur d'1 Smile à l'utilisation
  daily_checkin_points INTEGER NOT NULL DEFAULT 10,   -- visite quotidienne
  streak_days INTEGER NOT NULL DEFAULT 7,             -- série de jours consécutifs...
  streak_bonus_points INTEGER NOT NULL DEFAULT 100,   -- ...récompensée par ce bonus
  referral_referrer_points INTEGER NOT NULL DEFAULT 2000,
  referral_referee_points INTEGER NOT NULL DEFAULT 1000,
  min_redeem_points INTEGER NOT NULL DEFAULT 500,
  -- Part maximale d'un paiement réglable en Smiles. 10 % = marge Bossiz sur
  -- une réservation partenaire (l'agence touche 90 % du prix plein).
  max_redeem_ratio NUMERIC NOT NULL DEFAULT 0.10 CHECK (max_redeem_ratio >= 0 AND max_redeem_ratio <= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.loyalty_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Niveaux (selon les Smiles gagnés au total)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL UNIQUE,
  multiplier NUMERIC NOT NULL DEFAULT 1
);
INSERT INTO public.loyalty_tiers (code, name, min_points, multiplier) VALUES
  ('bronze', 'Bronze', 0, 1),
  ('silver', 'Argent', 5000, 1.25),
  ('gold', 'Or', 20000, 1.5),
  ('platinum', 'Platine', 50000, 2)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- Comptes et registre
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_rewarded BOOLEAN NOT NULL DEFAULT false,
  last_checkin_date DATE,
  checkin_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loyalty_accounts_referred_by_idx ON public.loyalty_accounts (referred_by);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('purchase', 'referral', 'referral_welcome', 'checkin', 'streak', 'redeem', 'adjustment')),
  points INTEGER NOT NULL,          -- > 0 : gain ; < 0 : utilisation
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'pending', 'cancelled')),
  description TEXT,
  reference_id TEXT,                -- paiement, filleul, jour de visite...
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loyalty_transactions_user_idx ON public.loyalty_transactions (user_id, created_at DESC);
-- Idempotence : un même événement ne rapporte (ou ne coûte) qu'une fois.
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_transactions_once_idx
  ON public.loyalty_transactions (user_id, kind, reference_id)
  WHERE reference_id IS NOT NULL AND status <> 'cancelled';

-- Smiles utilisés sur un paiement (réduction appliquée par process-payment)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS loyalty_points_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_discount_xof NUMERIC NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- RLS : lecture de ses propres données, aucune écriture côté client
-- ---------------------------------------------------------------------
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read loyalty settings" ON public.loyalty_settings;
CREATE POLICY "Anyone can read loyalty settings" ON public.loyalty_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage loyalty settings" ON public.loyalty_settings;
CREATE POLICY "Admins manage loyalty settings" ON public.loyalty_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can read loyalty tiers" ON public.loyalty_tiers;
CREATE POLICY "Anyone can read loyalty tiers" ON public.loyalty_tiers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users read own loyalty account" ON public.loyalty_accounts;
CREATE POLICY "Users read own loyalty account" ON public.loyalty_accounts FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users read own loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Users read own loyalty transactions" ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- Fonctions internes (jamais appelables par un client)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.loyalty_ensure_account(p_user UUID)
RETURNS public.loyalty_accounts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  acc public.loyalty_accounts;
  new_code TEXT;
BEGIN
  SELECT * INTO acc FROM public.loyalty_accounts WHERE user_id = p_user;
  IF FOUND THEN
    RETURN acc;
  END IF;
  LOOP
    new_code := 'BZ' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    BEGIN
      INSERT INTO public.loyalty_accounts (user_id, referral_code) VALUES (p_user, new_code)
      RETURNING * INTO acc;
      RETURN acc;
    EXCEPTION WHEN unique_violation THEN
      -- Code déjà pris (on en tire un autre) ou compte créé en parallèle
      SELECT * INTO acc FROM public.loyalty_accounts WHERE user_id = p_user;
      IF FOUND THEN
        RETURN acc;
      END IF;
    END;
  END LOOP;
END;
$$;

-- Solde disponible : gains et utilisations confirmés + utilisations en cours
CREATE OR REPLACE FUNCTION public.loyalty_balance(p_user UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT coalesce(sum(points), 0)::INTEGER
  FROM public.loyalty_transactions
  WHERE user_id = p_user AND status IN ('posted', 'pending');
$$;

-- Smiles gagnés au total (détermine le niveau)
CREATE OR REPLACE FUNCTION public.loyalty_lifetime(p_user UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT coalesce(sum(points), 0)::INTEGER
  FROM public.loyalty_transactions
  WHERE user_id = p_user AND status = 'posted' AND points > 0 AND kind <> 'adjustment';
$$;

CREATE OR REPLACE FUNCTION public.loyalty_award_purchase(p_user UUID, p_amount_xof NUMERIC, p_reference TEXT, p_label TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  acc public.loyalty_accounts;
  s public.loyalty_settings;
  tier public.loyalty_tiers;
  pts INTEGER;
BEGIN
  PERFORM public.loyalty_ensure_account(p_user);
  SELECT * INTO acc FROM public.loyalty_accounts WHERE user_id = p_user FOR UPDATE;
  SELECT * INTO s FROM public.loyalty_settings LIMIT 1;
  SELECT * INTO tier FROM public.loyalty_tiers
  WHERE min_points <= public.loyalty_lifetime(p_user)
  ORDER BY min_points DESC LIMIT 1;

  pts := floor(p_amount_xof / 100.0 * s.points_per_100_xof * coalesce(tier.multiplier, 1));
  IF pts > 0 THEN
    INSERT INTO public.loyalty_transactions (user_id, kind, points, description, reference_id)
    VALUES (p_user, 'purchase', pts, p_label, p_reference)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Premier achat payé d'un filleul : parrain et filleul sont récompensés
  IF acc.referred_by IS NOT NULL AND NOT acc.referral_rewarded THEN
    INSERT INTO public.loyalty_transactions (user_id, kind, points, description, reference_id)
    VALUES (p_user, 'referral_welcome', s.referral_referee_points, 'Bienvenue : parrainage', 'welcome')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.loyalty_transactions (user_id, kind, points, description, reference_id)
    VALUES (acc.referred_by, 'referral', s.referral_referrer_points, 'Parrainage d''un ami', p_user::TEXT)
    ON CONFLICT DO NOTHING;
    UPDATE public.loyalty_accounts SET referral_rewarded = true WHERE user_id = p_user;
  END IF;

  RETURN greatest(pts, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_reserve_redemption(p_user UUID, p_points INTEGER, p_reference TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_points IS NULL OR p_points <= 0 THEN
    RETURN false;
  END IF;
  PERFORM public.loyalty_ensure_account(p_user);
  -- Verrou sur le compte : deux paiements simultanés ne peuvent pas
  -- dépenser deux fois les mêmes Smiles.
  PERFORM 1 FROM public.loyalty_accounts WHERE user_id = p_user FOR UPDATE;
  IF public.loyalty_balance(p_user) < p_points THEN
    RETURN false;
  END IF;
  INSERT INTO public.loyalty_transactions (user_id, kind, points, status, description, reference_id)
  VALUES (p_user, 'redeem', -p_points, 'pending', 'Utilisation sur un paiement', p_reference);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_release_redemption(p_user UUID, p_reference TEXT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.loyalty_transactions
  SET status = 'cancelled'
  WHERE user_id = p_user AND kind = 'redeem' AND reference_id = p_reference AND status = 'pending';
$$;

CREATE OR REPLACE FUNCTION public.loyalty_confirm_redemption(p_user UUID, p_reference TEXT, p_points INTEGER)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.loyalty_transactions
  SET status = 'posted', description = 'Utilisé sur un achat'
  WHERE user_id = p_user AND kind = 'redeem' AND reference_id = p_reference AND status = 'pending';
  -- Réservation déjà rendue (paiement réglé très tard) : la réduction a
  -- quand même été accordée, on débite donc les Smiles.
  IF NOT FOUND AND p_points > 0 THEN
    INSERT INTO public.loyalty_transactions (user_id, kind, points, description, reference_id)
    VALUES (p_user, 'redeem', -p_points, 'Utilisé sur un achat', p_reference)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Paiement abandonné : les Smiles réservés depuis plus de 24 h sont rendus
CREATE OR REPLACE FUNCTION public.loyalty_release_stale_redemptions()
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.loyalty_transactions
  SET status = 'cancelled'
  WHERE kind = 'redeem' AND status = 'pending' AND created_at < now() - interval '24 hours';
$$;

-- ---------------------------------------------------------------------
-- Trigger : gains / confirmation / remboursement selon le statut du paiement
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.loyalty_on_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  ref TEXT := 'payment:' || NEW.id::TEXT;
BEGIN
  -- Seuls les achats clients (réservations, abonnements) comptent
  IF NEW.user_id IS NULL OR (NEW.booking_id IS NULL AND NEW.subscription_id IS NULL) THEN
    RETURN NEW;
  END IF;

  -- Le programme ne doit jamais faire échouer la mise à jour d'un paiement
  BEGIN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
      IF NEW.loyalty_points_used > 0 THEN
        PERFORM public.loyalty_confirm_redemption(NEW.user_id, ref, NEW.loyalty_points_used);
      END IF;
      IF coalesce(NEW.currency, 'XOF') = 'XOF' THEN
        PERFORM public.loyalty_award_purchase(
          NEW.user_id,
          NEW.amount,
          ref,
          CASE WHEN NEW.subscription_id IS NOT NULL THEN 'Abonnement' ELSE 'Réservation' END
        );
      END IF;
    ELSIF NEW.status = 'failed' AND OLD.status = 'pending' THEN
      PERFORM public.loyalty_release_redemption(NEW.user_id, ref);
    ELSIF NEW.status = 'refunded' AND OLD.status = 'completed' THEN
      -- Remboursement : Smiles gagnés retirés, Smiles utilisés rendus
      UPDATE public.loyalty_transactions
      SET status = 'cancelled'
      WHERE user_id = NEW.user_id AND reference_id = ref
        AND kind IN ('purchase', 'redeem') AND status = 'posted';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'loyalty_on_payment_status (%): %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loyalty_payment_status ON public.payments;
CREATE TRIGGER loyalty_payment_status
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.loyalty_on_payment_status();

-- ---------------------------------------------------------------------
-- Fonctions appelées par l'application (client connecté)
-- ---------------------------------------------------------------------
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
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;
  acc := public.loyalty_ensure_account(uid);
  lifetime := public.loyalty_lifetime(uid);
  SELECT * INTO tier FROM public.loyalty_tiers WHERE min_points <= lifetime ORDER BY min_points DESC LIMIT 1;
  SELECT * INTO next_tier FROM public.loyalty_tiers WHERE min_points > lifetime ORDER BY min_points ASC LIMIT 1;
  SELECT * INTO s FROM public.loyalty_settings LIMIT 1;

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
    'settings', to_jsonb(s) - 'id' - 'updated_at'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_daily_checkin()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  acc public.loyalty_accounts;
  s public.loyalty_settings;
  new_streak INTEGER;
  bonus INTEGER := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;
  PERFORM public.loyalty_ensure_account(uid);
  SELECT * INTO acc FROM public.loyalty_accounts WHERE user_id = uid FOR UPDATE;
  IF acc.last_checkin_date = current_date THEN
    RETURN jsonb_build_object('awarded', false, 'streak', acc.checkin_streak);
  END IF;

  SELECT * INTO s FROM public.loyalty_settings LIMIT 1;
  new_streak := CASE WHEN acc.last_checkin_date = current_date - 1 THEN acc.checkin_streak + 1 ELSE 1 END;

  INSERT INTO public.loyalty_transactions (user_id, kind, points, description, reference_id)
  VALUES (uid, 'checkin', s.daily_checkin_points, 'Visite du jour', current_date::TEXT)
  ON CONFLICT DO NOTHING;

  IF s.streak_days > 0 AND new_streak % s.streak_days = 0 THEN
    bonus := s.streak_bonus_points;
    INSERT INTO public.loyalty_transactions (user_id, kind, points, description, reference_id)
    VALUES (uid, 'streak', bonus, format('Série de %s jours', new_streak), current_date::TEXT)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.loyalty_accounts
  SET last_checkin_date = current_date, checkin_streak = new_streak
  WHERE user_id = uid;

  RETURN jsonb_build_object('awarded', true, 'points', s.daily_checkin_points, 'bonus', bonus, 'streak', new_streak);
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_apply_referral(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  acc public.loyalty_accounts;
  referrer UUID;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;
  PERFORM public.loyalty_ensure_account(uid);
  SELECT * INTO acc FROM public.loyalty_accounts WHERE user_id = uid FOR UPDATE;

  IF acc.referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already');
  END IF;
  -- Réservé aux nouveaux clients : compte récent et aucun achat encore
  IF (SELECT created_at FROM auth.users WHERE id = uid) < now() - interval '30 days'
     OR EXISTS (SELECT 1 FROM public.loyalty_transactions WHERE user_id = uid AND kind = 'purchase') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_new');
  END IF;

  SELECT user_id INTO referrer FROM public.loyalty_accounts WHERE referral_code = upper(trim(p_code));
  IF referrer IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unknown');
  END IF;
  IF referrer = uid THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self');
  END IF;

  UPDATE public.loyalty_accounts SET referred_by = referrer WHERE user_id = uid;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ---------------------------------------------------------------------
-- Droits : par défaut Supabase autorise anon/authenticated à exécuter les
-- fonctions du schéma public ; on restreint explicitement.
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.loyalty_ensure_account(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_balance(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_lifetime(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_award_purchase(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_reserve_redemption(UUID, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_release_redemption(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_confirm_redemption(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_release_stale_redemptions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_on_payment_status() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.loyalty_reserve_redemption(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.loyalty_release_redemption(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.loyalty_release_stale_redemptions() TO service_role;

REVOKE ALL ON FUNCTION public.loyalty_get_summary() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.loyalty_daily_checkin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.loyalty_apply_referral(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loyalty_get_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_daily_checkin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_apply_referral(TEXT) TO authenticated;

-- ---------------------------------------------------------------------
-- Tâche planifiée : rendre les Smiles des paiements abandonnés
-- ---------------------------------------------------------------------
DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id FROM cron.job WHERE jobname = 'loyalty-release-stale-redemptions';
  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
  PERFORM cron.schedule(
    'loyalty-release-stale-redemptions',
    '35 * * * *',
    'SELECT public.loyalty_release_stale_redemptions();'
  );
END;
$$;
