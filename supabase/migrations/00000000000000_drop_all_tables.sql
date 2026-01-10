-- =====================================================
-- SCRIPT DE NETTOYAGE: Supprimer toutes les tables
-- Date: 2025-01-26
-- Description: Supprime toutes les tables existantes pour réinitialisation propre
-- ATTENTION: Ce script supprime TOUTES les données!
-- =====================================================

-- Désactiver les foreign key checks temporairement
SET session_replication_role = 'replica';

-- Supprimer les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS public.ai_recommendations CASCADE;
DROP TABLE IF EXISTS public.user_insights CASCADE;
DROP TABLE IF EXISTS public.search_history CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.user_activity_log CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.order_revisions CASCADE;
DROP TABLE IF EXISTS public.order_deliveries CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;
DROP TABLE IF EXISTS public.currencies CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_order_status_on_delivery() CASCADE;
DROP FUNCTION IF EXISTS update_order_status_on_revision() CASCADE;

-- Supprimer les types personnalisés
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS service_visibility CASCADE;
DROP TYPE IF EXISTS role_enum CASCADE;
DROP TYPE IF EXISTS currency_code CASCADE;

-- Réactiver les foreign key checks
SET session_replication_role = 'origin';

-- =====================================================
-- FIN DU NETTOYAGE
-- =====================================================