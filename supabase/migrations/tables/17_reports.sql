-- =====================================================
-- TABLE: reports
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  reported_type TEXT NOT NULL,
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reports_pkey PRIMARY KEY (id)
);