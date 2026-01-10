-- =====================================================
-- TABLE: search_history
-- =====================================================

CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  client_id UUID,
  query TEXT,
  filters JSONB,
  results_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT search_history_pkey PRIMARY KEY (id)
);