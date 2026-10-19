-- Records what the supplier actually costs us, alongside what the customer
-- was charged (bookings.total_price), so revenue/margin can be reconciled
-- per booking instead of only knowing the retail price. Populated for
-- hotel/car (back-computed from the known retail markup) and flight
-- (the real base_fare from the signed price breakdown); left null for
-- verticals with no tracked supplier cost yet (stay/activity/train/event).
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS supplier_cost DECIMAL(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS supplier_cost_currency VARCHAR(10);
