-- ============================================================================
-- INSTRUCTIONS:
-- 1. Ouvrez votre dashboard Supabase
-- 2. Allez dans "SQL Editor"
-- 3. Créez une nouvelle query
-- 4. Copiez-collez tout le contenu de ce fichier
-- 5. Exécutez (Run)
-- ============================================================================

-- Ajouter la colonne fee_by_location_type si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'platform_settings'
    AND column_name = 'fee_by_location_type'
  ) THEN
    ALTER TABLE platform_settings
    ADD COLUMN fee_by_location_type JSONB NOT NULL DEFAULT '{}'::jsonb;

    -- Créer un index GIN pour les recherches
    CREATE INDEX IF NOT EXISTS idx_platform_settings_fee_by_location_type
    ON platform_settings USING GIN (fee_by_location_type);

    -- Ajouter un commentaire
    COMMENT ON COLUMN platform_settings.fee_by_location_type IS
    'Frais personnalisés par type de localisation au format JSON: {"remote": fee_percentage, "onsite": fee_percentage, "hybrid": fee_percentage}';

    RAISE NOTICE 'Column fee_by_location_type added successfully';
  ELSE
    RAISE NOTICE 'Column fee_by_location_type already exists';
  END IF;
END $$;

-- Vérifier que tout est bien créé
SELECT
  id,
  global_fee_percentage,
  global_fee_type,
  global_fee_paid_by,
  withdrawal_fee_percentage,
  min_fee_cents,
  fee_by_category,
  fee_by_location,
  fee_by_location_type,
  created_at,
  updated_at
FROM platform_settings;
