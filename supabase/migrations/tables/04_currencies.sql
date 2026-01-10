-- =====================================================
-- TABLE: currencies
-- =====================================================

CREATE TABLE IF NOT EXISTS public.currencies (
  code currency_code NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  rate_to_usd NUMERIC NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT currencies_pkey PRIMARY KEY (code)
);

-- Seed data
INSERT INTO public.currencies (code, symbol, name, rate_to_usd) VALUES
  ('USD', '$', 'US Dollar', 1.0),
  ('EUR', '€', 'Euro', 0.92),
  ('GBP', '£', 'British Pound', 0.79),
  ('CAD', 'CA$', 'Canadian Dollar', 1.36)
ON CONFLICT (code) DO NOTHING;