-- These service types already use the unified booking and payment flow.
-- Add them to the database enum so create-booking can persist their bookings.
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'activity';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'train';
