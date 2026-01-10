-- =====================================================
-- TABLE: services
-- =====================================================

CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  title JSONB NOT NULL,
  description JSONB,
  short_description JSONB,
  base_price_cents BIGINT NOT NULL DEFAULT 0,
  currency currency_code NOT NULL DEFAULT 'USD',
  price_min_cents BIGINT,
  price_max_cents BIGINT,
  delivery_time_days INTEGER,
  revisions_included INTEGER DEFAULT 1,
  max_revisions INTEGER,
  extras JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'published',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  cover_image TEXT,
  categories UUID[] DEFAULT ARRAY[]::UUID[],
  popularity BIGINT DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  reviews_count BIGINT DEFAULT 0,
  views_count BIGINT DEFAULT 0,
  orders_count BIGINT DEFAULT 0,
  cancel_rate NUMERIC DEFAULT 0,
  visibility service_visibility NOT NULL DEFAULT 'public',
  faq JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_services_provider_id ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;