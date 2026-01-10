-- =====================================================
-- TABLE: reviews
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID,
  service_id UUID NOT NULL,
  client_id UUID NOT NULL,
  provider_id UUID,
  rating SMALLINT NOT NULL,
  title TEXT,
  comment TEXT,
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
  CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON public.reviews(service_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;