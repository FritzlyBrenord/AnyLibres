-- ============================================================================
-- INSTALLATION COMPLÈTE - Exécuter ce fichier dans Supabase SQL Editor
-- ============================================================================
-- Ce script installe:
-- 1. Toutes les corrections du système de paiement
-- 2. Les fonctions de libération manuelle
-- ============================================================================

-- ============================================================================
-- PARTIE 1: Corrections principales
-- ============================================================================

\i APPLY_ALL_FIXES.sql

-- ============================================================================
-- PARTIE 2: Fonctions de libération manuelle
-- ============================================================================

\i migrations/add_manual_release_function.sql

-- ============================================================================
-- ✅ INSTALLATION TERMINÉE !
-- ============================================================================

SELECT '✅ Installation complète terminée !' as resultat;

-- Vérifier que tout fonctionne
SELECT
  'Test des fonctions' as etape,
  proname as fonction_name
FROM pg_proc
WHERE proname IN (
  'calculate_provider_net_amount',
  'auto_schedule_payment_release',
  'create_provider_earning',
  'admin_release_pending_funds',
  'get_pending_releases_details'
)
ORDER BY proname;
