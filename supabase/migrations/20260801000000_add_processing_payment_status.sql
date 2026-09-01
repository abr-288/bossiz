-- Adds a 'processing' state to payment_status so process-payment can
-- atomically claim a booking before calling CinetPay (UPDATE ... WHERE
-- payment_status = 'pending' ... RETURNING), preventing two concurrent
-- requests (double-click, network retry) from both creating a CinetPay
-- payment session for the same booking.
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'processing';
