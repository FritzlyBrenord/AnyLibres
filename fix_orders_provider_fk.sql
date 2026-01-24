-- Add foreign key for provider_id in orders table pointing to profiles
-- This allows Supabase to join orders with profiles to get provider details
ALTER TABLE public.orders
ADD CONSTRAINT orders_provider_id_profiles_fkey
FOREIGN KEY (provider_id)
REFERENCES public.profiles (user_id);

-- Ensure client FK is strictly valid if not already
-- (The user schema showed it as NOT VALID, which is usually fine for existing rows but good to validate if possible)
-- ALTER TABLE public.orders VALIDATE CONSTRAINT orders_client_id_profiles_fkey;
