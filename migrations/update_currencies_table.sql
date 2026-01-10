-- ============================================================================
-- Migration: Mise à jour de la table currencies
-- Ajouter les colonnes manquantes pour la gestion avancée des devises
-- ============================================================================

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
  -- is_default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE currencies ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  -- is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE currencies ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  -- conversion_mode
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'conversion_mode'
  ) THEN
    ALTER TABLE currencies ADD COLUMN conversion_mode TEXT NOT NULL DEFAULT 'auto'
      CHECK (conversion_mode IN ('auto', 'manual'));
  END IF;

  -- manual_rate_to_default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'manual_rate_to_default'
  ) THEN
    ALTER TABLE currencies ADD COLUMN manual_rate_to_default DECIMAL(18, 6);
  END IF;

  -- auto_rate_to_default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'auto_rate_to_default'
  ) THEN
    ALTER TABLE currencies ADD COLUMN auto_rate_to_default DECIMAL(18, 6);
  END IF;

  -- last_rate_update
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'last_rate_update'
  ) THEN
    ALTER TABLE currencies ADD COLUMN last_rate_update TIMESTAMPTZ;
  END IF;

  -- conversion_fee_percentage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'conversion_fee_percentage'
  ) THEN
    ALTER TABLE currencies ADD COLUMN conversion_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00;
  END IF;

  -- decimal_places
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'decimal_places'
  ) THEN
    ALTER TABLE currencies ADD COLUMN decimal_places INTEGER NOT NULL DEFAULT 2;
  END IF;

  -- position
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'position'
  ) THEN
    ALTER TABLE currencies ADD COLUMN position TEXT NOT NULL DEFAULT 'before'
      CHECK (position IN ('before', 'after'));
  END IF;

  RAISE NOTICE 'Columns added successfully';
END $$;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_is_default ON currencies(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_currencies_is_active ON currencies(is_active) WHERE is_active = TRUE;

-- Définir USD comme devise par défaut
UPDATE currencies SET is_default = TRUE WHERE code = 'USD';

-- Activer toutes les devises existantes
UPDATE currencies SET is_active = TRUE WHERE is_active IS NULL OR is_active = FALSE;

-- Créer la table exchange_rates_history si elle n'existe pas
CREATE TABLE IF NOT EXISTS exchange_rates_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency_code TEXT NOT NULL,
  to_currency_code TEXT NOT NULL,
  rate DECIMAL(18, 6) NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour l'historique
CREATE INDEX IF NOT EXISTS idx_exchange_rates_history_from_to
  ON exchange_rates_history(from_currency_code, to_currency_code, created_at DESC);

-- Ajouter les devises manquantes
INSERT INTO currencies (code, name, symbol, is_default, is_active, conversion_mode, decimal_places, position)
SELECT * FROM (VALUES
  ('HTG', 'Gourde haïtienne', 'G', FALSE, TRUE, 'auto', 2, 'before'),
  ('CLP', 'Peso chilien', 'CLP$', FALSE, TRUE, 'auto', 0, 'before'),
  ('DOP', 'Peso dominicain', 'RD$', FALSE, TRUE, 'auto', 2, 'before')
) AS v(code, name, symbol, is_default, is_active, conversion_mode, decimal_places, position)
WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE currencies.code = v.code);

-- Commentaires
COMMENT ON COLUMN currencies.conversion_mode IS 'Mode de conversion: auto (API) ou manual (défini par admin)';
COMMENT ON COLUMN currencies.manual_rate_to_default IS 'Taux de conversion manuel vers la devise par défaut';
COMMENT ON COLUMN currencies.auto_rate_to_default IS 'Taux de conversion automatique (mis à jour via API)';
COMMENT ON COLUMN currencies.conversion_fee_percentage IS 'Frais de conversion en pourcentage (ex: 2.5 pour 2.5%)';

-- Vérifier le résultat
SELECT code, name, symbol, is_default, is_active, conversion_mode
FROM currencies
ORDER BY is_default DESC, code;
