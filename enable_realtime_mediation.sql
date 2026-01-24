-- Enable Realtime for mediation_messages table
-- This allows the frontend to receive new messages instantly via websockets

BEGIN;
  -- Check if publication exists, usually 'supabase_realtime' is default
  -- Add the table to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.mediation_messages;
COMMIT;
