-- ============================================================================
-- FIX: Recréer le trigger d'earning sur 'completed' au lieu de 'delivered'
-- ============================================================================
-- Problème: J'ai supprimé le trigger par erreur
-- Solution: Le recréer mais déclenché sur 'completed' (acceptation client)
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Créer la fonction qui crée l'earning
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_earning_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'completed', créer un earning
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM create_provider_earning(NEW.id);
    RAISE NOTICE 'Created earning for completed order %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_create_earning_on_completion IS 'Crée automatiquement un earning quand une commande est complétée (acceptée par le client)';

-- ============================================================================
-- ÉTAPE 2: Créer le trigger sur UPDATE orders WHEN status = 'completed'
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auto_create_earning_on_completed ON orders;

CREATE TRIGGER trg_auto_create_earning_on_completed
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_create_earning_on_completion();

COMMENT ON TRIGGER trg_auto_create_earning_on_completed ON orders IS 'Déclenche la création d''un earning quand le client accepte (completed)';

-- ============================================================================
-- ÉTAPE 3: Vérifier que tout est en place
-- ============================================================================

-- Vérifier que le trigger existe
SELECT
  'Trigger créé' as info,
  tgname as trigger_name,
  proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgname = 'trg_auto_create_earning_on_completed';

-- Vérifier que create_provider_earning existe
SELECT
  'Fonction create_provider_earning' as info,
  proname as function_name,
  'EXISTS' as status
FROM pg_proc
WHERE proname = 'create_provider_earning';

-- Vérifier que auto_schedule_payment_release existe
SELECT
  'Trigger auto_schedule_payment_release' as info,
  tgname as trigger_name,
  'EXISTS' as status
FROM pg_trigger
WHERE tgname LIKE '%auto_schedule%';

-- ============================================================================
-- ÉTAPE 4: Tester avec une commande existante
-- ============================================================================

-- Pour tester, vous pouvez faire ceci:
-- 1. Créer une nouvelle commande
-- 2. La livrer (status → delivered)
-- 3. L'accepter (status → completed)
-- 4. Vérifier que l'earning apparaît

-- Pour voir les résultats:
-- SELECT * FROM provider_earnings ORDER BY created_at DESC LIMIT 5;
-- SELECT * FROM scheduled_releases ORDER BY created_at DESC LIMIT 5;
-- SELECT * FROM provider_balance;

-- ============================================================================
-- FLUX COMPLET
-- ============================================================================

-- 1. Prestataire livre → status = 'delivered' (PAS de création d'earning)
-- 2. Client accepte → status = 'completed'
--    ↓
-- 3. Trigger trg_auto_create_earning_on_completed se déclenche
--    ↓
-- 4. Appelle create_provider_earning(order_id)
--    ↓ Crée dans provider_earnings avec status='completed'
--    ↓ Met à jour provider_balance.pending_cents
--    ↓
-- 5. Trigger auto_schedule_payment_release se déclenche (sur INSERT provider_earnings)
--    ↓ Trouve la règle applicable
--    ↓ Crée scheduled_release
--    ↓ SI delay_hours = 0: transfère pending → available
--    ↓
-- 6. Done! Le prestataire voit son argent dans pending ou available selon la règle
