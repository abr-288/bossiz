-- Réassurance de l'accueil : trois arguments vérifiables à la place de
-- « Meilleurs Prix Garantis » (promesse non tenue par le produit).
-- 1. Paiement Mobile Money  2. Support 24/7  3. Annulation simple
-- Migration locale : à appliquer après validation.

UPDATE homepage_features
SET feature_id = 'mobile-money',
    title = 'Paiement Mobile Money',
    description = 'Payez avec Wave, MTN ou Moov, ou par carte bancaire, en toute sécurité.',
    icon = 'Smartphone',
    order_num = 1,
    updated_at = NOW()
WHERE feature_id = 'secure-booking';

UPDATE homepage_features
SET order_num = 2,
    description = 'Notre équipe vous répond à toute heure, par chat, téléphone ou e-mail.',
    updated_at = NOW()
WHERE feature_id = 'support-247';

UPDATE homepage_features
SET feature_id = 'easy-cancellation',
    title = 'Annulation simple',
    description = 'Annulez ou modifiez votre réservation depuis votre compte, selon les conditions de l''offre.',
    icon = 'RotateCcw',
    order_num = 3,
    updated_at = NOW()
WHERE feature_id = 'best-prices';

-- Base sans ces lignes : création
INSERT INTO homepage_features (feature_id, title, description, icon, color, order_num)
VALUES
  ('mobile-money', 'Paiement Mobile Money', 'Payez avec Wave, MTN ou Moov, ou par carte bancaire, en toute sécurité.', 'Smartphone', 'from-blue-500 to-blue-600', 1),
  ('support-247', 'Support 24/7', 'Notre équipe vous répond à toute heure, par chat, téléphone ou e-mail.', 'Headphones', 'from-orange-500 to-orange-600', 2),
  ('easy-cancellation', 'Annulation simple', 'Annulez ou modifiez votre réservation depuis votre compte, selon les conditions de l''offre.', 'RotateCcw', 'from-green-500 to-green-600', 3)
ON CONFLICT (feature_id) DO NOTHING;
