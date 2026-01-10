-- =====================================================
-- TABLE: order_revisions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  delivery_id UUID,
  revision_number INTEGER NOT NULL DEFAULT 1,
  requested_by UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT order_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT order_revisions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_revisions_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.order_deliveries(id) ON DELETE SET NULL,
  CONSTRAINT order_revisions_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_revisions_order_id ON public.order_revisions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_revisions_status ON public.order_revisions(status);

ALTER TABLE public.order_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view revisions" ON public.order_revisions;
CREATE POLICY "Users can view revisions"
  ON public.order_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_revisions.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can request revisions" ON public.order_revisions;
CREATE POLICY "Clients can request revisions"
  ON public.order_revisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_revisions.order_id
      AND orders.client_id = auth.uid()
    )
  );