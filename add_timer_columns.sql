-- Add columns for mediation timer
ALTER TABLE public.disputes
ADD COLUMN IF NOT EXISTS mediation_session_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;
