-- =====================================================
-- TABLE: categories
-- =====================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  name JSONB NOT NULL,
  description JSONB,
  icon TEXT,
  image_url TEXT,
  services_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_key_key UNIQUE (key)
);