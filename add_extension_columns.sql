-- Migration to add delay request (extension) support to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS extension_requested_days INTEGER,
ADD COLUMN IF NOT EXISTS extension_reason TEXT,
ADD COLUMN IF NOT EXISTS extension_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS extension_requested_at TIMESTAMP WITH TIME ZONE;

-- Add comment to clarify status values
COMMENT ON COLUMN public.orders.extension_status IS 'none, pending, approved, rejected';
