-- ============================================================================
-- SCHEMA: Orders V2 - Système de Commandes Complet
-- ============================================================================

-- ============================================================================
-- TABLE: orders
-- ============================================================================

-- Supprimer la table si elle existe (pour recréer proprement)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  total_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT NULL,
  message TEXT NULL,
  delivery_deadline TIMESTAMPTZ NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,

  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Pas de FK sur provider_id car il peut référencer providers.id au lieu de auth.users.id
  CONSTRAINT orders_total_cents_check CHECK (total_cents >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.orders USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON public.orders USING btree (provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders USING btree (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders USING btree (created_at DESC);

-- Trigger pour update timestamp
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: order_items
-- ============================================================================

CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  service_id UUID NOT NULL,
  title TEXT NOT NULL,
  unit_price_cents BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal_cents BIGINT NOT NULL,
  selected_extras JSONB NULL DEFAULT '[]'::jsonb,

  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT,
  CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT order_items_subtotal_cents_check CHECK (subtotal_cents >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service ON public.order_items USING btree (service_id);

-- ============================================================================
-- ENUMS - Utilisation de TEXT avec CHECK constraints
-- ============================================================================

-- Les statuts sont gérés en TEXT pour plus de flexibilité
-- Valeurs possibles pour status:
--   'pending', 'payment_processing', 'paid', 'in_progress', 'in_review',
--   'revision_requested', 'completed', 'cancelled', 'refunded'

-- Valeurs possibles pour payment_status:
--   'pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'

-- Valeurs possibles pour currency:
--   'USD', 'EUR', 'GBP', 'CAD'

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Orders Policies
CREATE POLICY "Users can view their own orders as client"
  ON public.orders FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Users can view orders where they are provider"
  ON public.orders FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Users can create orders as client"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their pending orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = client_id AND status = 'pending')
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Providers can update order status"
  ON public.orders FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Order Items Policies
CREATE POLICY "Users can view order items of their orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert order items for their orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.client_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function pour calculer le total d'une commande
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_total BIGINT;
BEGIN
  SELECT COALESCE(SUM(subtotal_cents), 0)
  INTO v_total
  FROM order_items
  WHERE order_id = p_order_id;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le total après insertion/update d'items
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET total_cents = calculate_order_total(NEW.order_id),
      updated_at = NOW()
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_total_on_item_change
AFTER INSERT OR UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Vous pouvez décommenter pour tester:
/*
INSERT INTO orders (client_id, provider_id, total_cents, currency, message)
VALUES (
  (SELECT user_id FROM profiles LIMIT 1),
  (SELECT user_id FROM profiles WHERE role = 'provider' LIMIT 1),
  0,
  'EUR',
  'Test order from SQL'
) RETURNING *;
*/