-- Prepares Twilio and Sendexa as pluggable notification providers, for the
-- Business Travel approval workflow (and anything else that needs to
-- notify a user by SMS/WhatsApp going forward). Follows the exact pattern
-- already used for email/SMS/payment providers in
-- 20260806000000_integration_credentials_and_otp.sql - just new seed rows,
-- no schema change needed (integration_credentials is already generic).
--
-- Twilio SMS already existed (seeded in that earlier migration, already
-- wired into sendSms()). This adds:
--   - sendexa (category 'sms') - Twilio's alternative for plain SMS
--   - a new 'whatsapp' category with twilio_whatsapp and sendexa_whatsapp,
--     kept as separate provider rows from the SMS ones (Twilio/Sendexa
--     WhatsApp needs a WhatsApp-approved sender number, not the plain SMS
--     one, and `provider` is UNIQUE - so SMS vs WhatsApp for the same
--     vendor gets its own row/credentials rather than overloading one).
-- The admin picks whichever of the two (per category) they want active;
-- nothing here forces a choice - that's the "je choisirai plus tard après
-- les tests" part.
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI
-- direct-connection path is broken for this project - run this file
-- manually in the Supabase Dashboard SQL Editor.

INSERT INTO public.integration_credentials (provider, category, label, credentials, is_active) VALUES
  ('sendexa', 'sms', 'Sendexa (SMS)', '{}', false),
  ('twilio_whatsapp', 'whatsapp', 'Twilio (WhatsApp Business)', '{}', false),
  ('sendexa_whatsapp', 'whatsapp', 'Sendexa (WhatsApp)', '{}', false)
ON CONFLICT (provider) DO NOTHING;
