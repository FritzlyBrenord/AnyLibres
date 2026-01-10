-- =====================================================
-- TABLE: messages
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  text TEXT,
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;