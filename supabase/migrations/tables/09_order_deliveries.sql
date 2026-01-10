-- =====================================================
-- TABLE: order_deliveries
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  delivery_number INTEGER NOT NULL DEFAULT 1,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size_bytes BIGINT,
  external_link TEXT,
  message TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT order_deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT order_deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_deliveries_file_size_check CHECK (file_size_bytes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_deliveries_order_id ON public.order_deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_delivered_at ON public.order_deliveries(delivered_at DESC);

ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view deliveries" ON public.order_deliveries;
CREATE POLICY "Users can view deliveries"
  ON public.order_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_deliveries.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Providers can insert deliveries" ON public.order_deliveries;
CREATE POLICY "Providers can insert deliveries"
  ON public.order_deliveries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_deliveries.order_id
      AND orders.provider_id = auth.uid()
    )
  );