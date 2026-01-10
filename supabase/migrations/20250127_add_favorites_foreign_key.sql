-- Add missing foreign key constraint for favorites.client_id
-- This allows Supabase to recognize the relationship for join queries

ALTER TABLE public.favorites
DROP CONSTRAINT IF EXISTS favorites_client_id_fkey;

ALTER TABLE public.favorites
ADD CONSTRAINT favorites_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;