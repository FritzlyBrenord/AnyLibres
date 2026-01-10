-- =====================================================
-- MIGRATION: Add Order Deliveries and Revisions Tables
-- Date: 2025-01-26
-- Description: Tables pour système freelance (livraison de fichiers et révisions)
-- =====================================================

-- =====================================================
-- TABLE: order_deliveries
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  delivery_number INTEGER NOT NULL DEFAULT 1,
  file_url TEXT NULL,
  file_name TEXT NULL,
  file_type TEXT NULL,
  file_size_bytes BIGINT NULL,
  external_link TEXT NULL,
  message TEXT NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT order_deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT order_deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_deliveries_file_size_check CHECK (file_size_bytes >= 0)
);

-- Index pour order_deliveries
CREATE INDEX IF NOT EXISTS idx_order_deliveries_order_id ON public.order_deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_delivered_at ON public.order_deliveries(delivered_at DESC);

-- =====================================================
-- TABLE: order_revisions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  delivery_id UUID NULL,
  revision_number INTEGER NOT NULL DEFAULT 1,
  requested_by UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,

  CONSTRAINT order_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT order_revisions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_revisions_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.order_deliveries(id) ON DELETE SET NULL,
  CONSTRAINT order_revisions_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index pour order_revisions
CREATE INDEX IF NOT EXISTS idx_order_revisions_order_id ON public.order_revisions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_revisions_status ON public.order_revisions(status);

-- =====================================================
-- COMMENT: Mettre à jour les statuts possibles
-- =====================================================
COMMENT ON COLUMN public.orders.status IS 'pending | paid | in_progress | delivered | revision_requested | completed | cancelled | refunded';

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Activer RLS
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_revisions ENABLE ROW LEVEL SECURITY;

-- Policies pour order_deliveries
DROP POLICY IF EXISTS "Users can view deliveries of their orders" ON public.order_deliveries;
CREATE POLICY "Users can view deliveries of their orders"
  ON public.order_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_deliveries.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Providers can insert deliveries for their orders" ON public.order_deliveries;
CREATE POLICY "Providers can insert deliveries for their orders"
  ON public.order_deliveries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_deliveries.order_id
      AND orders.provider_id = auth.uid()
    )
  );

-- Policies pour order_revisions
DROP POLICY IF EXISTS "Users can view revisions of their orders" ON public.order_revisions;
CREATE POLICY "Users can view revisions of their orders"
  ON public.order_revisions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_revisions.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can request revisions for their orders" ON public.order_revisions;
CREATE POLICY "Clients can request revisions for their orders"
  ON public.order_revisions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_revisions.order_id
      AND orders.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Providers can update revision status" ON public.order_revisions;
CREATE POLICY "Providers can update revision status"
  ON public.order_revisions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_revisions.order_id
      AND orders.provider_id = auth.uid()
    )
  );

-- =====================================================
-- FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour le statut lors de livraison
CREATE OR REPLACE FUNCTION update_order_status_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders
  SET
    status = 'delivered',
    updated_at = NOW()
  WHERE id = NEW.order_id
  AND status = 'in_progress';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur insertion de livraison
DROP TRIGGER IF EXISTS trigger_update_order_status_on_delivery ON public.order_deliveries;
CREATE TRIGGER trigger_update_order_status_on_delivery
  AFTER INSERT ON public.order_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_delivery();

-- Fonction pour mettre à jour le statut lors de révision
CREATE OR REPLACE FUNCTION update_order_status_on_revision()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders
  SET
    status = 'revision_requested',
    updated_at = NOW()
  WHERE id = NEW.order_id
  AND status = 'delivered';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur insertion de révision
DROP TRIGGER IF EXISTS trigger_update_order_status_on_revision ON public.order_revisions;
CREATE TRIGGER trigger_update_order_status_on_revision
  AFTER INSERT ON public.order_revisions
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_revision();

-- =====================================================
-- NOTES
-- =====================================================
-- Pour créer le bucket Storage, exécuter dans le Dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('order-deliveries', 'order-deliveries', false);