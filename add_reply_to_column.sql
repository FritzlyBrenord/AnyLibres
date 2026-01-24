-- Add reply_to_id column to mediation_messages table
ALTER TABLE public.mediation_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.mediation_messages(id) ON DELETE SET NULL;

-- Index for better performance when querying replies
CREATE INDEX IF NOT EXISTS idx_mediation_messages_reply_to_id ON public.mediation_messages(reply_to_id);
