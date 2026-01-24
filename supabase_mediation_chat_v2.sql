-- 1. Create Mediation Messages Table
CREATE TABLE IF NOT EXISTS public.mediation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id), -- Link to auth user directly
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'provider', 'admin')),
  content TEXT, -- Text message or file description
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'voice')),
  media_url TEXT, -- Path in storage bucket
  media_name TEXT, -- Original filename
  media_size BIGINT, -- Size in bytes
  media_duration INTEGER, -- Duration in seconds (for audio/video)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mediation_messages_dispute ON public.mediation_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_mediation_messages_created ON public.mediation_messages(created_at);

-- 3. Enable RLS
ALTER TABLE public.mediation_messages ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Mediation Messages

-- Policy: View Messages
CREATE POLICY "Participants can view messages" ON public.mediation_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.disputes d
    JOIN public.orders o ON d.order_id = o.id
    WHERE d.id = mediation_messages.dispute_id
    AND (
        o.client_id = auth.uid() 
        OR 
        -- Correct Provider Check: Order Provider ID matches a provider linked to the auth user's profile
        o.provider_id IN (
            SELECT p.id FROM public.providers p 
            JOIN public.profiles pr ON p.profile_id = pr.id 
            WHERE pr.user_id = auth.uid()
        )
    )
  )
  OR 
  -- Admin check
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Insert Messages
CREATE POLICY "Participants can send messages" ON public.mediation_messages
FOR INSERT WITH CHECK (
  -- User must be the sender
  auth.uid() = sender_id
  AND
  (
      -- Is Client or Provider of the dispute
      EXISTS (
        SELECT 1 FROM public.disputes d
        JOIN public.orders o ON d.order_id = o.id
        WHERE d.id = dispute_id
        AND (
            o.client_id = auth.uid() 
            OR 
            o.provider_id IN (
                SELECT p.id FROM public.providers p 
                JOIN public.profiles pr ON p.profile_id = pr.id 
                WHERE pr.user_id = auth.uid()
            )
        )
      )
      OR 
      -- Is Admin
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
  )
);

-- 5. Storage Bucket Configuration (Instructions to run in Supabase SQL Editor if Storage extension enabled)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mediation-attachments', 'mediation-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies

-- View Files: Participants
CREATE POLICY "Participants can view mediation files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'mediation-attachments'
  AND (
    EXISTS (
        SELECT 1 FROM public.disputes d
        JOIN public.orders o ON d.order_id = o.id
        WHERE d.id::text = (storage.foldername(name))[1] -- First folder is dispute_id
        AND (
            o.client_id = auth.uid() 
            OR 
            o.provider_id IN (
                SELECT p.id FROM public.providers p 
                JOIN public.profiles pr ON p.profile_id = pr.id 
                WHERE pr.user_id = auth.uid()
            )
        )
    )
    OR
    -- Admin
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

-- Upload Files: Participants
CREATE POLICY "Participants can upload mediation files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'mediation-attachments'
  AND (
     EXISTS (
        SELECT 1 FROM public.disputes d
        JOIN public.orders o ON d.order_id = o.id
        WHERE d.id::text = (storage.foldername(name))[1]
        AND (
            o.client_id = auth.uid() 
            OR 
            o.provider_id IN (
                SELECT p.id FROM public.providers p 
                JOIN public.profiles pr ON p.profile_id = pr.id 
                WHERE pr.user_id = auth.uid()
            )
        )
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  )
);
