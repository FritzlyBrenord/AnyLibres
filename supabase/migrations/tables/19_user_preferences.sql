-- =====================================================
-- TABLE: user_preferences
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  behavioral_profile TEXT,
  search_patterns JSONB DEFAULT '{}',
  frequent_keywords JSONB DEFAULT '[]',
  favorite_providers JSONB DEFAULT '[]',
  favorite_categories JSONB DEFAULT '[]',
  preferred_currency TEXT DEFAULT 'EUR',
  preferred_price_min INTEGER,
  preferred_price_max INTEGER,
  engagement_score NUMERIC DEFAULT 0.0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);