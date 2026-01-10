-- =====================================================
-- TABLE: favorites
-- =====================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  service_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT favorites_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
  CONSTRAINT favorites_unique UNIQUE (client_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_client_id ON public.favorites(client_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;