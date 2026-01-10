-- ============================================================================
-- MIGRATION: Système de Paiement Sécurisé
-- Date: 2025-02-08
-- Description: Crée les tables pour le système de paiement avec escrow,
--              remboursements, et webhooks
-- ============================================================================

-- ============================================================================
-- TABLE: payments
-- Description: Stocke tous les paiements avec chiffrement et escrow
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL, -- FK vers providers (à ajouter si table existe)

  -- Montants
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',

  -- Statuts
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | processing | requires_action | succeeded | failed |
  -- cancelled | refunded | partially_refunded | disputed | escrowed

  payment_method TEXT NOT NULL,
  -- card | paypal | bank_transfer | wallet

  payment_provider TEXT NOT NULL DEFAULT 'mock',
  -- mock | stripe | paypal

  -- Identifiants externes (Stripe, PayPal, etc.)
  external_payment_id TEXT,
  external_customer_id TEXT,

  -- Escrow (rétention d'argent)
  escrow_status TEXT NOT NULL DEFAULT 'held',
  -- held | released | refunded
  escrow_released_at TIMESTAMPTZ,

  -- Sécurité & Vérification
  requires_3d_secure BOOLEAN DEFAULT FALSE,
  is_3d_secure_completed BOOLEAN DEFAULT FALSE,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),

  -- Données chiffrées (AES-256-GCM)
  encrypted_payment_details TEXT,
  payment_details_iv TEXT, -- Initialization Vector

  -- Données publiques d'affichage (JSONB)
  display_details JSONB,
  -- {
  --   method: 'card',
  --   card_brand: 'visa',
  --   card_last4: '4242',
  --   card_exp_month: '12',
  --   card_exp_year: '25',
  --   card_holder_name: 'John Doe'
  -- }

  -- Remboursements
  refunded_amount_cents BIGINT DEFAULT 0 CHECK (refunded_amount_cents >= 0),
  refund_reason TEXT,

  -- Métadonnées
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  succeeded_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT payments_amount_refunded_check CHECK (refunded_amount_cents <= amount_cents)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_provider ON payments(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_payment_id);

-- ============================================================================
-- TABLE: payment_refunds
-- Description: Historique des remboursements
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Montant remboursé
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),

  -- Raison du remboursement
  reason TEXT NOT NULL,
  -- customer_request | order_cancelled | service_not_delivered |
  -- dispute_resolved | duplicate_payment | fraud | other

  description TEXT,

  -- Statut
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | processing | succeeded | failed

  -- Identifiant externe (Stripe Refund ID, etc.)
  external_refund_id TEXT,

  -- Initiateur
  initiated_by UUID NOT NULL REFERENCES auth.users(id),
  -- Peut être: admin, client, système automatique

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_reason TEXT
);

-- Index
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON payment_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON payment_refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON payment_refunds(created_at DESC);

-- ============================================================================
-- TABLE: payment_webhooks
-- Description: Webhooks reçus des providers de paiement
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Type d'événement
  event_type TEXT NOT NULL,
  -- payment.created | payment.processing | payment.succeeded |
  -- payment.failed | payment.refunded | payment.disputed |
  -- payment.3ds_required | payment.3ds_completed |
  -- refund.created | refund.succeeded | refund.failed

  -- Provider
  provider TEXT NOT NULL,
  -- mock | stripe | paypal

  external_event_id TEXT,

  -- Payload brut du webhook
  payload JSONB NOT NULL,

  -- Traitement
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_webhooks_payment_id ON payment_webhooks(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON payment_webhooks(created_at DESC);

-- ============================================================================
-- TABLE: invoices (Factures PDF)
-- Description: Factures générées automatiquement
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Numéro de facture (unique)
  invoice_number TEXT UNIQUE NOT NULL,
  -- Format: INV-2025-00001

  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,

  -- Parties
  client_id UUID NOT NULL REFERENCES auth.users(id),
  provider_id UUID NOT NULL,

  -- Montants (en centimes)
  subtotal_cents BIGINT NOT NULL CHECK (subtotal_cents >= 0),
  tax_cents BIGINT DEFAULT 0 CHECK (tax_cents >= 0),
  fees_cents BIGINT DEFAULT 0 CHECK (fees_cents >= 0),
  total_cents BIGINT NOT NULL CHECK (total_cents >= 0),

  -- PDF
  pdf_url TEXT,
  pdf_generated BOOLEAN DEFAULT FALSE,

  -- Statut
  status TEXT NOT NULL DEFAULT 'draft',
  -- draft | issued | paid | cancelled

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Générer numéro de facture automatiquement
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  max_number INTEGER;
  year_str TEXT;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO max_number
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_str || '-%';

    NEW.invoice_number := 'INV-' || year_str || '-' || LPAD(max_number::TEXT, 5, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Politique: Les clients voient leurs paiements
CREATE POLICY "Clients can view their payments"
  ON payments FOR SELECT
  USING (auth.uid() = client_id);

-- Politique: Les prestataires voient les paiements de leurs commandes
CREATE POLICY "Providers can view payments for their orders"
  ON payments FOR SELECT
  USING (
    provider_id = auth.uid()
  );

-- Politique: Les clients peuvent voir leurs remboursements
CREATE POLICY "Clients can view their refunds"
  ON payment_refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = payment_refunds.payment_id
      AND payments.client_id = auth.uid()
    )
  );

-- Politique: Les clients peuvent voir leurs factures
CREATE POLICY "Clients can view their invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = client_id);

-- Politique: Les prestataires peuvent voir leurs factures
CREATE POLICY "Providers can view their invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = provider_id);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE payments IS 'Stocke tous les paiements avec chiffrement et escrow';
COMMENT ON TABLE payment_refunds IS 'Historique des remboursements de paiements';
COMMENT ON TABLE payment_webhooks IS 'Webhooks reçus des providers de paiement (Stripe, PayPal)';
COMMENT ON TABLE invoices IS 'Factures PDF générées automatiquement';

COMMENT ON COLUMN payments.encrypted_payment_details IS 'Détails sensibles chiffrés avec AES-256-GCM';
COMMENT ON COLUMN payments.payment_details_iv IS 'Initialization Vector pour déchiffrement';
COMMENT ON COLUMN payments.display_details IS 'Détails publics d''affichage (derniers 4 chiffres, etc.)';
COMMENT ON COLUMN payments.escrow_status IS 'État de l''escrow: held (retenu) | released (libéré) | refunded (remboursé)';
COMMENT ON COLUMN payments.risk_score IS 'Score de risque de fraude (0-100, 100 = très risqué)';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================