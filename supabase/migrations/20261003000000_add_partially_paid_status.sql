-- Keep enum-value additions isolated so PostgreSQL commits the new value
-- before any later migration uses it in a policy or function.
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'partially_paid';
