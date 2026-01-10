-- ============================================================================
-- INSTRUCTIONS:
-- 1. Ouvrez votre dashboard Supabase
-- 2. Allez dans "SQL Editor"
-- 3. Créez une nouvelle query
-- 4. Copiez-collez tout le contenu de ce fichier
-- 5. Exécutez (Run)
-- ============================================================================

-- Créer la table platform_settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  global_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  global_fee_type TEXT NOT NULL DEFAULT 'percentage' CHECK (global_fee_type IN ('percentage', 'fixed')),
  global_fee_paid_by TEXT NOT NULL DEFAULT 'client' CHECK (global_fee_paid_by IN ('client', 'provider', 'split')),
  withdrawal_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 2.50,
  min_fee_cents INTEGER NOT NULL DEFAULT 50,
  fee_by_category JSONB NOT NULL DEFAULT '{}'::jsonb,
  fee_by_location JSONB NOT NULL DEFAULT '{}'::jsonb,
  fee_by_location_type JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row_platform_settings CHECK (id = 1)
);

-- Insérer les paramètres par défaut
INSERT INTO platform_settings (
  id,
  global_fee_percentage,
  global_fee_type,
  global_fee_paid_by,
  withdrawal_fee_percentage,
  min_fee_cents,
  fee_by_category,
  fee_by_location,
  fee_by_location_type
) VALUES (
  1,
  5.00,
  'percentage',
  'client',
  2.50,
  50,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Vérifier que tout est bien créé
SELECT * FROM platform_settings;
