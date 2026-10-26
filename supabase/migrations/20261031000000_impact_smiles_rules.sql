-- Bossiz Impact : règles des Smiles et configuration de la campagne
-- « Ensemble pour la croissance de Bossiz » (levée de 10 000 000 FCFA pour
-- l'application web).
--
-- 1. Smiles en pourcentage du montant versé, progressif selon la formule
--    (impact_offers.smiles_percent).
-- 2. Smiles Impact utilisables sur la conciergerie et tous les services,
--    pas sur les billets d'avion, sauf pour une contribution d'au moins
--    impact_campaigns.smiles_flights_min_xof (300 000 FCFA). Vérifié au
--    paiement par loyalty_reserve_redemption_checked. Le plafond général
--    des Smiles (10 % d'un paiement) s'applique toujours.
-- 3. Campagne : minimum 10 000 FCFA, tous les moyens de paiement Jèko,
--    formules, objectifs, étapes, FAQ et conditions (version 1, à valider).
--
-- Non destructive et rejouable. La configuration (3) n'est appliquée que
-- tant qu'aucune contribution n'a été enregistrée sur la campagne.

-- ---------------------------------------------------------------------
-- 1. Smiles en pourcentage
-- ---------------------------------------------------------------------
ALTER TABLE public.impact_offers ADD COLUMN IF NOT EXISTS smiles_percent NUMERIC(5,2);
ALTER TABLE public.impact_offers DROP CONSTRAINT IF EXISTS impact_offers_smiles_percent_check;
ALTER TABLE public.impact_offers ADD CONSTRAINT impact_offers_smiles_percent_check
  CHECK (smiles_percent IS NULL OR (smiles_percent > 0 AND smiles_percent <= 100));
COMMENT ON COLUMN public.impact_offers.smiles_percent IS
  'Part du montant versé convertie en Smiles (1 Smile par FCFA), en plus de smiles_awarded';

-- ---------------------------------------------------------------------
-- 2. Billets d'avion
-- ---------------------------------------------------------------------
ALTER TABLE public.impact_campaigns ADD COLUMN IF NOT EXISTS smiles_flights_min_xof NUMERIC(14,0);
ALTER TABLE public.impact_campaigns DROP CONSTRAINT IF EXISTS impact_campaigns_smiles_flights_min_check;
ALTER TABLE public.impact_campaigns ADD CONSTRAINT impact_campaigns_smiles_flights_min_check
  CHECK (smiles_flights_min_xof IS NULL OR smiles_flights_min_xof > 0);
COMMENT ON COLUMN public.impact_campaigns.smiles_flights_min_xof IS
  'Contribution minimale pour utiliser ses Smiles Impact sur les billets d''avion (NULL : jamais)';

-- Smiles Impact du membre encore bloqués pour les billets d'avion : Smiles
-- des contributions sous le seuil, non expirés, moins ce qui a déjà été
-- dépensé hors billets d'avion depuis (ces achats consomment d'abord les
-- Smiles Impact), dans la limite du solde.
CREATE OR REPLACE FUNCTION public.loyalty_impact_flight_locked(p_user UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH restricted AS (
    SELECT t.points, t.created_at
    FROM public.loyalty_transactions t
    JOIN public.impact_contributions ic ON t.reference_id = 'impact:' || ic.id::TEXT
    WHERE t.user_id = p_user
      AND t.kind = 'impact'
      AND t.status = 'posted'
      AND ic.status = 'paid'
      AND (t.expires_at IS NULL OR t.expires_at > now())
      AND NOT coalesce((ic.offer_snapshot ->> 'smiles_on_flights')::BOOLEAN, false)
  ),
  spent AS (
    SELECT coalesce(-sum(t.points), 0) AS points
    FROM public.loyalty_transactions t
    LEFT JOIN public.payments p ON t.reference_id = 'payment:' || p.id::TEXT
    LEFT JOIN public.bookings b ON b.id = p.booking_id
    LEFT JOIN public.services s ON s.id = b.service_id
    WHERE t.user_id = p_user
      AND t.kind = 'redeem'
      AND t.status IN ('posted', 'pending')
      AND t.created_at >= (SELECT min(r.created_at) FROM restricted r)
      AND coalesce(s.type::TEXT, '') NOT IN ('flight', 'flight_hotel')
  )
  SELECT least(
    greatest(public.loyalty_balance(p_user), 0),
    greatest(0, (SELECT coalesce(sum(r.points), 0) FROM restricted r) - (SELECT sp.points FROM spent sp))
  )::INTEGER;
$$;
REVOKE ALL ON FUNCTION public.loyalty_impact_flight_locked(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_impact_flight_locked(UUID) TO service_role;

-- Réservation de Smiles sur un paiement, avec la règle des billets d'avion.
-- Retour : 'ok', 'insufficient' (solde insuffisant) ou 'impact_flight'
-- (solde suffisant, mais composé de Smiles Impact non utilisables sur un
-- billet d'avion).
CREATE OR REPLACE FUNCTION public.loyalty_reserve_redemption_checked(
  p_user UUID,
  p_points INTEGER,
  p_reference TEXT,
  p_booking_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flight BOOLEAN := false;
  v_balance INTEGER;
  v_locked INTEGER := 0;
BEGIN
  IF p_points IS NULL OR p_points <= 0 THEN
    RETURN 'insufficient';
  END IF;
  PERFORM public.loyalty_ensure_account(p_user);
  -- Même verrou que loyalty_reserve_redemption : pas de double dépense.
  PERFORM 1 FROM public.loyalty_accounts WHERE user_id = p_user FOR UPDATE;

  IF p_booking_id IS NOT NULL THEN
    SELECT coalesce(s.type::TEXT IN ('flight', 'flight_hotel'), false)
      INTO v_flight
      FROM public.bookings b
      LEFT JOIN public.services s ON s.id = b.service_id
      WHERE b.id = p_booking_id;
  END IF;

  v_balance := public.loyalty_balance(p_user);
  IF coalesce(v_flight, false) THEN
    v_locked := public.loyalty_impact_flight_locked(p_user);
  END IF;

  IF v_balance - v_locked < p_points THEN
    RETURN CASE WHEN v_balance >= p_points THEN 'impact_flight' ELSE 'insufficient' END;
  END IF;

  INSERT INTO public.loyalty_transactions (user_id, kind, points, status, description, reference_id)
  VALUES (p_user, 'redeem', -p_points, 'pending', 'Utilisation sur un paiement', p_reference);
  RETURN 'ok';
END;
$$;
REVOKE ALL ON FUNCTION public.loyalty_reserve_redemption_checked(UUID, INTEGER, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_reserve_redemption_checked(UUID, INTEGER, TEXT, UUID) TO service_role;

-- ---------------------------------------------------------------------
-- Page publique (version de 20261029000000) : pourcentage de Smiles par
-- formule. Le seuil des billets d'avion est une colonne de la campagne.
-- ---------------------------------------------------------------------
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
        'smiles_percent', o.smiles_percent,
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

-- ---------------------------------------------------------------------
-- Création d'une contribution (version de 20261029000000) : les Smiles
-- (montant fixe + pourcentage) et l'accès aux billets d'avion sont figés
-- dans offer_snapshot ; impact_confirm_contribution les attribue tels quels.
-- ---------------------------------------------------------------------
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
  v_flights BOOLEAN;
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

  v_flights := c.smiles_flights_min_xof IS NOT NULL AND v_amount >= c.smiles_flights_min_xof;

  IF p_offer_id IS NULL THEN
    IF NOT c.allow_free_amount THEN
      RAISE EXCEPTION 'Choisissez une offre' USING ERRCODE = '22023';
    END IF;
    v_snapshot := jsonb_build_object('offer', NULL, 'benefits', '[]'::jsonb, 'smiles_awarded', 0,
                                     'smiles_on_flights', v_flights,
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
      'smiles_awarded', o.smiles_awarded + floor(v_amount * coalesce(o.smiles_percent, 0) / 100)::INTEGER,
      'smiles_percent', o.smiles_percent,
      'smiles_on_flights', v_flights,
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
    jsonb_build_object('amount_xof', v_amount, 'offer_id', p_offer_id,
                       'smiles', v_snapshot -> 'smiles_awarded'));

  RETURN jsonb_build_object('id', v_id, 'reference', v_reference, 'amount_xof', v_amount,
                            'smiles', v_snapshot -> 'smiles_awarded');
END;
$$;
REVOKE ALL ON FUNCTION public.impact_start_contribution(UUID, UUID, NUMERIC, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.impact_start_contribution(UUID, UUID, NUMERIC, TEXT, TEXT, BOOLEAN) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. Configuration de la campagne (avant toute contribution)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_campaign UUID;
BEGIN
  SELECT id INTO v_campaign FROM public.impact_campaigns WHERE slug = 'ensemble-pour-la-croissance-de-bossiz';
  IF v_campaign IS NULL THEN
    RAISE NOTICE 'Campagne absente : configuration ignorée';
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.impact_contributions WHERE campaign_id = v_campaign) THEN
    RAISE NOTICE 'Des contributions existent : configuration de la campagne inchangée';
    RETURN;
  END IF;

  UPDATE public.impact_campaigns SET
    tagline = 'Ensemble, construisons l''application de voyage de Côte d''Ivoire.',
    secondary_tagline = 'Votre soutien devient des Smiles à dépenser sur Bossiz pendant 24 mois.',
    summary = 'Bossiz lève 10 000 000 FCFA auprès de sa communauté pour développer son application web : '
      || 'conciergerie, réservation et paiement en ligne, réseau de partenaires. Chaque contribution, '
      || 'à partir de 10 000 FCFA, est convertie en Smiles Bossiz utilisables sur nos services.',
    description = 'Bossiz rassemble en une seule application tout ce qu''il faut pour voyager et sortir en Côte '
      || 'd''Ivoire : conciergerie, hôtels et séjours, activités, location de voitures, restaurants, bien-être, '
      || 'artisans et événements.' || E'\n\n'
      || 'Pour aller plus vite, nous ouvrons le financement de l''application à notre communauté. En échange '
      || 'de votre contribution, vous devenez Membre Impact et recevez des Smiles Bossiz : de 50 % à 100 % de '
      || 'votre contribution selon la formule, utilisables pendant 24 mois sur la conciergerie et sur tous '
      || 'nos services.' || E'\n\n'
      || 'Une contribution Bossiz Impact est un soutien volontaire avec des avantages commerciaux : ce n''est '
      || 'ni un placement, ni un prêt, ni une prise de participation.',
    goal_xof = 10000000,
    target_members = 200,
    min_contribution_xof = 10000,
    max_contribution_xof = NULL,
    allow_free_amount = false,
    benefits_validity_months = 24,
    smiles_flights_min_xof = 300000,
    accepted_methods = ARRAY['wave', 'orange_money', 'mtn', 'moov', 'djamo'],
    funding_uses = jsonb_build_array(
      jsonb_build_object('title', 'Développement de l''application web',
        'description', 'Conciergerie dans l''application, réservation et paiement en ligne de bout en bout, '
          || 'espace client et espace partenaire.',
        'amount_xof', 4000000),
      jsonb_build_object('title', 'Partenaires',
        'description', 'Recrutement, vérification et mise en ligne des hôtels, restaurants, artisans, '
          || 'loueurs et prestataires bien-être.',
        'amount_xof', 2000000),
      jsonb_build_object('title', 'Sécurité et infrastructure',
        'description', 'Hébergement, sauvegardes, sécurité des paiements et des données.',
        'amount_xof', 1500000),
      jsonb_build_object('title', 'Lancement et communication',
        'description', 'Faire connaître Bossiz aux voyageurs, en Côte d''Ivoire et dans la diaspora.',
        'amount_xof', 1500000),
      jsonb_build_object('title', 'Service client et conciergerie',
        'description', 'Équipe et outils pour répondre aux clients et traiter les demandes de conciergerie.',
        'amount_xof', 1000000)
    ),
    milestones = jsonb_build_array(
      jsonb_build_object('title', 'Conciergerie dans l''application',
        'description', 'Demandes, suivi et paiement de la conciergerie directement dans l''application.',
        'target_xof', 2500000, 'done', false),
      jsonb_build_object('title', 'Paiement et sécurité',
        'description', 'Paiement Mobile Money tous opérateurs sur tous les services, application plus '
          || 'rapide et sécurisée.',
        'target_xof', 5000000, 'done', false),
      jsonb_build_object('title', '100 nouveaux partenaires',
        'description', '100 partenaires vérifiés en plus : hôtels, restaurants, artisans, loueurs, bien-être.',
        'target_xof', 7500000, 'done', false),
      jsonb_build_object('title', 'Lancement national',
        'description', 'Campagne de lancement et service client renforcé, 7 jours sur 7.',
        'target_xof', 10000000, 'done', false)
    ),
    faq = jsonb_build_array(
      jsonb_build_object('question', 'Qu''est-ce que Bossiz Impact ?',
        'answer', 'La campagne de financement participatif de l''application Bossiz. Vous soutenez son '
          || 'développement et recevez des Smiles Bossiz en remerciement.'),
      jsonb_build_object('question', 'Combien puis-je contribuer ?',
        'answer', 'À partir de 10 000 FCFA. Votre montant détermine votre formule : Découverte (10 000 à '
          || '49 999 FCFA), Soutien (50 000 à 99 999 FCFA), Partenaire Smile (100 000 à 299 999 FCFA) ou '
          || 'Grand soutien (300 000 FCFA et plus).'),
      jsonb_build_object('question', 'Comment payer ?',
        'answer', 'En ligne, par Wave, Orange Money, MTN Mobile Money, Moov Money ou Djamo, sur la page de '
          || 'paiement sécurisée de notre prestataire Jèko. Bossiz ne vous demande jamais votre code secret.'),
      jsonb_build_object('question', 'Combien de Smiles vais-je recevoir ?',
        'answer', '1 Smile vaut 1 FCFA de réduction. Vous recevez 50 % de votre contribution en Smiles avec '
          || 'Découverte, 65 % avec Soutien, 80 % avec Partenaire Smile et 100 % avec Grand soutien. '
          || 'Exemple : 100 000 FCFA donnent 80 000 Smiles.'),
      jsonb_build_object('question', 'Où utiliser mes Smiles ?',
        'answer', 'Sur la conciergerie et tous les services Bossiz : hôtels, séjours, activités, location de '
          || 'voitures, restaurants, bien-être, artisans, événements. Les billets d''avion sont réservés aux '
          || 'contributions de 300 000 FCFA et plus. À chaque paiement, les Smiles couvrent au plus 10 % '
          || 'du montant.'),
      jsonb_build_object('question', 'Combien de temps sont-ils valables ?',
        'answer', '24 mois à partir de la confirmation de votre paiement. Vous suivez votre solde et la date '
          || 'd''expiration dans « Mon espace Impact ».')
    ),
    terms_version = '1',
    terms = 'Conditions du programme Bossiz Impact (version 1)' || E'\n\n'
      || '1. Objet. Bossiz Impact est une campagne de soutien volontaire au développement de l''application '
      || 'Bossiz. La contribution n''est ni un placement, ni un prêt, ni une prise de participation : elle '
      || 'ne donne droit à aucun intérêt, dividende ou remboursement, en dehors des cas prévus à l''article 6.'
      || E'\n\n'
      || '2. Contribution. Le montant minimum est de 10 000 FCFA. La contribution est payée en ligne (Wave, '
      || 'Orange Money, MTN Mobile Money, Moov Money ou Djamo) via le prestataire de paiement de Bossiz, Jèko. '
      || 'Elle est confirmée uniquement après '
      || 'validation du paiement par ce prestataire.' || E'\n\n'
      || '3. Smiles. En remerciement, le Membre Impact reçoit des Smiles Bossiz selon sa formule : 50 % '
      || '(Découverte), 65 % (Soutien), 80 % (Partenaire Smile) ou 100 % (Grand soutien) du montant versé, '
      || 'à raison d''1 Smile pour 1 FCFA. Les Smiles sont valables 24 mois à compter de la confirmation du '
      || 'paiement ; les Smiles non utilisés à cette date sont perdus.' || E'\n\n'
      || '4. Utilisation. Les Smiles s''utilisent lors du paiement en ligne de la conciergerie et des services '
      || 'Bossiz, dans la limite fixée par le programme Bossiz Smiles (10 % du montant de chaque paiement à ce '
      || 'jour). Ils ne sont pas utilisables sur les billets d''avion, sauf pour les contributions de '
      || '300 000 FCFA ou plus.' || E'\n\n'
      || '5. Nature des Smiles. Les Smiles sont un avantage commercial personnel. Ils ne constituent pas de '
      || 'la monnaie, ne sont ni remboursables, ni retirables, ni convertibles en espèces, ni cessibles.'
      || E'\n\n'
      || '6. Remboursement. Une contribution peut être remboursée en cas d''erreur de paiement ou si la loi '
      || 'l''impose, sur demande adressée au service client. Le remboursement annule les Smiles attribués ; '
      || 'les Smiles déjà utilisés sont déduits du montant remboursé.' || E'\n\n'
      || '7. Données personnelles. Les informations fournies (nom, téléphone, e-mail) servent uniquement à '
      || 'la gestion de la contribution et du programme, conformément à la politique de confidentialité de '
      || 'Bossiz.' || E'\n\n'
      || '8. Modification. Bossiz peut faire évoluer le programme ; les Smiles déjà attribués restent '
      || 'acquis aux conditions en vigueur lors de la contribution.',
    updated_at = now()
  WHERE id = v_campaign;

  -- Formules : les 4 formules d'origine, remises aux nouveaux montants.
  UPDATE public.impact_offers o SET
    name = v.name,
    description = v.description,
    min_amount_xof = v.min_amount,
    max_amount_xof = v.max_amount,
    smiles_awarded = 0,
    smiles_percent = v.pct,
    validity_months = NULL,
    is_active = true,
    updated_at = now()
  FROM (VALUES
    (10, 'Découverte', 'Smiles utilisables sur la conciergerie et tous les services Bossiz.', 10000, 49999, 50),
    (20, 'Soutien', 'Smiles utilisables sur la conciergerie et tous les services Bossiz.', 50000, 99999, 65),
    (30, 'Partenaire Smile', 'Smiles utilisables sur la conciergerie et tous les services Bossiz.', 100000, 299999, 80),
    (40, 'Grand soutien', 'Smiles utilisables sur la conciergerie, tous les services Bossiz et les billets d''avion.', 300000, NULL, 100)
  ) AS v(sort_order, name, description, min_amount, max_amount, pct)
  WHERE o.campaign_id = v_campaign AND o.sort_order = v.sort_order;

  -- Services des avantages : tous, sauf la billetterie aérienne.
  UPDATE public.impact_eligible_services SET is_enabled = (key <> 'voyages');
END;
$$;
