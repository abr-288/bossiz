-- Tableau de bord admin et page Commissions.
--
-- 1. finance_transactions_internal : le calcul ligne à ligne de
--    agency_finance_transactions (20261025000000), pour un partenaire ou pour
--    tous. La rubrique Finances du partenaire et la page Commissions de
--    l'admin lisent ainsi exactement les mêmes lignes et les mêmes montants.
-- 2. admin_finance_transactions : toutes les lignes, avec le partenaire.
-- 3. admin_dashboard : activités, gains Bossiz, comparaison avec la période
--    précédente, évolution et tâches à traiter.
--
-- Non destructive et rejouable : aucune table modifiée, fonctions remplacées.

CREATE OR REPLACE FUNCTION public.finance_transactions_internal(
  p_agency_id UUID,
  p_all BOOLEAN,
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
)
RETURNS TABLE (
  transaction_id TEXT,
  transaction_date TIMESTAMPTZ,
  agency_id UUID,
  source_type TEXT,
  booking_id UUID,
  source_id UUID,
  reference TEXT,
  label TEXT,
  collection TEXT,
  gross_amount NUMERIC,
  commission_rate NUMERIC,
  commission_amount NUMERIC,
  net_amount NUMERIC,
  status TEXT,
  payout_status TEXT,
  payout_due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payout_reference TEXT,
  rate_effective_from TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH online AS (
    SELECT
      'commission:' || c.id AS transaction_id,
      c.created_at AS transaction_date,
      c.agency_id,
      COALESCE(NULLIF(c.source_type, ''), 'booking') AS source_type,
      c.booking_id,
      c.source_id,
      upper(left(COALESCE(c.booking_id, c.source_id)::text, 8)) AS reference,
      COALESCE(s.name, r.name, wb.treatment_name, ao.product_name, 'Prestation') AS label,
      'online'::text AS collection,
      c.booking_amount AS gross_amount,
      100 - c.commission_rate AS commission_rate,
      c.booking_amount - c.commission_amount AS commission_amount,
      c.commission_amount AS net_amount,
      c.status,
      c.payout_status,
      c.payout_due_at,
      c.paid_at,
      c.payout_reference,
      (SELECT max(cr.effective_from) FROM public.agency_commission_rates cr
        WHERE cr.agency_id = c.agency_id AND cr.effective_from <= c.created_at) AS rate_effective_from
    FROM public.commissions c
    LEFT JOIN public.bookings b ON b.id = c.booking_id
    LEFT JOIN public.services s ON s.id = b.service_id
    LEFT JOIN public.restaurant_reservations rr ON c.source_type = 'restaurant_reservation' AND rr.id = c.source_id
    LEFT JOIN public.restaurants r ON r.id = rr.restaurant_id
    LEFT JOIN public.wellness_bookings wb ON c.source_type = 'wellness_booking' AND wb.id = c.source_id
    LEFT JOIN public.artisan_orders ao ON c.source_type = 'artisan_order' AND ao.id = c.source_id
    WHERE p_all OR c.agency_id = p_agency_id
  ),
  onsite AS (
    SELECT
      'onsite:' || b.id AS transaction_id,
      b.end_date::timestamptz AS transaction_date,
      s.agency_id,
      'hotel_on_site'::text AS source_type,
      b.id AS booking_id,
      NULL::uuid AS source_id,
      upper(left(b.id::text, 8)) AS reference,
      s.name AS label,
      'on_site'::text AS collection,
      b.total_price AS gross_amount,
      rate.platform_rate AS commission_rate,
      round(b.total_price * rate.platform_rate / 100) AS commission_amount,
      b.total_price - round(b.total_price * rate.platform_rate / 100) AS net_amount,
      -- 'to_invoice' (pas encore facturé), 'issued' (facturé, à régler), 'paid'.
      COALESCE(inv.status, 'to_invoice') AS status,
      NULL::text AS payout_status,
      inv.due_at::timestamptz AS payout_due_at,
      inv.paid_at,
      NULL::text AS payout_reference,
      (SELECT max(cr.effective_from) FROM public.agency_commission_rates cr
        WHERE cr.agency_id = s.agency_id AND cr.effective_from <= b.created_at) AS rate_effective_from
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    CROSS JOIN LATERAL (SELECT public.agency_platform_rate_at(s.agency_id, b.created_at) AS platform_rate) rate
    LEFT JOIN LATERAL (
      SELECT i.status, i.due_at, i.paid_at
      FROM public.hotel_onsite_commission_invoices i
      WHERE i.agency_id = s.agency_id AND b.id = ANY(i.booking_ids) AND i.status <> 'cancelled'
      ORDER BY i.created_at DESC
      LIMIT 1
    ) inv ON true
    WHERE (p_all OR s.agency_id = p_agency_id)
      AND s.agency_id IS NOT NULL
      AND b.booking_details->>'kind' = 'partner_hotel'
      AND COALESCE((b.booking_details->>'payAtProperty')::boolean, false)
      AND NOT COALESCE((b.booking_details->>'noShow')::boolean, false)
      AND b.status IN ('confirmed', 'completed')
      AND b.payment_status::text <> 'refunded'
      AND b.end_date <= current_date
  )
  SELECT * FROM (
    SELECT * FROM online
    UNION ALL
    SELECT * FROM onsite
  ) t
  WHERE (p_from IS NULL OR t.transaction_date >= p_from::timestamptz)
    AND (p_to IS NULL OR t.transaction_date < (p_to + 1)::timestamptz)
  ORDER BY t.transaction_date DESC;
$$;

REVOKE ALL ON FUNCTION public.finance_transactions_internal(UUID, BOOLEAN, DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finance_transactions_internal(UUID, BOOLEAN, DATE, DATE) TO service_role;

-- Même signature et mêmes colonnes qu'avant : seul le calcul est mutualisé.
-- Un compte sans partenaire (agence NULL) ne voit toujours rien.
CREATE OR REPLACE FUNCTION public.agency_finance_transactions(p_from DATE DEFAULT NULL, p_to DATE DEFAULT NULL)
RETURNS TABLE (
  transaction_id TEXT,
  transaction_date TIMESTAMPTZ,
  source_type TEXT,
  reference TEXT,
  label TEXT,
  collection TEXT,
  gross_amount NUMERIC,
  commission_rate NUMERIC,
  commission_amount NUMERIC,
  net_amount NUMERIC,
  status TEXT,
  payout_status TEXT,
  payout_due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payout_reference TEXT,
  rate_effective_from TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.transaction_id, t.transaction_date, t.source_type, t.reference, t.label, t.collection,
         t.gross_amount, t.commission_rate, t.commission_amount, t.net_amount, t.status,
         t.payout_status, t.payout_due_at, t.paid_at, t.payout_reference, t.rate_effective_from
  FROM public.finance_transactions_internal(public.current_partner_agency_id(), false, p_from, p_to) t;
$$;

REVOKE ALL ON FUNCTION public.agency_finance_transactions(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agency_finance_transactions(DATE, DATE) TO authenticated;

-- ---------------------------------------------------------------------------
-- Page Commissions : toutes les lignes, avec le nom du partenaire.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_finance_transactions(p_from DATE DEFAULT NULL, p_to DATE DEFAULT NULL)
RETURNS TABLE (
  transaction_id TEXT,
  transaction_date TIMESTAMPTZ,
  agency_id UUID,
  agency_name TEXT,
  source_type TEXT,
  booking_id UUID,
  source_id UUID,
  reference TEXT,
  label TEXT,
  collection TEXT,
  gross_amount NUMERIC,
  commission_rate NUMERIC,
  commission_amount NUMERIC,
  net_amount NUMERIC,
  status TEXT,
  payout_status TEXT,
  payout_due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payout_reference TEXT,
  payout_error TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT t.transaction_id, t.transaction_date, t.agency_id, a.name::text, t.source_type, t.booking_id,
         t.source_id, t.reference, t.label, t.collection, t.gross_amount, t.commission_rate,
         t.commission_amount, t.net_amount, t.status, t.payout_status, t.payout_due_at, t.paid_at,
         t.payout_reference, c.payout_error
  FROM public.finance_transactions_internal(NULL, true, p_from, p_to) t
  LEFT JOIN public.agencies a ON a.id = t.agency_id
  LEFT JOIN public.commissions c
    ON c.id = CASE WHEN t.collection = 'online' THEN substr(t.transaction_id, 12)::uuid END
  ORDER BY t.transaction_date DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_finance_transactions(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_finance_transactions(DATE, DATE) TO authenticated;

-- ---------------------------------------------------------------------------
-- Tableau de bord : une ligne par fait (commande, commission, abonnement,
-- contribution), rattachée à une activité et à une date.
--   orders  : commandes validées (confirmées, terminées ou payées)
--   pending : demandes en attente
--   volume  : valeur des commandes validées (restaurants : estimation
--             ticket moyen x couverts)
--   gain    : ce que Bossiz gagne (commission partenaire, marge sur les
--             réservations sans partenaire, abonnements)
-- Les contributions Bossiz Impact sont comptées à part : ce sont des fonds
-- collectés, pas un revenu.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_dashboard_lines(p_from DATE, p_to DATE)
RETURNS TABLE (activity TEXT, at TIMESTAMPTZ, orders INT, pending INT, volume NUMERIC, gain NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH booking_lines AS (
    SELECT
      CASE
        WHEN s.type::text IN ('tour', 'activity') THEN 'activity'
        WHEN s.type::text IS NULL THEN 'other'
        ELSE s.type::text
      END AS activity,
      b.created_at AS at,
      (b.status::text <> 'cancelled' AND b.payment_status::text <> 'refunded'
        AND (b.status::text IN ('confirmed', 'completed') OR b.payment_status::text IN ('paid', 'partially_paid'))) AS valid,
      (b.status::text = 'pending' AND b.payment_status::text NOT IN ('paid', 'partially_paid', 'refunded')) AS waiting,
      b.total_price,
      b.supplier_cost,
      b.id
    FROM public.bookings b
    LEFT JOIN public.services s ON s.id = b.service_id
  )
  SELECT bl.activity, bl.at, bl.valid::int, bl.waiting::int,
         CASE WHEN bl.valid THEN bl.total_price ELSE 0 END,
         -- Marge connue uniquement sans partenaire : avec un partenaire, le
         -- gain est sa commission (comptée plus bas), pas une marge.
         CASE WHEN bl.valid AND bl.supplier_cost IS NOT NULL
                   AND NOT EXISTS (SELECT 1 FROM public.commissions c WHERE c.booking_id = bl.id)
              THEN bl.total_price - bl.supplier_cost ELSE 0 END
  FROM booking_lines bl

  UNION ALL
  SELECT 'restaurant', rr.created_at,
         (rr.status IN ('confirmed', 'completed'))::int, 0,
         CASE WHEN rr.status IN ('confirmed', 'completed') THEN COALESCE(r.average_ticket_price * rr.party_size, 0) ELSE 0 END,
         0
  FROM public.restaurant_reservations rr
  LEFT JOIN public.restaurants r ON r.id = rr.restaurant_id

  UNION ALL
  SELECT 'wellness', wb.created_at,
         (wb.status IN ('confirmed', 'completed'))::int, 0,
         CASE WHEN wb.status IN ('confirmed', 'completed') THEN COALESCE(wb.treatment_price * wb.party_size, 0) ELSE 0 END,
         0
  FROM public.wellness_bookings wb

  UNION ALL
  SELECT 'artisan', ao.created_at,
         (ao.status IN ('confirmed', 'completed'))::int, (ao.status = 'pending')::int,
         CASE WHEN ao.status IN ('confirmed', 'completed') THEN COALESCE(ao.total_amount, 0) ELSE 0 END,
         0
  FROM public.artisan_orders ao

  UNION ALL
  -- Commissions (en ligne et sur place), rattachées à l'activité vendue.
  SELECT
    CASE t.source_type
      WHEN 'restaurant_reservation' THEN 'restaurant'
      WHEN 'wellness_booking' THEN 'wellness'
      WHEN 'artisan_order' THEN 'artisan'
      WHEN 'hotel_on_site' THEN 'hotel'
      ELSE CASE
        WHEN s.type::text IN ('tour', 'activity') THEN 'activity'
        WHEN s.type::text IS NULL THEN 'other'
        ELSE s.type::text
      END
    END,
    t.transaction_date, 0, 0, 0, t.commission_amount
  FROM public.finance_transactions_internal(NULL, true, p_from, p_to) t
  LEFT JOIN public.bookings b ON b.id = t.booking_id
  LEFT JOIN public.services s ON s.id = b.service_id
  WHERE t.status <> 'cancelled'

  UNION ALL
  SELECT 'subscription', p.created_at, 1, 0, p.amount, p.amount
  FROM public.payments p
  WHERE p.status = 'completed'
    AND (p.subscription_id IS NOT NULL OR p.car_partner_subscription_id IS NOT NULL
         OR p.agency_branding_subscription_id IS NOT NULL)

  UNION ALL
  SELECT 'impact', ic.paid_at, 1, 0, ic.amount_xof, 0
  FROM public.impact_contributions ic
  WHERE ic.status = 'paid' AND ic.paid_at IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_lines(DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_lines(DATE, DATE) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_dashboard(p_from DATE, p_to DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INT;
  v_prev_from DATE;
  v_monthly BOOLEAN;
  v_result JSONB;
  v_balances JSONB;
  v_tasks JSONB;
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

  -- Période précédente de même durée, juste avant.
  v_days := p_to - p_from + 1;
  v_prev_from := p_from - v_days;
  v_monthly := v_days > 62;

  WITH lines AS MATERIALIZED (
    SELECT l.activity, l.at, l.orders, l.pending, l.volume, l.gain, l.at >= p_from::timestamptz AS cur
    FROM public.admin_dashboard_lines(v_prev_from, p_to) l
    WHERE l.at >= v_prev_from::timestamptz AND l.at < (p_to + 1)::timestamptz
  ),
  per_activity AS (
    SELECT activity,
           COALESCE(sum(orders) FILTER (WHERE cur), 0) AS orders,
           COALESCE(sum(pending) FILTER (WHERE cur), 0) AS pending,
           COALESCE(sum(volume) FILTER (WHERE cur), 0) AS volume,
           COALESCE(sum(gain) FILTER (WHERE cur), 0) AS gain,
           COALESCE(sum(orders) FILTER (WHERE NOT cur), 0) AS prev_orders,
           COALESCE(sum(volume) FILTER (WHERE NOT cur), 0) AS prev_volume,
           COALESCE(sum(gain) FILTER (WHERE NOT cur), 0) AS prev_gain
    FROM lines
    GROUP BY activity
  ),
  collected AS (
    SELECT COALESCE(sum(p.amount) FILTER (WHERE p.created_at >= p_from::timestamptz), 0) AS cur,
           COALESCE(sum(p.amount) FILTER (WHERE p.created_at < p_from::timestamptz), 0) AS prev
    FROM public.payments p
    WHERE p.status = 'completed'
      AND p.created_at >= v_prev_from::timestamptz AND p.created_at < (p_to + 1)::timestamptz
  ),
  buckets AS (
    SELECT g.bucket
    FROM generate_series(
           CASE WHEN v_monthly THEN date_trunc('month', p_from::timestamp) ELSE p_from::timestamp END,
           p_to::timestamp,
           CASE WHEN v_monthly THEN interval '1 month' ELSE interval '1 day' END
         ) AS g(bucket)
  ),
  per_bucket AS (
    SELECT CASE WHEN v_monthly THEN date_trunc('month', at::timestamp) ELSE date_trunc('day', at::timestamp) END AS bucket,
           sum(volume) FILTER (WHERE activity <> 'impact') AS volume,
           sum(gain) AS gain,
           sum(orders) FILTER (WHERE activity <> 'impact') AS orders
    FROM lines
    WHERE cur
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    -- Les totaux de commandes et de volume excluent Impact (fonds collectés,
    -- pas des ventes) ; Impact a sa propre ligne.
    'totals', (
      SELECT jsonb_build_object(
        'orders', COALESCE(sum(orders) FILTER (WHERE cur AND activity <> 'impact'), 0),
        'pending', COALESCE(sum(pending) FILTER (WHERE cur AND activity <> 'impact'), 0),
        'volume', COALESCE(sum(volume) FILTER (WHERE cur AND activity <> 'impact'), 0),
        'gain', COALESCE(sum(gain) FILTER (WHERE cur), 0),
        'gain_subscriptions', COALESCE(sum(gain) FILTER (WHERE cur AND activity = 'subscription'), 0),
        'impact', COALESCE(sum(volume) FILTER (WHERE cur AND activity = 'impact'), 0),
        'collected', (SELECT cur FROM collected),
        'prev_orders', COALESCE(sum(orders) FILTER (WHERE NOT cur AND activity <> 'impact'), 0),
        'prev_volume', COALESCE(sum(volume) FILTER (WHERE NOT cur AND activity <> 'impact'), 0),
        'prev_gain', COALESCE(sum(gain) FILTER (WHERE NOT cur), 0),
        'prev_impact', COALESCE(sum(volume) FILTER (WHERE NOT cur AND activity = 'impact'), 0),
        'prev_collected', (SELECT prev FROM collected)
      )
      FROM lines
    ),
    'activities', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'activity', a.activity,
               'orders', a.orders, 'pending', a.pending, 'volume', a.volume, 'gain', a.gain,
               'prev_orders', a.prev_orders, 'prev_volume', a.prev_volume, 'prev_gain', a.prev_gain
             ) ORDER BY a.volume DESC, a.orders DESC, a.activity), '[]'::jsonb)
      FROM per_activity a
      WHERE a.orders + a.pending + a.prev_orders > 0 OR a.volume <> 0 OR a.gain <> 0 OR a.prev_gain <> 0
    ),
    -- Évolution : par jour jusqu'à 2 mois, par mois au-delà.
    'series', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'period', to_char(b.bucket, 'YYYY-MM-DD'),
               'volume', COALESCE(x.volume, 0), 'gain', COALESCE(x.gain, 0), 'orders', COALESCE(x.orders, 0)
             ) ORDER BY b.bucket), '[]'::jsonb)
      FROM buckets b
      LEFT JOIN per_bucket x ON x.bucket = b.bucket
    )
  )
    INTO v_result;

  -- Soldes à date (indépendants de la période).
  SELECT jsonb_build_object(
    'due_to_partners', COALESCE(sum(t.net_amount) FILTER (WHERE t.collection = 'online' AND t.status = 'pending'), 0),
    'payout_issues', count(*) FILTER (WHERE t.collection = 'online' AND t.status = 'pending'
                                        AND t.payout_status IN ('failed', 'needs_review', 'awaiting_details')),
    'onsite_to_collect', COALESCE(sum(t.commission_amount) FILTER (WHERE t.collection = 'on_site' AND t.status <> 'paid'), 0)
  )
    INTO v_balances
  FROM public.finance_transactions_internal(NULL, true, NULL, NULL) t;

  -- Tâches à traiter (à date). L'écran n'affiche que celles qui ont un compte.
  v_tasks := jsonb_build_array(
    jsonb_build_object('key', 'partner_applications',
      'count', (SELECT count(*) FROM public.partner_applications WHERE status = 'pending')),
    jsonb_build_object('key', 'paid_bookings_to_confirm',
      'count', (SELECT count(*) FROM public.bookings
                 WHERE status::text = 'pending' AND payment_status::text IN ('paid', 'partially_paid'))),
    jsonb_build_object('key', 'reviews',
      'count', (SELECT count(*) FROM public.reviews WHERE status = 'pending')),
    jsonb_build_object('key', 'support_tickets',
      'count', (SELECT count(*) FROM public.partner_support_tickets WHERE status IN ('open', 'in_progress'))),
    jsonb_build_object('key', 'payout_issues', 'count', (v_balances->>'payout_issues')::int),
    jsonb_build_object('key', 'onsite_invoices_overdue',
      'count', (SELECT count(*) FROM public.hotel_onsite_commission_invoices
                 WHERE status = 'issued' AND due_at < current_date)),
    jsonb_build_object('key', 'artisan_requests_waiting',
      'count', (SELECT count(*) FROM public.artisan_orders
                 WHERE status = 'pending' AND created_at < now() - interval '48 hours'))
  );

  RETURN v_result || jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'prev_from', v_prev_from,
    'prev_to', p_from - 1,
    'granularity', CASE WHEN v_monthly THEN 'month' ELSE 'day' END,
    'balances', v_balances,
    'tasks', v_tasks
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard(DATE, DATE) TO authenticated;
