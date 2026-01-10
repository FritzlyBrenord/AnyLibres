-- ============================================================================
-- MIGRATION: Ajout de limites de retraits personnalisées par provider
-- Date: 2025-02-10
-- Description: Permet de définir un nombre de retraits spécifique par provider
--              et d'annuler des retraits en cours
-- ============================================================================

-- ============================================================================
-- 1. Ajouter le champ custom_withdra_qty à provider_balance
-- ============================================================================

ALTER TABLE provider_balance
ADD COLUMN IF NOT EXISTS custom_withdra_qty INTEGER NULL;

COMMENT ON COLUMN provider_balance.custom_withdra_qty IS
  'Nombre de retraits personnalisé pour ce provider (NULL = utilise la limite globale)';

-- ============================================================================
-- 2. Créer un index pour les requêtes rapides
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_provider_balance_custom_withdra
  ON provider_balance(custom_withdra_qty)
  WHERE custom_withdra_qty IS NOT NULL;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
