-- ============================================================================
-- FIX IMMÉDIAT: Désactiver le trigger qui cause la double libération
-- ============================================================================
-- EXÉCUTEZ CE SCRIPT EN PRIORITÉ ABSOLUE
-- ============================================================================

-- Supprimer complètement le trigger
DROP TRIGGER IF EXISTS trg_auto_release_earning ON orders;

-- Vérifier qu'il est bien supprimé
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_auto_release_earning'
  ) THEN
    RAISE EXCEPTION 'Le trigger existe encore!';
  ELSE
    RAISE NOTICE '✅ Trigger supprimé avec succès';
  END IF;
END $$;

-- Corriger immédiatement les balances négatives
UPDATE provider_balance
SET pending_cents = GREATEST(0, pending_cents)
WHERE pending_cents < 0;

UPDATE provider_balance
SET available_cents = GREATEST(0, available_cents)
WHERE available_cents < 0;

-- Afficher le résultat
SELECT
  provider_id,
  pending_cents / 100.0 AS pending_eur,
  available_cents / 100.0 AS available_eur,
  total_earned_cents / 100.0 AS total_eur
FROM provider_balance
ORDER BY updated_at DESC
LIMIT 5;

RAISE NOTICE '🎉 TRIGGER DÉSACTIVÉ - VOUS POUVEZ MAINTENANT TESTER';
