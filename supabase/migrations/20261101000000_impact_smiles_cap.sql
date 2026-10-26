-- Bossiz Impact : les Smiles Impact peuvent couvrir jusqu'à 50 % d'un
-- paiement (loyalty_settings.impact_max_redeem_ratio), contre 10 % pour les
-- Smiles fidélité (max_redeem_ratio, inchangé).
--
-- Sur un paiement, tous les Smiles partagent la part générale (10 %) ; au-delà
-- et jusqu'à 50 %, seuls des Smiles Impact encore disponibles pour ce paiement
-- peuvent être utilisés (sur un billet d'avion : uniquement ceux d'une
-- contribution qui y donne droit). Le maximum est calculé par
-- loyalty_max_redeemable, utilisé par process-payment et, pour l'affichage,
-- par loyalty_redeem_quote.
--
-- Non destructive et rejouable.

ALTER TABLE public.loyalty_settings ADD COLUMN IF NOT EXISTS impact_max_redeem_ratio NUMERIC NOT NULL DEFAULT 0.50;
ALTER TABLE public.loyalty_settings DROP CONSTRAINT IF EXISTS loyalty_settings_impact_max_redeem_ratio_check;
ALTER TABLE public.loyalty_settings ADD CONSTRAINT loyalty_settings_impact_max_redeem_ratio_check
  CHECK (impact_max_redeem_ratio >= 0 AND impact_max_redeem_ratio <= 1);
COMMENT ON COLUMN public.loyalty_settings.impact_max_redeem_ratio IS
  'Part maximale d''un paiement couverte par des Smiles quand le membre a des Smiles Bossiz Impact';

-- Smiles Impact encore disponibles (non expirés, contributions payées), les
-- dépenses consommant d'abord les Smiles Impact. p_flight : uniquement ceux
-- utilisables sur un billet d'avion.
CREATE OR REPLACE FUNCTION public.loyalty_impact_available(p_user UUID, p_flight BOOLEAN)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH awarded AS (
    SELECT t.points, t.created_at
    FROM public.loyalty_transactions t
    JOIN public.impact_contributions ic ON t.reference_id = 'impact:' || ic.id::TEXT
    WHERE t.user_id = p_user
      AND t.kind = 'impact'
      AND t.status = 'posted'
      AND ic.status = 'paid'
      AND (t.expires_at IS NULL OR t.expires_at > now())
  ),
  spent AS (
    SELECT coalesce(-sum(t.points), 0) AS points
    FROM public.loyalty_transactions t
    WHERE t.user_id = p_user
      AND t.kind = 'redeem'
      AND t.status IN ('posted', 'pending')
      AND t.created_at >= (SELECT min(a.created_at) FROM awarded a)
  ),
  remaining AS (
    SELECT least(
      greatest(public.loyalty_balance(p_user), 0),
      greatest(0, (SELECT coalesce(sum(a.points), 0) FROM awarded a) - (SELECT sp.points FROM spent sp))
    ) AS points
  )
  SELECT greatest(
    0,
    (SELECT points FROM remaining)
      - CASE WHEN p_flight THEN public.loyalty_impact_flight_locked(p_user) ELSE 0 END
  )::INTEGER;
