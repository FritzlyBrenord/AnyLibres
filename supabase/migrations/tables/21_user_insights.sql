-- =====================================================
-- TABLE: user_insights
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  chart_type TEXT,
  chart_data JSONB,
  insight_data JSONB,
  suggested_action TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_insights_pkey PRIMARY KEY (id)
);