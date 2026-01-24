-- Add is_muted column to mediation_presence table
-- This allows the admin to silence specific participants
ALTER TABLE public.mediation_presence
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;
