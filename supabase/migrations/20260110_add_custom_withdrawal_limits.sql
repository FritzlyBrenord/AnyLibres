-- ============================================================================
-- Migration: Add custom withdrawal limit per provider
-- Date: 2026-01-10
-- Description: Ajoute le champ custom_withdra_qty à provider_balance
--              pour permettre des limites de retraits personnalisées par provider
-- ============================================================================

-- Ajouter la colonne custom_withdra_qty à provider_balance
ALTER TABLE provider_balance 
ADD COLUMN IF NOT EXISTS custom_withdra_qty integer DEFAULT NULL;

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN provider_balance.custom_withdra_qty IS 
'Limite personnalisée de retraits par jour pour ce provider. Si NULL, utilise la limite globale de platform_settings.withdra_qty';

-- Ajouter une contrainte pour s'assurer que la valeur est positive si définie
ALTER TABLE provider_balance
ADD CONSTRAINT custom_withdra_qty_positive 
CHECK (custom_withdra_qty IS NULL OR custom_withdra_qty > 0);

-- Index pour optimiser les requêtes qui filtrent par limite personnalisée
CREATE INDEX IF NOT EXISTS idx_provider_balance_custom_limit 
ON provider_balance(custom_withdra_qty) 
WHERE custom_withdra_qty IS NOT NULL;
