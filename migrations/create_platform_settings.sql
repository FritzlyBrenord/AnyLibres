-- ============================================================================
-- Table: platform_settings
-- Description: Paramètres globaux de la plateforme pour la gestion des frais
-- ============================================================================

-- Créer la table platform_settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,

  -- Paramètres de commission globale
  global_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  global_fee_type TEXT NOT NULL DEFAULT 'percentage' CHECK (global_fee_type IN ('percentage', 'fixed')),
  global_fee_paid_by TEXT NOT NULL DEFAULT 'client' CHECK (global_fee_paid_by IN ('client', 'provider', 'split')),

  -- Frais de retrait
  withdrawal_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 2.50,

  -- Frais minimum
  min_fee_cents INTEGER NOT NULL DEFAULT 50,

  -- Frais par catégorie (JSONB: { category_id: fee_percentage })
  fee_by_category JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Frais par pays (JSONB: { country_code: fee_percentage })
  fee_by_location JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Frais par type de localisation (JSONB: { location_type: fee_percentage })
  -- location_type peut être: "remote", "onsite", "hybrid"
  fee_by_location_type JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte pour s'assurer qu'il n'y a qu'une seule ligne de paramètres
  CONSTRAINT single_row_platform_settings CHECK (id = 1)
);

-- Créer un index sur les colonnes JSONB pour les recherches
CREATE INDEX IF NOT EXISTS idx_platform_settings_fee_by_category ON platform_settings USING GIN (fee_by_category);
CREATE INDEX IF NOT EXISTS idx_platform_settings_fee_by_location ON platform_settings USING GIN (fee_by_location);
CREATE INDEX IF NOT EXISTS idx_platform_settings_fee_by_location_type ON platform_settings USING GIN (fee_by_location_type);

-- Insérer les paramètres par défaut s'ils n'existent pas
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

-- Commentaires
COMMENT ON TABLE platform_settings IS 'Paramètres globaux de la plateforme pour la gestion des frais et commissions';
COMMENT ON COLUMN platform_settings.global_fee_percentage IS 'Pourcentage de commission global par défaut (ex: 5.00 pour 5%)';
COMMENT ON COLUMN platform_settings.global_fee_type IS 'Type de frais: percentage ou fixed';
COMMENT ON COLUMN platform_settings.global_fee_paid_by IS 'Qui paie les frais: client, provider, ou split';
COMMENT ON COLUMN platform_settings.withdrawal_fee_percentage IS 'Pourcentage de frais sur les retraits (ex: 2.50 pour 2.5%)';
COMMENT ON COLUMN platform_settings.min_fee_cents IS 'Frais minimum en centimes (ex: 50 pour 0.50€)';
COMMENT ON COLUMN platform_settings.fee_by_category IS 'Frais personnalisés par catégorie au format JSON: {"category_id": fee_percentage}';
COMMENT ON COLUMN platform_settings.fee_by_location IS 'Frais personnalisés par pays au format JSON: {"FR": fee_percentage}';
COMMENT ON COLUMN platform_settings.fee_by_location_type IS 'Frais personnalisés par type de localisation au format JSON: {"remote": fee_percentage, "onsite": fee_percentage, "hybrid": fee_percentage}';
