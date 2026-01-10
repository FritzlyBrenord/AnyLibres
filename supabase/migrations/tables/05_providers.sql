-- =====================================================
-- TABLE: providers
-- =====================================================

CREATE TABLE IF NOT EXISTS public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  company_name TEXT,
  profession TEXT,
  tagline TEXT,
  about TEXT,
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages JSONB DEFAULT '[{"code": "fr", "level": "native"}]',
  portfolio JSONB DEFAULT '[]',
  location JSONB DEFAULT '{}',
  availability TEXT DEFAULT 'available',
  verification_status TEXT DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  experience_years INTEGER,
  starting_price NUMERIC,
  hourly_rate NUMERIC,
  response_time_hours INTEGER,
  completed_orders_count INTEGER DEFAULT 0,
  canceled_orders_count INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT providers_pkey PRIMARY KEY (id),
  CONSTRAINT providers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_providers_profile_id ON public.providers(profile_id);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;