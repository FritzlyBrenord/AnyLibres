-- =====================================================
-- TABLE: notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  title TEXT,
  content TEXT NOT NULL,
  action_url TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;