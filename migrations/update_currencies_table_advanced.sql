-- Migration: Add advanced currency management columns to existing currencies table
-- This script safely adds all necessary columns for the currency management system

-- First, convert the code column from enum to TEXT to allow any currency code
DO $$
BEGIN
  -- Check if code column is of type currency_code enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies'
    AND column_name = 'code'
    AND udt_name = 'currency_code'
  ) THEN
    -- Convert enum to TEXT to allow any currency code
    ALTER TABLE currencies ALTER COLUMN code TYPE TEXT USING code::TEXT;
    RAISE NOTICE 'Converted code column from enum to TEXT for flexibility';
  ELSE
    RAISE NOTICE 'Code column is already TEXT or does not exist';
  END IF;
END $$;

-- Now add the columns to the currencies table
DO $$
BEGIN
  -- Add is_default column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE currencies ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;
    RAISE NOTICE 'Added column: is_default';
  ELSE
    RAISE NOTICE 'Column is_default already exists';
  END IF;

  -- Add is_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE currencies ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    RAISE NOTICE 'Added column: is_active';
  ELSE
    RAISE NOTICE 'Column is_active already exists';
  END IF;

  -- Add conversion_mode column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'conversion_mode'
  ) THEN
    ALTER TABLE currencies ADD COLUMN conversion_mode TEXT NOT NULL DEFAULT 'auto';
    ALTER TABLE currencies ADD CONSTRAINT currencies_conversion_mode_check
      CHECK (conversion_mode IN ('auto', 'manual'));
    RAISE NOTICE 'Added column: conversion_mode';
  ELSE
    RAISE NOTICE 'Column conversion_mode already exists';
  END IF;

  -- Add manual_rate_to_default column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'manual_rate_to_default'
  ) THEN
    ALTER TABLE currencies ADD COLUMN manual_rate_to_default DECIMAL(18, 6);
    RAISE NOTICE 'Added column: manual_rate_to_default';
  ELSE
    RAISE NOTICE 'Column manual_rate_to_default already exists';
  END IF;

  -- Add auto_rate_to_default column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'auto_rate_to_default'
  ) THEN
    ALTER TABLE currencies ADD COLUMN auto_rate_to_default DECIMAL(18, 6);
    RAISE NOTICE 'Added column: auto_rate_to_default';
  ELSE
    RAISE NOTICE 'Column auto_rate_to_default already exists';
  END IF;

  -- Add last_rate_update column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'last_rate_update'
  ) THEN
    ALTER TABLE currencies ADD COLUMN last_rate_update TIMESTAMPTZ;
    RAISE NOTICE 'Added column: last_rate_update';
  ELSE
    RAISE NOTICE 'Column last_rate_update already exists';
  END IF;

  -- Add conversion_fee_percentage column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'conversion_fee_percentage'
  ) THEN
    ALTER TABLE currencies ADD COLUMN conversion_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00;
    RAISE NOTICE 'Added column: conversion_fee_percentage';
  ELSE
    RAISE NOTICE 'Column conversion_fee_percentage already exists';
  END IF;

  -- Add decimal_places column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'decimal_places'
  ) THEN
    ALTER TABLE currencies ADD COLUMN decimal_places INTEGER NOT NULL DEFAULT 2;
    RAISE NOTICE 'Added column: decimal_places';
  ELSE
    RAISE NOTICE 'Column decimal_places already exists';
  END IF;

  -- Add position column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'position'
  ) THEN
    ALTER TABLE currencies ADD COLUMN position TEXT NOT NULL DEFAULT 'before';
    ALTER TABLE currencies ADD CONSTRAINT currencies_position_check
      CHECK (position IN ('before', 'after'));
    RAISE NOTICE 'Added column: position';
  ELSE
    RAISE NOTICE 'Column position already exists';
  END IF;

  -- Add id column if it doesn't exist (needed for some operations)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'id'
  ) THEN
    ALTER TABLE currencies ADD COLUMN id UUID DEFAULT gen_random_uuid();
    RAISE NOTICE 'Added column: id';
  ELSE
    RAISE NOTICE 'Column id already exists';
  END IF;

  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE currencies ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Added column: created_at';
  ELSE
    RAISE NOTICE 'Column created_at already exists';
  END IF;

  RAISE NOTICE 'All columns processed successfully';
END $$;

