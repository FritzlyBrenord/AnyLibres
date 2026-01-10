-- =====================================================
-- TABLE: ai_recommendations
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_id UUID NOT NULL,
  confidence_score NUMERIC NOT NULL,
  reason_details JSONB,
  recommendation_reason TEXT NOT NULL,
  shown_count INTEGER DEFAULT 0,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id)
);