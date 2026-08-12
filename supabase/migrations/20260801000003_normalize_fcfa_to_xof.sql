-- "FCFA" and "XOF" are the same currency (West African CFA franc) under two
-- different labels - prebook/process-payment already use the ISO 4217 code
-- 'XOF', while services/bookings/payments defaulted to the informal 'FCFA'.
-- Left alone this fragments any currency-based reporting/reconciliation.
-- This is a pure relabeling (no value conversion, both spellings mean the
-- same amount of money).
UPDATE public.services SET currency = 'XOF' WHERE currency = 'FCFA';
UPDATE public.bookings SET currency = 'XOF' WHERE currency = 'FCFA';
UPDATE public.payments SET currency = 'XOF' WHERE currency = 'FCFA';

ALTER TABLE public.services ALTER COLUMN currency SET DEFAULT 'XOF';
ALTER TABLE public.bookings ALTER COLUMN currency SET DEFAULT 'XOF';
ALTER TABLE public.payments ALTER COLUMN currency SET DEFAULT 'XOF';