$$;
REVOKE ALL ON FUNCTION public.loyalty_impact_available(UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_impact_available(UUID, BOOLEAN) TO service_role;

-- Nombre maximal de Smiles utilisables sur un paiement de p_amount_xof
-- (réservation p_booking_id, ou NULL pour un abonnement). 0 si moins que le
-- minimum d'utilisation.
CREATE OR REPLACE FUNCTION public.loyalty_max_redeemable(p_user UUID, p_amount_xof NUMERIC, p_booking_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.loyalty_settings;
  v_flight BOOLEAN := false;
  v_usable INTEGER;
  v_base INTEGER;
  v_impact_cap INTEGER;
  v_cap INTEGER;
  v_max INTEGER;
BEGIN
  SELECT * INTO s FROM public.loyalty_settings LIMIT 1;
  IF s.point_value_xof IS NULL OR s.point_value_xof <= 0 OR p_amount_xof IS NULL OR p_amount_xof <= 100 THEN
    RETURN 0;
  END IF;

  IF p_booking_id IS NOT NULL THEN
    SELECT coalesce(sv.type::TEXT IN ('flight', 'flight_hotel'), false)
      INTO v_flight
      FROM public.bookings b
      LEFT JOIN public.services sv ON sv.id = b.service_id
      WHERE b.id = p_booking_id;
    v_flight := coalesce(v_flight, false);
  END IF;

  v_usable := greatest(public.loyalty_balance(p_user), 0)
    - CASE WHEN v_flight THEN public.loyalty_impact_flight_locked(p_user) ELSE 0 END;
  v_base := floor(p_amount_xof * s.max_redeem_ratio / s.point_value_xof);
  v_impact_cap := floor(p_amount_xof * greatest(s.impact_max_redeem_ratio, s.max_redeem_ratio) / s.point_value_xof);
  -- Part générale pour tous les Smiles, complétée jusqu'au plafond Impact
  -- par les seuls Smiles Impact disponibles pour ce paiement.
  v_cap := greatest(v_base, least(v_impact_cap, v_base + public.loyalty_impact_available(p_user, v_flight)));
  -- Au moins 100 XOF restent à payer (minimum Jèko).
  v_max := least(v_usable, v_cap, floor((p_amount_xof - 100) / s.point_value_xof)::INTEGER);
  RETURN CASE WHEN v_max >= s.min_redeem_points THEN v_max ELSE 0 END;
END;
$$;
REVOKE ALL ON FUNCTION public.loyalty_max_redeemable(UUID, NUMERIC, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_max_redeemable(UUID, NUMERIC, UUID) TO service_role;

-- Même calcul pour l'écran de paiement du client connecté. La réservation
-- n'est prise en compte que si elle lui appartient (sinon : règle générale ;
-- process-payment revérifie de toute façon).
CREATE OR REPLACE FUNCTION public.loyalty_redeem_quote(p_amount_xof NUMERIC, p_booking_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  v_booking UUID;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;
  SELECT b.id INTO v_booking FROM public.bookings b WHERE b.id = p_booking_id AND b.user_id = uid;
  RETURN jsonb_build_object(
    'max_points', public.loyalty_max_redeemable(uid, p_amount_xof, v_booking),
    'impact_points', public.loyalty_impact_available(uid, false)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.loyalty_redeem_quote(NUMERIC, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loyalty_redeem_quote(NUMERIC, UUID) TO authenticated;

-- Textes de la campagne : la règle des 10 % devient 50 % pour les Smiles
-- Impact. Remplacement ciblé (le reste des textes saisis dans l'admin est
-- conservé) ; nouvelle version des conditions si elles changent.
UPDATE public.impact_campaigns
SET terms = replace(
      terms,
      'dans la limite fixée par le programme Bossiz Smiles (10 % du montant de chaque paiement à ce jour)',
      'dans la limite de 50 % du montant de chaque paiement pour les Smiles Bossiz Impact'
    ),
    terms_version = '2',
    updated_at = now()
WHERE terms LIKE '%dans la limite fixée par le programme Bossiz Smiles (10 % du montant de chaque paiement à ce jour)%';

UPDATE public.impact_campaigns c
SET faq = (
      SELECT jsonb_agg(
        CASE WHEN f ->> 'answer' LIKE '%les Smiles couvrent au plus 10 % du montant.%'
          THEN jsonb_set(f, '{answer}', to_jsonb(replace(
            f ->> 'answer',
            'À chaque paiement, les Smiles couvrent au plus 10 % du montant.',
            'À chaque paiement, vos Smiles Impact peuvent couvrir jusqu''à 50 % du montant.'
          )))
          ELSE f
        END ORDER BY ord)
      FROM jsonb_array_elements(c.faq) WITH ORDINALITY AS x(f, ord)
    ),
    updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(c.faq) f
  WHERE f ->> 'answer' LIKE '%les Smiles couvrent au plus 10 % du montant.%'
);
