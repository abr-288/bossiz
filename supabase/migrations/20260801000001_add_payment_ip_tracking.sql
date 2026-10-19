-- Persist the client IP at the moment a payment is initiated, so there is
-- durable evidence (beyond ephemeral console logs) to defend a chargeback
-- dispute: who, from where, requested this specific charge.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS ip_address TEXT;
