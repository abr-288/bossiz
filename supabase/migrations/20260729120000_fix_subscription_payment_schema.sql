-- Correctif : le paiement d'abonnement (page /subscription-payment) insère dans
-- user_subscriptions des colonnes (subscription_type, amount_paid, currency,
-- payment_method, transaction_id, status='pending') qui n'existent pas ou sont
-- rejetées par la contrainte CHECK du schéma initial (20240420_create_user_subscriptions.sql).
-- Les migrations "IF NOT EXISTS" suivantes (20250101120003_user_subscriptions.sql)
-- n'ont jamais pu s'appliquer car la table existait déjà. On répare ici le schéma
-- réellement en place plutôt que de retoucher les migrations historiques déjà exécutées.

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS subscription_type TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_type ON public.user_subscriptions(subscription_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_transaction_id
  ON public.user_subscriptions(transaction_id)
  WHERE transaction_id IS NOT NULL;

-- Le statut initial d'un abonnement en attente de paiement doit être acceptable.
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_status_check
  CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'trial'));

-- payments.booking_id est NOT NULL avec une FK vers bookings : impossible d'y
-- enregistrer un paiement d'abonnement (qui n'a pas de réservation associée).
-- On l'assouplit et on ajoute une référence optionnelle vers user_subscriptions.
ALTER TABLE public.payments ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_target_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_target_check
  CHECK (booking_id IS NOT NULL OR subscription_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
