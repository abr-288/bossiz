-- =====================================================================
-- Smiles Bossiz+ : expiration des Smiles inutilisés et administration.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Expiration
-- Chaque Smile expire points_validity_months mois après avoir été gagné
-- (0 = jamais). Les utilisations consomment toujours les Smiles les plus
-- anciens d'abord : un client qui utilise régulièrement ses Smiles ne
-- perd donc rien.
-- ---------------------------------------------------------------------
ALTER TABLE public.loyalty_settings
  ADD COLUMN IF NOT EXISTS points_validity_months INTEGER NOT NULL DEFAULT 12
  CHECK (points_validity_months >= 0);

ALTER TABLE public.loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_kind_check;
ALTER TABLE public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_kind_check
  CHECK (kind IN ('purchase', 'referral', 'referral_welcome', 'checkin', 'streak', 'redeem', 'adjustment', 'expiry'));

-- Auteur d'un ajustement manuel (admin)
ALTER TABLE public.loyalty_transactions
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Smiles gagnés avant p_cutoff et pas encore consommés (utilisations,
-- retraits, expirations précédentes), en consommant les plus anciens d'abord.
CREATE OR REPLACE FUNCTION public.loyalty_expirable(p_user UUID, p_cutoff TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT greatest(
    0,
    coalesce(sum(points) FILTER (WHERE points > 0 AND status = 'posted' AND created_at < p_cutoff), 0)
    + coalesce(sum(points) FILTER (WHERE points < 0 AND status IN ('posted', 'pending')), 0)
  )::INTEGER
  FROM public.loyalty_transactions
  WHERE user_id = p_user;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_expire_points()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  s public.loyalty_settings;
  cutoff TIMESTAMPTZ;
  member RECORD;
  amount INTEGER;
  total INTEGER := 0;
BEGIN
  SELECT * INTO s FROM public.loyalty_settings LIMIT 1;
  IF s.points_validity_months <= 0 THEN
    RETURN 0;
  END IF;
  cutoff := now() - make_interval(months => s.points_validity_months);

  FOR member IN
    SELECT DISTINCT t.user_id
    FROM public.loyalty_transactions t
    WHERE t.points > 0 AND t.status = 'posted' AND t.created_at < cutoff
  LOOP
    PERFORM 1 FROM public.loyalty_accounts WHERE user_id = member.user_id FOR UPDATE;
    amount := public.loyalty_expirable(member.user_id, cutoff);
    IF amount > 0 THEN
      INSERT INTO public.loyalty_transactions (user_id, kind, points, description, reference_id)
      VALUES (member.user_id, 'expiry', -amount,
              format('Smiles gagnés il y a plus de %s mois', s.points_validity_months),
              'expiry-' || current_date::TEXT)
      ON CONFLICT DO NOTHING;
      total := total + amount;
    END IF;
  END LOOP;
  RETURN total;
END;
$$;

-- Résumé client : ajoute les Smiles qui vont expirer dans les 30 jours
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

  IF s.points_validity_months > 0 THEN
    expiring := public.loyalty_expirable(
      uid,
      now() - make_interval(months => s.points_validity_months) + interval '30 days'
    );
  END IF;

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
-- 2. Administration (fonctions réservées aux admins)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.loyalty_require_admin()
RETURNS VOID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.loyalty_require_admin();
  RETURN jsonb_build_object(
    'members', (SELECT count(*) FROM public.loyalty_accounts),
    'outstanding', (SELECT coalesce(sum(points), 0) FROM public.loyalty_transactions WHERE status IN ('posted', 'pending')),
    'earned_30d', (SELECT coalesce(sum(points), 0) FROM public.loyalty_transactions
                   WHERE points > 0 AND status = 'posted' AND created_at > now() - interval '30 days'),
    'used_30d', (SELECT coalesce(-sum(points), 0) FROM public.loyalty_transactions
                 WHERE kind = 'redeem' AND status = 'posted' AND created_at > now() - interval '30 days'),
    'expired_30d', (SELECT coalesce(-sum(points), 0) FROM public.loyalty_transactions
                    WHERE kind = 'expiry' AND created_at > now() - interval '30 days'),
    'referrals', (SELECT count(*) FROM public.loyalty_accounts WHERE referral_rewarded)
  );
END;
$$;

-- Recherche de clients (nom, email ou code de parrainage), y compris ceux
-- qui n'ont pas encore de compte Smiles ; sans recherche : meilleurs soldes.
CREATE OR REPLACE FUNCTION public.loyalty_admin_members(p_search TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  referral_code TEXT,
  balance INTEGER,
  lifetime INTEGER,
  last_activity TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  pattern TEXT := '%' || coalesce(trim(p_search), '') || '%';
BEGIN
  PERFORM public.loyalty_require_admin();
  RETURN QUERY
  SELECT
    u.id,
    p.full_name,
    u.email::TEXT,
    a.referral_code,
    public.loyalty_balance(u.id),
    public.loyalty_lifetime(u.id),
    (SELECT max(t.created_at) FROM public.loyalty_transactions t WHERE t.user_id = u.id)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.loyalty_accounts a ON a.user_id = u.id
  WHERE coalesce(trim(p_search), '') = ''
     OR p.full_name ILIKE pattern
     OR u.email ILIKE pattern
     OR a.referral_code ILIKE pattern
  ORDER BY 5 DESC, u.created_at DESC
  LIMIT least(greatest(coalesce(p_limit, 50), 1), 200);
END;
$$;

-- Ajouter (points > 0) ou retirer (points < 0) des Smiles, motif obligatoire
CREATE OR REPLACE FUNCTION public.loyalty_admin_adjust(p_user UUID, p_points INTEGER, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  PERFORM public.loyalty_require_admin();
  IF p_points IS NULL OR p_points = 0 THEN
    RAISE EXCEPTION 'Indiquez un nombre de Smiles différent de zéro';
  END IF;
  IF coalesce(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Le motif est obligatoire';
  END IF;

  PERFORM public.loyalty_ensure_account(p_user);
  PERFORM 1 FROM public.loyalty_accounts WHERE user_id = p_user FOR UPDATE;
  current_balance := public.loyalty_balance(p_user);
  IF p_points < 0 AND current_balance + p_points < 0 THEN
    RAISE EXCEPTION 'Solde insuffisant : ce client a % Smiles', current_balance;
  END IF;

  INSERT INTO public.loyalty_transactions (user_id, kind, points, description, created_by)
  VALUES (p_user, 'adjustment', p_points, left(trim(p_reason), 200), auth.uid());

  RETURN jsonb_build_object('balance', current_balance + p_points);
END;
$$;

-- Les admins peuvent ajuster les niveaux (seuils, multiplicateurs)
DROP POLICY IF EXISTS "Admins manage loyalty tiers" ON public.loyalty_tiers;
CREATE POLICY "Admins manage loyalty tiers" ON public.loyalty_tiers FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- Droits
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.loyalty_expirable(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_expire_points() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_expire_points() TO service_role;

REVOKE ALL ON FUNCTION public.loyalty_require_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.loyalty_admin_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.loyalty_admin_members(TEXT, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.loyalty_admin_adjust(UUID, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loyalty_require_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_admin_members(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_admin_adjust(UUID, INTEGER, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.loyalty_get_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loyalty_get_summary() TO authenticated;

-- Expiration quotidienne (3 h 20 UTC)
DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id FROM cron.job WHERE jobname = 'loyalty-expire-points';
  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
  PERFORM cron.schedule('loyalty-expire-points', '20 3 * * *', 'SELECT public.loyalty_expire_points();');
END;
$$;
