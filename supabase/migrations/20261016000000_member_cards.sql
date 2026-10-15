-- Cartes de membre électroniques des abonnés.
-- 1. Chaque client reçoit un code membre aléatoire (profiles.member_code),
--    encodé dans le QR code de sa carte. Ce n'est pas son identifiant
--    interne : il peut être régénéré si une carte est compromise.
-- 2. verify_member_card() permet à n'importe qui (personnel, partenaire)
--    de vérifier une carte en scannant le QR, sans connexion. Elle ne
--    renvoie que le prénom + l'initiale du nom, la formule et la validité.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS member_code UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS profiles_member_code_key ON public.profiles (member_code);

CREATE OR REPLACE FUNCTION public.verify_member_card(p_code UUID)
RETURNS TABLE (
  holder_name TEXT,
  plan_id TEXT,
  plan_name TEXT,
  valid_until TIMESTAMPTZ,
  is_valid BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    trim(
      split_part(coalesce(p.full_name, ''), ' ', 1) || ' ' ||
      CASE
        WHEN split_part(coalesce(p.full_name, ''), ' ', 2) <> ''
          THEN upper(left(split_part(p.full_name, ' ', 2), 1)) || '.'
        ELSE ''
      END
    ) AS holder_name,
    s.plan_id,
    s.plan_name,
    s.end_date AS valid_until,
    coalesce(s.status = 'active' AND s.end_date > now(), false) AS is_valid
  FROM public.profiles p
  LEFT JOIN LATERAL (
    -- Abonnement actif qui court le plus loin, sinon le dernier terminé
    SELECT us.plan_id, coalesce(us.plan_name, us.plan_id) AS plan_name, us.end_date, us.status
    FROM public.user_subscriptions us
    WHERE us.user_id = p.id
      AND us.status IN ('active', 'expired', 'cancelled')
    ORDER BY (us.status = 'active') DESC, us.end_date DESC NULLS LAST
    LIMIT 1
  ) s ON true
  WHERE p.member_code = p_code;
$$;

REVOKE ALL ON FUNCTION public.verify_member_card(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_member_card(UUID) TO anon, authenticated;
