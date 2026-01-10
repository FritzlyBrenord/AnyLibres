-- =====================================================
-- TABLE: user_activity_log
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_data JSONB,
  search_query TEXT,
  filters_applied JSONB,
  duration_seconds INTEGER,
  scroll_depth INTEGER,
  page_url TEXT,
  referrer_url TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_activity_log_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity_log(user_id);