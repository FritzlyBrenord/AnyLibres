-- =====================================================
-- TABLE: promotions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  service_id UUID,
  description JSONB,
  discount_percent NUMERIC NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT promotions_pkey PRIMARY KEY (id),
  CONSTRAINT promotions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE
);