-- Create indexes (only after columns exist)
CREATE INDEX IF NOT EXISTS idx_currencies_is_default ON currencies(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_currencies_is_active ON currencies(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_currencies_conversion_mode ON currencies(conversion_mode);

-- Migrate existing rate_to_usd to auto_rate_to_default
-- IMPORTANT: rate_to_usd stocke "combien vaut 1 unité de cette devise en USD" (ex: 1 HTG = 0.0076 USD)
-- Mais auto_rate_to_default doit stocker "combien d'unités de cette devise pour 1 USD" (ex: 1 USD = 132 HTG)
-- Donc on doit INVERSER le taux: auto_rate_to_default = 1 / rate_to_usd
UPDATE currencies
SET auto_rate_to_default = CASE
    WHEN rate_to_usd > 0 THEN 1.0 / rate_to_usd
    ELSE rate_to_usd
  END,
    last_rate_update = updated_at
WHERE auto_rate_to_default IS NULL;

-- Set USD as default currency if it exists
UPDATE currencies
SET is_default = TRUE
WHERE code = 'USD' AND NOT EXISTS (
  SELECT 1 FROM currencies WHERE is_default = TRUE
);

-- If USD doesn't exist but other currencies do, set the first one as default
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE is_default = TRUE) THEN
    UPDATE currencies
    SET is_default = TRUE
    WHERE code = (SELECT code FROM currencies ORDER BY code LIMIT 1);
    RAISE NOTICE 'Set first currency as default';
  END IF;
END $$;

-- Add missing currencies if they don't exist
DO $$
BEGIN
  -- USD (devise par défaut)
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'USD') THEN
    INSERT INTO currencies (code, name, symbol, is_default, is_active, conversion_mode, decimal_places, position, rate_to_usd, auto_rate_to_default)
    VALUES ('USD', 'Dollar américain', '$', FALSE, TRUE, 'auto', 2, 'before', 1.0, 1.0);
  END IF;

  -- EUR (1 USD = 0.92 EUR, donc rate_to_usd = 1.087, auto_rate = 0.92)
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'EUR') THEN
    INSERT INTO currencies (code, name, symbol, is_default, is_active, conversion_mode, decimal_places, position, rate_to_usd, auto_rate_to_default)
    VALUES ('EUR', 'Euro', '€', FALSE, TRUE, 'auto', 2, 'before', 1.087, 0.92);
  END IF;

  -- CAD (1 USD = 1.35 CAD)
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'CAD') THEN
    INSERT INTO currencies (code, name, symbol, is_default, is_active, conversion_mode, decimal_places, position, rate_to_usd, auto_rate_to_default)
    VALUES ('CAD', 'Dollar canadien', 'CA$', FALSE, TRUE, 'auto', 2, 'before', 0.74, 1.35);
  END IF;

  -- GBP (1 USD = 0.79 GBP)
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'GBP') THEN
    INSERT INTO currencies (code, name, symbol, is_default, is_active, conversion_mode, decimal_places, position, rate_to_usd, auto_rate_to_default)
    VALUES ('GBP', 'Livre sterling', '£', FALSE, TRUE, 'auto', 2, 'before', 1.27, 0.79);
  END IF;

  -- HTG (1 USD = 132 HTG)
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'HTG') THEN
    INSERT INTO currencies (code, name, symbol, is_default, is_active, conversion_mode, decimal_places, position, rate_to_usd, auto_rate_to_default)
    VALUES ('HTG', 'Gourde haïtienne', 'G', FALSE, TRUE, 'auto', 2, 'before', 0.0076, 132.0);
  END IF;

  -- CLP (1 USD = 950 CLP)
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'CLP') THEN
    INSERT INTO currencies (code, name, symbol, is_default, is_active, conversion_mode, decimal_places, position, rate_to_usd, auto_rate_to_default)
    VALUES ('CLP', 'Peso chilien', 'CLP$', FALSE, TRUE, 'auto', 0, 'before', 0.00105, 950.0);
  END IF;

  -- DOP (1 USD = 58 DOP)
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'DOP') THEN
    INSERT INTO currencies (code, name, symbol, is_default, is_active, conversion_mode, decimal_places, position, rate_to_usd, auto_rate_to_default)
    VALUES ('DOP', 'Peso dominicain', 'RD$', FALSE, TRUE, 'auto', 2, 'before', 0.0172, 58.0);
  END IF;

  RAISE NOTICE 'Missing currencies added';
END $$;

-- Ensure USD is the default
UPDATE currencies SET is_default = FALSE WHERE code != 'USD';
UPDATE currencies SET is_default = TRUE WHERE code = 'USD';

-- Create exchange_rates_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS exchange_rates_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency_code TEXT NOT NULL,
  to_currency_code TEXT NOT NULL,
  rate DECIMAL(18, 6) NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('api', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (from_currency_code) REFERENCES currencies(code) ON DELETE CASCADE,
  FOREIGN KEY (to_currency_code) REFERENCES currencies(code) ON DELETE CASCADE
);

-- Create index on exchange_rates_history
CREATE INDEX IF NOT EXISTS idx_exchange_rates_history_currencies
  ON exchange_rates_history(from_currency_code, to_currency_code);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_history_created_at
  ON exchange_rates_history(created_at DESC);

-- Add comments
COMMENT ON COLUMN currencies.is_default IS 'Indicates if this is the default/base currency for the system';
COMMENT ON COLUMN currencies.is_active IS 'Indicates if this currency is active and available for use';
COMMENT ON COLUMN currencies.conversion_mode IS 'auto: rates fetched from API, manual: admin-defined rates';
COMMENT ON COLUMN currencies.manual_rate_to_default IS 'Admin-defined conversion rate to default currency';
COMMENT ON COLUMN currencies.auto_rate_to_default IS 'API-fetched conversion rate to default currency';
COMMENT ON COLUMN currencies.conversion_fee_percentage IS 'Fee percentage applied to currency conversions';
COMMENT ON COLUMN currencies.decimal_places IS 'Number of decimal places for this currency';
COMMENT ON COLUMN currencies.position IS 'Symbol position: before or after the amount';
COMMENT ON TABLE exchange_rates_history IS 'Historical record of all exchange rate updates';

SELECT 'Migration completed successfully! All columns added to currencies table.' AS status;
