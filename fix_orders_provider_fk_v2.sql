-- Remove incorrect constraint if it exists (from previous attempt)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_provider_id_profiles_fkey;

-- Add correct foreign key for provider_id in orders table pointing to providers table
ALTER TABLE public.orders
ADD CONSTRAINT orders_provider_id_fkey
FOREIGN KEY (provider_id)
REFERENCES public.providers (id);
