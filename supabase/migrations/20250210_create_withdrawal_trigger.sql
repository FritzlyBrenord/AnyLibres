-- ============================================================================
-- MIGRATION: Trigger pour mise à jour du solde après retrait
-- Date: 2025-02-10
-- Description: Crée le trigger manquant qui met à jour provider_balance
--              automatiquement quand un retrait est complété
-- ============================================================================

-- ============================================================================
-- FONCTION: update_balance_after_withdrawal
-- ============================================================================

CREATE OR REPLACE FUNCTION update_balance_after_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le statut est passé à 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN

    -- Mettre à jour le solde du provider
    UPDATE provider_balance
    SET
      available_cents = available_cents - NEW.amount_cents,
      withdrawn_cents = withdrawn_cents + NEW.amount_cents,
      last_withdrawal_at = NEW.completed_at,
      updated_at = NOW()
    WHERE provider_id = NEW.provider_id;

    -- Vérifier que la mise à jour a réussi
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Provider balance not found for provider_id: %', NEW.provider_id;
    END IF;

    -- Logger l'action
    RAISE NOTICE 'Balance updated for provider %: -%cents withdrawn',
      NEW.provider_id,
      NEW.amount_cents;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: trg_update_balance_after_withdrawal
-- ============================================================================

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trg_update_balance_after_withdrawal ON provider_withdrawals;

-- Créer le nouveau trigger
CREATE TRIGGER trg_update_balance_after_withdrawal
  AFTER UPDATE ON provider_withdrawals
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION update_balance_after_withdrawal();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION update_balance_after_withdrawal() IS
  'Met à jour automatiquement le solde du provider quand un retrait est complété';

COMMENT ON TRIGGER trg_update_balance_after_withdrawal ON provider_withdrawals IS
  'Déclenche la mise à jour du solde quand le statut passe à completed';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
