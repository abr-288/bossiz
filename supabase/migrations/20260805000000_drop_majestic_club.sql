-- Suppression complète du module Majestic Club (VIP/conciergerie).
-- Toutes les données ont été sauvegardées avant suppression dans
-- deploy-vps/backups/majestic_2026-08-05/ (JSON par table) et les lignes ont
-- déjà été purgées via deploy-vps/purge-majestic-data.mjs.
--
-- Cette migration n'a PAS pu être appliquée automatiquement au moment de sa
-- rédaction (le CLI Supabase échoue sur ce projet avec une erreur de
-- permission "42501: permission denied to alter role" lors de la rotation du
-- rôle de connexion temporaire — un problème côté plateforme, indépendant du
-- code). À exécuter manuellement dans le SQL Editor du dashboard Supabase,
-- ou via `supabase db push` une fois le problème résolu côté Supabase.

DROP TABLE IF EXISTS majestic_transactions CASCADE;
DROP TABLE IF EXISTS majestic_payments CASCADE;
DROP TABLE IF EXISTS majestic_subscriptions CASCADE;
DROP TABLE IF EXISTS majestic_service_requests CASCADE;
DROP TABLE IF EXISTS majestic_services CASCADE;
DROP TABLE IF EXISTS majestic_messages CASCADE;
DROP TABLE IF EXISTS majestic_notifications CASCADE;
DROP TABLE IF EXISTS majestic_documents CASCADE;
DROP TABLE IF EXISTS majestic_itineraries CASCADE;
DROP TABLE IF EXISTS majestic_bookings CASCADE;
DROP TABLE IF EXISTS majestic_properties CASCADE;

DROP TABLE IF EXISTS assistance_logs CASCADE;
DROP TABLE IF EXISTS service_bookings CASCADE;
DROP TABLE IF EXISTS exclusive_services CASCADE;
DROP TABLE IF EXISTS vip_event_registrations CASCADE;
DROP TABLE IF EXISTS vip_events CASCADE;
DROP TABLE IF EXISTS concierge_requests CASCADE;
DROP TABLE IF EXISTS concierge_staff CASCADE;

-- Tables partagées : on retire uniquement les lignes/valeurs "majestic",
-- les tables elles-mêmes restent (utilisées par les abonnements standard).
DELETE FROM subscription_pricing WHERE plan_id LIKE 'majestic%';
DELETE FROM subscription_plans WHERE subscription_type = 'majestic';
DELETE FROM user_subscriptions WHERE subscription_type = 'majestic';

ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_subscription_type_check;
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_subscription_type_check
  CHECK (subscription_type IN ('standard'));
