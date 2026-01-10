-- ============================================================================
-- Migration: Fix Withdrawal Balance Trigger
-- Date: 2026-01-10
-- Description: Met à jour le trigger pour qu'il se déclenche aussi lors d'un INSERT
--              car l'API insère directement en statut 'completed'.
-- ============================================================================

-- 1. Mettre à jour la fonction pour gérer INSERT et UPDATE
CREATE OR REPLACE FUNCTION update_balance_after_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Déclencher si:
  -- - C'est un nouvel enregistrement (INSERT) déjà en statut 'completed'
  -- - C'est une mise à jour (UPDATE) et le statut passe à 'completed'
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed') THEN

    -- Mettre à jour le solde du provider
    UPDATE provider_balance
    SET
      available_cents = available_cents - NEW.amount_cents,
      withdrawn_cents = withdrawn_cents + NEW.amount_cents,
      last_withdrawal_at = COALESCE(NEW.completed_at, NEW.created_at, NOW()),
      updated_at = NOW()
    WHERE provider_id = NEW.provider_id;

    -- Vérifier que la mise à jour a réussi
    IF NOT FOUND THEN
      -- Optionnel: Créer le solde s'il n'existe pas (devrait normalement exister)
      -- RAISE EXCEPTION 'Balance not found for user %', NEW.provider_id;
      NULL; 
    END IF;

    -- Logger
    RAISE NOTICE 'Balance deducted by % cents for provider % (%)', 
      NEW.amount_cents, NEW.provider_id, TG_OP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recréer le trigger pour inclure INSERT
DROP TRIGGER IF EXISTS trg_update_balance_after_withdrawal ON provider_withdrawals;

CREATE TRIGGER trg_update_balance_after_withdrawal
  AFTER INSERT OR UPDATE ON provider_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_balance_after_withdrawal();

-- 3. Optionnel: Corriger les balances des retraits déjà effectués qui n'ont pas été décomptés
-- On cherche les retraits 'completed' dont le montant n'a pas été retiré du solde.
-- Note: Cette étape est manuelle ou risquée sans vérification précise.
-- Mieux vaut laisser l'admin ajuster manuellement si besoin, ou faire une requête ciblée.
