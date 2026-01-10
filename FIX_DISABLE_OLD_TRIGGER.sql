-- ============================================================================
-- FIX URGENT: Désactiver le trigger qui crée automatiquement l'earning
-- ============================================================================
-- PROBLÈME:
--   Il y a DEUX triggers sur orders:
--   1. trg_auto_apply_payment_rules (notre nouveau - applique les règles)
--   2. trg_auto_create_earning_on_completed (ancien - crée l'earning)
--
--   Le trigger #2 crée un earning APRÈS que l'API en ait déjà créé un
--   → DOUBLON d'earnings!
--
-- SOLUTION:
--   Désactiver trg_auto_create_earning_on_completed car maintenant
--   l'API crée l'earning AVANT de changer le statut
-- ============================================================================

-- Désactiver le trigger qui crée automatiquement l'earning
DROP TRIGGER IF EXISTS trg_auto_create_earning_on_completed ON orders;

RAISE NOTICE '✅ Trigger trg_auto_create_earning_on_completed supprimé';
RAISE NOTICE '   → L''API crée maintenant l''earning AVANT le changement de statut';
RAISE NOTICE '   → Plus de doublon!';

-- Vérifier les triggers actifs
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  CASE tgenabled
    WHEN 'O' THEN '✅ ACTIF'
    WHEN 'D' THEN '❌ DÉSACTIVÉ'
    ELSE '⚠️ AUTRE'
  END as status,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'orders'::regclass
  AND tgname NOT LIKE 'pg_%'
ORDER BY tgname;

RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
RAISE NOTICE '✅ CONFIGURATION FINALE DES TRIGGERS';
RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
RAISE NOTICE '';
RAISE NOTICE '✅ trg_auto_apply_payment_rules: ACTIF';
RAISE NOTICE '   → Applique les règles et libère les fonds automatiquement';
RAISE NOTICE '';
RAISE NOTICE '❌ trg_auto_create_earning_on_completed: SUPPRIMÉ';
RAISE NOTICE '   → L''API crée maintenant l''earning manuellement';
RAISE NOTICE '';
RAISE NOTICE '✅ trg_orders_updated_at: ACTIF (gardé)';
RAISE NOTICE '   → Met à jour updated_at automatiquement';
RAISE NOTICE '';
RAISE NOTICE '🎉 VOUS POUVEZ MAINTENANT TESTER!';
