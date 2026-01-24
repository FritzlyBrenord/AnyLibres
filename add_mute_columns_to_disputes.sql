-- Add session control columns to disputes table
ALTER TABLE public.disputes
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_client_muted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_provider_muted BOOLEAN DEFAULT FALSE;

-- Optional: Add a trigger to notify realtime on any update to disputes
-- This is usually automatic for tables with 'REPLICA IDENTITY FULL' or configured for realtime.
