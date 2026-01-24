-- ============================================
-- SYSTÈME DE REMBOURSEMENT - TABLE REFUNDS
-- ============================================
-- À exécuter AVANT CREATE_CLIENT_BALANCE_TABLES.sql

CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  order_id uuid NOT NULL,
  client_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'EUR'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  reason text NOT NULL,
  reason_details text NULL,
  admin_notes text NULL,
  refund_method text NULL,
  refund_reference text NULL,
  refunded_at timestamp with time zone NULL,
  metadata jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CHECK (amount_cents > 0),
  CHECK (
    status = ANY (
      array[
        'pending'::text,
        'approved'::text,
        'rejected'::text,
        'processing'::text,
        'completed'::text,
        'failed'::text,
        'cancelled'::text
      ]
    )
  )
) TABLESPACE pg_default;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refunds_order ON public.refunds USING btree (order_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_refunds_client ON public.refunds USING btree (client_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_refunds_provider ON public.refunds USING btree (provider_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_refunds_created ON public.refunds USING btree (created_at DESC) TABLESPACE pg_default;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trg_refunds_updated_at ON refunds;
CREATE TRIGGER trg_refunds_updated_at
BEFORE UPDATE ON refunds
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- ============================================
-- FIN DU SCRIPT REFUNDS
-- ============================================
