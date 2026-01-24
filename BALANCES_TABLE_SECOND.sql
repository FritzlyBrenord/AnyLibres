-- ============================================
-- TABLES CLIENT_BALANCE, ADMIN_BALANCE, TRANSACTIONS
-- ============================================
-- À exécuter APRÈS REFUNDS_TABLE_FIRST.sql

-- 1. TABLE CLIENT_BALANCE
CREATE TABLE IF NOT EXISTS public.client_balance (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  client_id uuid NOT NULL,
  available_cents bigint NOT NULL DEFAULT 0,
  pending_withdrawal_cents bigint NOT NULL DEFAULT 0,
  withdrawn_cents bigint NOT NULL DEFAULT 0,
  total_received_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR'::text,
  preferred_payment_method text NULL,
  payment_details jsonb NULL,
  last_withdrawal_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (client_id),
  FOREIGN KEY (client_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CHECK (available_cents >= 0),
  CHECK (pending_withdrawal_cents >= 0),
  CHECK (withdrawn_cents >= 0),
  CHECK (total_received_cents >= 0)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_client_balance_client ON public.client_balance USING btree (client_id) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS trg_client_balance_updated_at ON client_balance;
CREATE TRIGGER trg_client_balance_updated_at
BEFORE UPDATE ON client_balance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- 2. TABLE ADMIN_BALANCE
CREATE TABLE IF NOT EXISTS public.admin_balance (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  admin_id uuid NOT NULL,
  available_cents bigint NOT NULL DEFAULT 0,
  total_donated_cents bigint NOT NULL DEFAULT 0,
  total_refunded_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR'::text,
  metadata jsonb NULL,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (admin_id),
  FOREIGN KEY (admin_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CHECK (available_cents >= 0),
  CHECK (total_donated_cents >= 0),
  CHECK (total_refunded_cents >= 0)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_balance_admin ON public.admin_balance USING btree (admin_id) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS trg_admin_balance_updated_at ON admin_balance;
CREATE TRIGGER trg_admin_balance_updated_at
BEFORE UPDATE ON admin_balance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- 3. TABLE TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  transaction_type text NOT NULL,
  from_user_id uuid NULL,
  to_user_id uuid NOT NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'EUR'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  description text NULL,
  related_refund_id uuid NULL,
  related_order_id uuid NULL,
  payment_method text NULL,
  payment_reference text NULL,
  metadata jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (from_user_id) REFERENCES auth.users (id) ON DELETE SET NULL,
  FOREIGN KEY (to_user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  FOREIGN KEY (related_refund_id) REFERENCES refunds (id) ON DELETE SET NULL,
  FOREIGN KEY (related_order_id) REFERENCES orders (id) ON DELETE SET NULL,
  CHECK (amount_cents > 0),
  CHECK (
    transaction_type = ANY (
      array[
        'refund'::text,
        'admin_donation'::text,
        'withdrawal'::text,
        'manual_adjustment'::text
      ]
    )
  ),
  CHECK (
    status = ANY (
      array[
        'pending'::text,
        'processing'::text,
        'completed'::text,
        'failed'::text,
        'cancelled'::text
      ]
    )
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON public.transactions USING btree (from_user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON public.transactions USING btree (to_user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions USING btree (transaction_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transactions_refund ON public.transactions USING btree (related_refund_id) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- ============================================
-- FONCTION UTILITAIRE - Transfer Money
-- ============================================
CREATE OR REPLACE FUNCTION transfer_money(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_amount_cents bigint,
  p_transaction_type text,
  p_description text,
  p_refund_id uuid DEFAULT NULL
)
RETURNS TABLE (success boolean, message text, transaction_id uuid) AS $$
DECLARE
  v_transaction_id uuid;
  v_from_balance bigint;
BEGIN
  -- Valider le montant
  IF p_amount_cents <= 0 THEN
    RETURN QUERY SELECT false, 'Amount must be greater than 0', NULL::uuid;
    RETURN;
  END IF;

  -- Vérifier le solde si from_user_id existe
  IF p_from_user_id IS NOT NULL THEN
    SELECT available_cents INTO v_from_balance
    FROM client_balance WHERE client_id = p_from_user_id;
    
    IF v_from_balance IS NULL OR v_from_balance < p_amount_cents THEN
      RETURN QUERY SELECT false, 'Insufficient balance', NULL::uuid;
      RETURN;
    END IF;
  END IF;

  -- Créer la transaction
  INSERT INTO transactions (
    transaction_type,
    from_user_id,
    to_user_id,
    amount_cents,
    status,
    description,
    related_refund_id
  ) VALUES (
    p_transaction_type,
    p_from_user_id,
    p_to_user_id,
    p_amount_cents,
    'completed',
    p_description,
    p_refund_id
  ) RETURNING id INTO v_transaction_id;

  -- Déduire du compte de source si applicable
  IF p_from_user_id IS NOT NULL THEN
    UPDATE client_balance
    SET available_cents = available_cents - p_amount_cents
    WHERE client_id = p_from_user_id;
  END IF;

  -- Ajouter au compte de destination
  UPDATE client_balance
  SET available_cents = available_cents + p_amount_cents,
      total_received_cents = total_received_cents + p_amount_cents
  WHERE client_id = p_to_user_id;

  RETURN QUERY SELECT true, 'Transfer completed successfully', v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIN DU SCRIPT BALANCES ET TRANSACTIONS
-- ============================================
