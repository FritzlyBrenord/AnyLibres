-- ============================================================================
-- Table: currencies - Système de gestion des devises
-- ============================================================================

-- Table des devises supportées par la plateforme
CREATE TABLE IF NOT EXISTS currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informations de base
  code TEXT NOT NULL UNIQUE, -- ISO 4217: USD, EUR, HTG, CLP, DOP, etc.
  name TEXT NOT NULL, -- Dollar américain, Euro, Gourde haïtienne, etc.
  symbol TEXT NOT NULL, -- $, €, G, etc.

  -- Configuration
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Taux de conversion
  conversion_mode TEXT NOT NULL DEFAULT 'auto' CHECK (conversion_mode IN ('auto', 'manual')),
  manual_rate_to_default DECIMAL(18, 6), -- Taux manuel vers la devise par défaut
  auto_rate_to_default DECIMAL(18, 6), -- Taux automatique (mis à jour via API)
  last_rate_update TIMESTAMPTZ, -- Dernière mise à jour du taux automatique

  -- Frais de conversion
  conversion_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- Ex: 2.5 pour 2.5%

  -- Formatage
  decimal_places INTEGER NOT NULL DEFAULT 2,
  position TEXT NOT NULL DEFAULT 'before' CHECK (position IN ('before', 'after')), -- Position du symbole

  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte: une seule devise par défaut
  CONSTRAINT only_one_default CHECK (
    is_default = FALSE OR (
      SELECT COUNT(*) FROM currencies WHERE is_default = TRUE
    ) <= 1
  )
);

-- Index
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_is_default ON currencies(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_currencies_is_active ON currencies(is_active) WHERE is_active = TRUE;

-- Table pour l'historique des taux de change
CREATE TABLE IF NOT EXISTS exchange_rates_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  from_currency_code TEXT NOT NULL,
  to_currency_code TEXT NOT NULL,
  rate DECIMAL(18, 6) NOT NULL,
  source TEXT NOT NULL, -- 'api', 'manual'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (from_currency_code) REFERENCES currencies(code) ON DELETE CASCADE,
  FOREIGN KEY (to_currency_code) REFERENCES currencies(code) ON DELETE CASCADE
);

-- Index pour l'historique
CREATE INDEX IF NOT EXISTS idx_exchange_rates_history_from_to
  ON exchange_rates_history(from_currency_code, to_currency_code, created_at DESC);

-- Insérer les devises par défaut
INSERT INTO currencies (code, name, symbol, is_default, is_active, conversion_mode, decimal_places, position) VALUES
  ('USD', 'Dollar américain', '$', TRUE, TRUE, 'auto', 2, 'before'),
  ('EUR', 'Euro', '€', FALSE, TRUE, 'auto', 2, 'before'),
  ('HTG', 'Gourde haïtienne', 'G', FALSE, TRUE, 'auto', 2, 'before'),
  ('CAD', 'Dollar canadien', 'CA$', FALSE, TRUE, 'auto', 2, 'before'),
  ('GBP', 'Livre sterling', '£', FALSE, TRUE, 'auto', 2, 'before'),
  ('CLP', 'Peso chilien', 'CLP$', FALSE, TRUE, 'auto', 0, 'before'),
  ('DOP', 'Peso dominicain', 'RD$', FALSE, TRUE, 'auto', 2, 'before')
ON CONFLICT (code) DO NOTHING;

-- Commentaires
COMMENT ON TABLE currencies IS 'Devises supportées par la plateforme avec taux de conversion';
COMMENT ON COLUMN currencies.code IS 'Code ISO 4217 de la devise (USD, EUR, HTG, etc.)';
COMMENT ON COLUMN currencies.conversion_mode IS 'Mode de conversion: auto (API) ou manual (défini par admin)';
COMMENT ON COLUMN currencies.manual_rate_to_default IS 'Taux de conversion manuel vers la devise par défaut';
COMMENT ON COLUMN currencies.auto_rate_to_default IS 'Taux de conversion automatique (mis à jour via API)';
COMMENT ON COLUMN currencies.conversion_fee_percentage IS 'Frais de conversion en pourcentage (ex: 2.5 pour 2.5%)';

COMMENT ON TABLE exchange_rates_history IS 'Historique des taux de change pour analyse';
