-- Tableau de bord super admin : combien d'utilisateurs, de partenaires,
-- d'abonnés, de membres Bossiz Impact, d'offres en ligne…
--
-- admin_dashboard ne renvoie que des chiffres financiers. Cette fonction
-- donne les effectifs de la plateforme : les totaux sont « à date », les
-- nouveaux sont comptés sur la période choisie et comparés à la période
-- précédente de même durée (comme admin_dashboard).

CREATE OR REPLACE FUNCTION public.admin_platform_counts(p_from DATE, p_to DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from TIMESTAMPTZ;
  v_to TIMESTAMPTZ;
  v_prev_from TIMESTAMPTZ;
  v_users JSONB;
  v_partners JSONB;
  v_by_category JSONB;
  v_subscribers JSONB;
  v_impact JSONB;
  v_catalog JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_to < p_from THEN
    RAISE EXCEPTION 'Période invalide' USING ERRCODE = '22023';
  END IF;
  IF p_to - p_from > 3660 THEN
    RAISE EXCEPTION 'Période trop longue (10 ans maximum)' USING ERRCODE = '22023';
  END IF;

  -- Bornes en heure d'Abidjan (UTC), fin de période incluse.
  v_from := p_from::timestamptz;
  v_to := (p_to + 1)::timestamptz;
  v_prev_from := (p_from - (p_to - p_from + 1))::timestamptz;

  -- Comptes utilisateurs (comptes supprimés exclus). Un partenaire est le
  -- propriétaire d'au moins un établissement ; un client est tout autre compte
  -- qui n'est pas administrateur.
  WITH accounts AS (
    SELECT u.id, u.created_at, u.last_sign_in_at,
           EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin') AS is_admin,
           EXISTS (SELECT 1 FROM public.agencies a WHERE a.owner_id = u.id) AS is_partner
    FROM auth.users u
    WHERE u.deleted_at IS NULL
  )
  SELECT jsonb_build_object(
    'total', count(*),
    'clients', count(*) FILTER (WHERE NOT is_admin AND NOT is_partner),
    'partner_accounts', count(*) FILTER (WHERE is_partner),
    'admins', count(*) FILTER (WHERE is_admin),
    'active_30d', count(*) FILTER (WHERE last_sign_in_at >= now() - interval '30 days'),
    'new', count(*) FILTER (WHERE created_at >= v_from AND created_at < v_to),
    'prev_new', count(*) FILTER (WHERE created_at >= v_prev_from AND created_at < v_from)
  )
    INTO v_users
  FROM accounts;

  -- Partenaires (établissements).
  SELECT jsonb_build_object(
    'total', count(*),
    'active', count(*) FILTER (WHERE COALESCE(a.is_active, false)),
    'visible', count(*) FILTER (WHERE COALESCE(a.is_active, false) AND COALESCE(a.is_visible, false)),
    'inactive', count(*) FILTER (WHERE NOT COALESCE(a.is_active, false)),
    'new', count(*) FILTER (WHERE a.created_at >= v_from AND a.created_at < v_to),
    'prev_new', count(*) FILTER (WHERE a.created_at >= v_prev_from AND a.created_at < v_from),
    'pending_applications', (SELECT count(*) FROM public.partner_applications WHERE status = 'pending')
  )
    INTO v_partners
  FROM public.agencies a;

  -- Répartition par catégorie, y compris les catégories encore vides.
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'key', x.key, 'label', x.label, 'total', x.total, 'active', x.active
         ) ORDER BY x.sort_order >= 10000, x.total DESC, x.sort_order, x.label), '[]'::jsonb)
    INTO v_by_category
  FROM (
    SELECT c.key, c.label, c.sort_order,
           count(a.id) AS total,
           count(a.id) FILTER (WHERE COALESCE(a.is_active, false)) AS active
    FROM public.partner_categories c
    LEFT JOIN public.agencies a ON a.category = c.key
    GROUP BY c.key, c.label, c.sort_order
    UNION ALL
    -- Une seule ligne pour les établissements sans catégorie connue.
    SELECT '', 'Sans catégorie', 10000,
           count(*), count(*) FILTER (WHERE COALESCE(a.is_active, false))
    FROM public.agencies a
    WHERE a.category IS NULL OR NOT EXISTS (SELECT 1 FROM public.partner_categories c WHERE c.key = a.category)
    HAVING count(*) > 0
  ) x;

  -- Abonnés : abonnements en cours (actifs ou en essai, non échus), un
  -- utilisateur compté une seule fois.
  SELECT jsonb_build_object(
    'active', count(DISTINCT s.user_id) FILTER (
      WHERE s.status IN ('active', 'trial') AND (s.end_date IS NULL OR s.end_date >= now())),
    'new', count(DISTINCT s.user_id) FILTER (
      WHERE s.status IN ('active', 'trial', 'expired', 'cancelled')
        AND s.start_date >= v_from AND s.start_date < v_to),
    'prev_new', count(DISTINCT s.user_id) FILTER (
      WHERE s.status IN ('active', 'trial', 'expired', 'cancelled')
        AND s.start_date >= v_prev_from AND s.start_date < v_from)
  )
    INTO v_subscribers
  FROM public.user_subscriptions s;

  -- Membres Bossiz Impact : ceux qui ont déjà contribué.
  SELECT jsonb_build_object(
    'total', count(*) FILTER (WHERE m.first_contribution_at IS NOT NULL),
    'new', count(*) FILTER (WHERE m.first_contribution_at >= v_from AND m.first_contribution_at < v_to),
    'prev_new', count(*) FILTER (WHERE m.first_contribution_at >= v_prev_from AND m.first_contribution_at < v_from)
  )
    INTO v_impact
  FROM public.impact_members m;

  -- Catalogue et audience.
  SELECT jsonb_build_object(
    'services_online', (SELECT count(*) FROM public.services s
                         LEFT JOIN public.agencies a ON a.id = s.agency_id
                         WHERE COALESCE(s.available, false)
                           AND (s.agency_id IS NULL OR COALESCE(a.is_active, false))),
    'services_total', (SELECT count(*) FROM public.services),
    'companies', (SELECT count(*) FROM public.companies WHERE is_active),
    'newsletter', (SELECT count(*) FROM public.newsletter_subscribers)
  )
    INTO v_catalog;

  RETURN jsonb_build_object(
    'users', v_users,
    'partners', v_partners || jsonb_build_object('by_category', v_by_category),
    'subscribers', v_subscribers,
    'impact_members', v_impact,
    'catalog', v_catalog
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_platform_counts(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_platform_counts(DATE, DATE) TO authenticated;
