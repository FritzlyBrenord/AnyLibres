-- ============================================================================
-- Tables pour le système de retrait (Withdrawal System)
-- Inspiré de Fiverr - Mode Simulation prêt pour intégration réelle
-- ============================================================================

-- 1. Table des méthodes de paiement des providers
CREATE TABLE IF NOT EXISTS public.provider_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'paypal', 'bank', 'payoneer', 'moncash'
  label TEXT NOT NULL, -- Nom affiché (ex: "PayPal", "BNH", etc.)
  details TEXT NOT NULL, -- Email, IBAN, numéro de téléphone, etc.
  is_default BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NULL, -- Données supplémentaires (titulaire compte, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL, -- Soft delete

  CONSTRAINT provider_payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT provider_payment_methods_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT provider_payment_methods_type_check
    CHECK (type IN ('paypal', 'bank', 'payoneer', 'moncash'))
);

-- Index pour les méthodes de paiement
CREATE INDEX IF NOT EXISTS idx_provider_payment_methods_provider
  ON public.provider_payment_methods USING btree (provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_payment_methods_default
  ON public.provider_payment_methods USING btree (provider_id, is_default)
  WHERE is_default = true;

-- 2. Table des demandes de retrait (Withdrawals)
CREATE TABLE IF NOT EXISTS public.provider_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  payment_method_id UUID NOT NULL,
  amount_cents BIGINT NOT NULL, -- Montant demandé en centimes
  fee_cents BIGINT NOT NULL DEFAULT 0, -- Frais de traitement (2.5% comme Fiverr)
  net_amount_cents BIGINT NOT NULL, -- Montant net = amount - fee
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'

  -- Informations de la méthode de paiement (snapshot au moment du retrait)
  payment_method_type TEXT NOT NULL,
  payment_method_details TEXT NOT NULL,

  -- Traitement
  processed_at TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  failed_at TIMESTAMP WITH TIME ZONE NULL,

  -- Référence externe (pour intégration future avec système de paiement réel)
  external_transaction_id TEXT NULL,
  external_reference TEXT NULL,

  -- Métadonnées et notes
  metadata JSONB NULL,
  notes TEXT NULL, -- Notes admin ou raison d'échec
  admin_notes TEXT NULL, -- Notes internes

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT provider_withdrawals_pkey PRIMARY KEY (id),
  CONSTRAINT provider_withdrawals_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT provider_withdrawals_payment_method_id_fkey
    FOREIGN KEY (payment_method_id) REFERENCES provider_payment_methods(id) ON DELETE RESTRICT,

  -- Contraintes de validation
  CONSTRAINT provider_withdrawals_amount_cents_check
    CHECK (amount_cents > 0),
  CONSTRAINT provider_withdrawals_fee_cents_check
    CHECK (fee_cents >= 0),
  CONSTRAINT provider_withdrawals_net_amount_check
    CHECK (net_amount_cents = (amount_cents - fee_cents)),
  CONSTRAINT provider_withdrawals_net_amount_positive_check
    CHECK (net_amount_cents > 0),
  CONSTRAINT provider_withdrawals_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT provider_withdrawals_payment_method_type_check
    CHECK (payment_method_type IN ('paypal', 'bank', 'payoneer', 'moncash'))
);

-- Index pour les retraits
CREATE INDEX IF NOT EXISTS idx_provider_withdrawals_provider
  ON public.provider_withdrawals USING btree (provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_withdrawals_status
  ON public.provider_withdrawals USING btree (status);

CREATE INDEX IF NOT EXISTS idx_provider_withdrawals_created
  ON public.provider_withdrawals USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_withdrawals_provider_status
  ON public.provider_withdrawals USING btree (provider_id, status);

-- 3. Triggers pour updated_at
CREATE TRIGGER trg_provider_payment_methods_updated_at
  BEFORE UPDATE ON provider_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_provider_withdrawals_updated_at
  BEFORE UPDATE ON provider_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS (Row Level Security) Policies
ALTER TABLE public.provider_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_withdrawals ENABLE ROW LEVEL SECURITY;

-- Policy: Les providers ne peuvent voir que leurs propres méthodes de paiement
CREATE POLICY "Providers can view own payment methods"
  ON public.provider_payment_methods
  FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own payment methods"
  ON public.provider_payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own payment methods"
  ON public.provider_payment_methods
  FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own payment methods"
  ON public.provider_payment_methods
  FOR DELETE
  USING (auth.uid() = provider_id);

-- Policy: Les providers ne peuvent voir que leurs propres retraits
CREATE POLICY "Providers can view own withdrawals"
  ON public.provider_withdrawals
  FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own withdrawals"
  ON public.provider_withdrawals
  FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- Les providers ne peuvent pas modifier ou supprimer les retraits une fois créés
-- Seuls les admins peuvent le faire via des politiques spécifiques

-- 5. Fonction pour vérifier qu'un seul payment method est défaut par provider
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- Si on définit cette méthode comme défaut
  IF NEW.is_default = true THEN
    -- Retirer le statut défaut de toutes les autres méthodes de ce provider
    UPDATE provider_payment_methods
    SET is_default = false
    WHERE provider_id = NEW.provider_id
      AND id != NEW.id
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON provider_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- 6. Fonction pour mettre à jour le solde après un retrait complété
CREATE OR REPLACE FUNCTION update_balance_after_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand un retrait passe à 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE provider_balance
    SET
      available_cents = available_cents - NEW.amount_cents,
      withdrawn_cents = withdrawn_cents + NEW.net_amount_cents,
      last_withdrawal_at = NOW()
    WHERE provider_id = NEW.provider_id;
  END IF;

  -- Si un retrait complété est annulé, on rembourse
  IF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
    UPDATE provider_balance
    SET
      available_cents = available_cents + NEW.amount_cents,
      withdrawn_cents = withdrawn_cents - NEW.net_amount_cents
    WHERE provider_id = NEW.provider_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_balance_after_withdrawal
  AFTER UPDATE ON provider_withdrawals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_balance_after_withdrawal();

-- 7. Commentaires pour documentation
COMMENT ON TABLE provider_payment_methods IS 'Méthodes de paiement des providers pour les retraits';
COMMENT ON TABLE provider_withdrawals IS 'Historique des demandes de retrait des providers - Mode simulation prêt pour intégration réelle';

COMMENT ON COLUMN provider_withdrawals.amount_cents IS 'Montant demandé en centimes (avant frais)';
COMMENT ON COLUMN provider_withdrawals.fee_cents IS 'Frais de traitement (2.5% comme Fiverr)';
COMMENT ON COLUMN provider_withdrawals.net_amount_cents IS 'Montant net que le provider recevra';
COMMENT ON COLUMN provider_withdrawals.external_transaction_id IS 'ID de transaction du système de paiement externe (PayPal, Stripe, etc.) - pour intégration future';
COMMENT ON COLUMN provider_withdrawals.status IS 'pending: en attente, processing: en traitement, completed: complété, failed: échoué, cancelled: annulé';
