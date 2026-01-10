-- =====================================================
-- TABLE: orders (VERSION COMPLÈTE AVEC PAIEMENT)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  total_cents BIGINT NOT NULL DEFAULT 0,
  fees_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_details JSONB,
  payment_intent_id TEXT,
  message TEXT,
  delivery_deadline TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT orders_total_cents_check CHECK (total_cents >= 0),
  CONSTRAINT orders_fees_cents_check CHECK (fees_cents >= 0)
);

COMMENT ON COLUMN public.orders.status IS 'pending | confirmed | in_progress | delivered | revision_requested | completed | cancelled | refunded';
COMMENT ON COLUMN public.orders.payment_status IS 'pending | processing | succeeded | failed | refunded | cancelled';
COMMENT ON COLUMN public.orders.payment_method IS 'card | paypal | bank';
COMMENT ON COLUMN public.orders.payment_details IS 'Détails sécurisés du paiement';

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON public.orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (client_id = auth.uid() OR provider_id = auth.uid());