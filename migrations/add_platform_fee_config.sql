-- ============================================================================
-- MIGRATION: Ajouter la configuration des frais de plateforme
-- ============================================================================
-- Date: 2025-12-10
-- Description: Ajoute la colonne platform_fee_config aux tables services et orders

-- 1. Ajouter la colonne aux services
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS platform_fee_config JSONB NULL
DEFAULT '{"fee_percentage": 5, "fee_type": "percentage", "paid_by": "client", "min_fee_cents": 50}'::jsonb;

-- 2. Commenter la colonne pour documentation
COMMENT ON COLUMN public.services.platform_fee_config IS
'Configuration des frais de plateforme pour ce service. Format: {"fee_percentage": 5, "fee_type": "percentage|fixed|hybrid", "paid_by": "client|provider|split", "min_fee_cents": 50, "max_fee_cents": 5000, "fixed_amount_cents": 100}';

-- 3. Créer un index GIN pour recherche rapide sur JSONB
CREATE INDEX IF NOT EXISTS idx_services_platform_fee_config
ON public.services USING GIN (platform_fee_config);

-- 4. Fonction pour valider la configuration des frais
CREATE OR REPLACE FUNCTION validate_platform_fee_config(config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que fee_percentage existe et est un nombre valide
  IF NOT (config ? 'fee_percentage') THEN
    RETURN FALSE;
  END IF;

  -- Vérifier que fee_type est valide
  IF NOT (config->>'fee_type' IN ('percentage', 'fixed', 'hybrid')) THEN
    RETURN FALSE;
  END IF;

  -- Vérifier que paid_by est valide
  IF NOT (config->>'paid_by' IN ('client', 'provider', 'split')) THEN
    RETURN FALSE;
  END IF;

  -- Vérifier que fee_percentage est entre 0 et 100
  IF (config->>'fee_percentage')::numeric < 0 OR (config->>'fee_percentage')::numeric > 100 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Contrainte de validation sur la colonne
ALTER TABLE public.services
ADD CONSTRAINT check_valid_platform_fee_config
CHECK (
  platform_fee_config IS NULL OR
  validate_platform_fee_config(platform_fee_config)
);

-- 6. Mettre à jour les services existants avec la config par défaut (si NULL)
UPDATE public.services
SET platform_fee_config = '{"fee_percentage": 5, "fee_type": "percentage", "paid_by": "client", "min_fee_cents": 50}'::jsonb
WHERE platform_fee_config IS NULL;

-- ============================================================================
-- EXEMPLES D'UTILISATION
-- ============================================================================

-- Exemple 1: Service avec frais de 5% (par défaut)
-- UPDATE services SET platform_fee_config = '{"fee_percentage": 5, "fee_type": "percentage", "paid_by": "client"}' WHERE id = 'xxx';

-- Exemple 2: Service avec frais de 2% (catégorie premium)
-- UPDATE services SET platform_fee_config = '{"fee_percentage": 2, "fee_type": "percentage", "paid_by": "client"}' WHERE id = 'xxx';

-- Exemple 3: Service avec frais de 10% + 50 centimes minimum
-- UPDATE services SET platform_fee_config = '{"fee_percentage": 10, "fee_type": "percentage", "paid_by": "client", "min_fee_cents": 50}' WHERE id = 'xxx';

-- Exemple 4: Service avec frais fixes de 2€
-- UPDATE services SET platform_fee_config = '{"fee_type": "fixed", "fixed_amount_cents": 200, "paid_by": "client"}' WHERE id = 'xxx';

-- Exemple 5: Service où le prestataire paie les frais (3%)
-- UPDATE services SET platform_fee_config = '{"fee_percentage": 3, "fee_type": "percentage", "paid_by": "provider"}' WHERE id = 'xxx';

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================

-- Pour annuler cette migration:
-- ALTER TABLE public.services DROP COLUMN IF EXISTS platform_fee_config;
-- DROP FUNCTION IF EXISTS validate_platform_fee_config(JSONB);
-- DROP INDEX IF EXISTS idx_services_platform_fee_config;
