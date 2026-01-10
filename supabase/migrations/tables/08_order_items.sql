-- =====================================================
-- TABLE: order_items
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  service_id UUID NOT NULL,
  title TEXT NOT NULL,
  unit_price_cents BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal_cents BIGINT NOT NULL,
  selected_extras JSONB DEFAULT '[]',

  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT,
  CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT order_items_subtotal_cents_check CHECK (subtotal_cents >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
CREATE POLICY "Users can view order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );