-- =====================================================
-- TABLE: conversations
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  participants UUID[] NOT NULL,
  unread_count JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);