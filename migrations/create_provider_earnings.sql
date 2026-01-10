-- ============================================================================
-- MIGRATION: Système de gains des prestataires (Provider Earnings)
-- ============================================================================
-- Date: 2025-12-11
-- Description: Gestion des paiements aux prestataires après validation client

-- ============================================================================
-- 1. TABLE: provider_earnings (Historique des gains)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.provider_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Relations
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Montants (en centimes)
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  platform_fee_cents BIGINT NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  net_amount_cents BIGINT NOT NULL CHECK (net_amount_cents >= 0), -- Montant net reçu par le provider

  currency TEXT NOT NULL DEFAULT 'EUR',

  -- Statut du paiement
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),

  -- Détails du paiement
  payment_method TEXT NULL, -- 'bank_transfer', 'paypal', 'stripe', etc.
  payment_reference TEXT NULL, -- Référence de transaction
  paid_at TIMESTAMP WITH TIME ZONE NULL,

  -- Métadonnées
  metadata JSONB NULL,
  notes TEXT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT provider_earnings_pkey PRIMARY KEY (id),
  CONSTRAINT provider_earnings_order_unique UNIQUE (order_id), -- Une seule entrée par commande
  CONSTRAINT provider_earnings_net_amount_check CHECK (
    net_amount_cents = amount_cents - platform_fee_cents
  )
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_provider_earnings_provider ON public.provider_earnings(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_earnings_status ON public.provider_earnings(status);
CREATE INDEX IF NOT EXISTS idx_provider_earnings_created ON public.provider_earnings(created_at DESC);

-- Trigger pour updated_at
CREATE TRIGGER trg_provider_earnings_updated_at
  BEFORE UPDATE ON public.provider_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.provider_earnings IS 'Historique des gains des prestataires';
COMMENT ON COLUMN public.provider_earnings.amount_cents IS 'Montant total de la commande (avec frais)';
COMMENT ON COLUMN public.provider_earnings.platform_fee_cents IS 'Frais de plateforme retenus';
COMMENT ON COLUMN public.provider_earnings.net_amount_cents IS 'Montant net versé au prestataire (amount - fees)';

-- ============================================================================
-- 2. TABLE: provider_balance (Solde actuel du prestataire)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.provider_balance (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Soldes (en centimes)
  available_cents BIGINT NOT NULL DEFAULT 0 CHECK (available_cents >= 0), -- Disponible pour retrait
  pending_cents BIGINT NOT NULL DEFAULT 0 CHECK (pending_cents >= 0), -- En attente de validation
  withdrawn_cents BIGINT NOT NULL DEFAULT 0 CHECK (withdrawn_cents >= 0), -- Déjà retiré
  total_earned_cents BIGINT NOT NULL DEFAULT 0 CHECK (total_earned_cents >= 0), -- Total gagné (lifetime)

  currency TEXT NOT NULL DEFAULT 'EUR',

  -- Informations de paiement
  preferred_payment_method TEXT NULL,
  payment_details JSONB NULL, -- IBAN, PayPal email, etc. (chiffré si possible)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_withdrawal_at TIMESTAMP WITH TIME ZONE NULL,

  CONSTRAINT provider_balance_pkey PRIMARY KEY (id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_provider_balance_provider ON public.provider_balance(provider_id);

-- Trigger
CREATE TRIGGER trg_provider_balance_updated_at
  BEFORE UPDATE ON public.provider_balance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.provider_balance IS 'Solde actuel de chaque prestataire';
COMMENT ON COLUMN public.provider_balance.available_cents IS 'Montant disponible pour retrait immédiat';
COMMENT ON COLUMN public.provider_balance.pending_cents IS 'Montant en attente (commandes non validées)';

-- ============================================================================
-- 3. FONCTION: Calculer le montant net pour le prestataire
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_provider_net_amount(
  p_order_id UUID
) RETURNS TABLE (
  amount_cents BIGINT,
  platform_fee_cents BIGINT,
  net_amount_cents BIGINT
) AS $$
DECLARE
  v_total_cents BIGINT;
  v_fees_cents BIGINT;
  v_metadata JSONB;
  v_fee_config JSONB;
BEGIN
  -- Récupérer les informations de la commande
  SELECT o.total_cents, o.fees_cents, o.metadata
  INTO v_total_cents, v_fees_cents, v_metadata
  FROM orders o
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Vérifier la configuration des frais dans metadata
  v_fee_config := v_metadata->'pricing'->'fee_config';

  -- Déterminer qui paie les frais
  IF v_fee_config->>'paid_by' = 'provider' THEN
    -- Le prestataire paie les frais : montant net = total - frais
    RETURN QUERY SELECT
      v_total_cents AS amount_cents,
      v_fees_cents AS platform_fee_cents,
      (v_total_cents - v_fees_cents) AS net_amount_cents;
  ELSIF v_fee_config->>'paid_by' = 'split' THEN
    -- Frais partagés : chacun paie la moitié
    RETURN QUERY SELECT
      v_total_cents AS amount_cents,
      (v_fees_cents / 2) AS platform_fee_cents,
      (v_total_cents - (v_fees_cents / 2)) AS net_amount_cents;
  ELSE
    -- 'client' ou défaut : le client paie les frais, le provider reçoit le sous-total
    RETURN QUERY SELECT
      (v_total_cents - v_fees_cents) AS amount_cents,
      0::BIGINT AS platform_fee_cents,
      (v_total_cents - v_fees_cents) AS net_amount_cents;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_provider_net_amount IS 'Calcule le montant net à verser au prestataire selon la config des frais';

-- ============================================================================
-- 4. FONCTION: Créer un gain pour le prestataire
-- ============================================================================

CREATE OR REPLACE FUNCTION create_provider_earning(
  p_order_id UUID
) RETURNS UUID AS $$
DECLARE
  v_provider_id UUID;
  v_earning_id UUID;
  v_amount_cents BIGINT;
  v_fee_cents BIGINT;
  v_net_cents BIGINT;
  v_currency TEXT;
BEGIN
  -- Récupérer le provider de la commande
  SELECT provider_id, currency
  INTO v_provider_id, v_currency
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Calculer les montants
  SELECT * INTO v_amount_cents, v_fee_cents, v_net_cents
  FROM calculate_provider_net_amount(p_order_id);

  -- Créer l'earning
  INSERT INTO provider_earnings (
    provider_id,
    order_id,
    amount_cents,
    platform_fee_cents,
    net_amount_cents,
    currency,
    status,
    metadata
  ) VALUES (
    v_provider_id,
    p_order_id,
    v_amount_cents,
    v_fee_cents,
    v_net_cents,
    v_currency,
    'pending',
    jsonb_build_object(
      'created_by', 'system',
      'created_at', NOW()
    )
  )
  RETURNING id INTO v_earning_id;

  -- Mettre à jour le solde pending du provider
  INSERT INTO provider_balance (provider_id, pending_cents, currency)
  VALUES (v_provider_id, v_net_cents, v_currency)
  ON CONFLICT (provider_id) DO UPDATE
  SET
    pending_cents = provider_balance.pending_cents + EXCLUDED.pending_cents,
    updated_at = NOW();

  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_provider_earning IS 'Crée un gain pour le prestataire à partir d une commande';

-- ============================================================================
-- 5. FONCTION: Libérer le paiement au prestataire (après validation client)
-- ============================================================================

CREATE OR REPLACE FUNCTION release_provider_earning(
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_earning_id UUID;
  v_provider_id UUID;
  v_net_cents BIGINT;
BEGIN
  -- Récupérer l'earning
  SELECT id, provider_id, net_amount_cents
  INTO v_earning_id, v_provider_id, v_net_cents
  FROM provider_earnings
  WHERE order_id = p_order_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE NOTICE 'No pending earning found for order: %', p_order_id;
    RETURN FALSE;
  END IF;

  -- Mettre à jour le statut de l'earning
  UPDATE provider_earnings
  SET
    status = 'completed',
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = v_earning_id;

  -- Mettre à jour le solde du provider
  UPDATE provider_balance
  SET
    pending_cents = pending_cents - v_net_cents,
    available_cents = available_cents + v_net_cents,
    total_earned_cents = total_earned_cents + v_net_cents,
    updated_at = NOW()
  WHERE provider_id = v_provider_id;

  RAISE NOTICE 'Released % cents to provider %', v_net_cents, v_provider_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION release_provider_earning IS 'Libère le paiement au prestataire après validation du client';

-- ============================================================================
-- 6. TRIGGER: Créer automatiquement un earning quand commande = "delivered"
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_earning_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'delivered', créer un earning
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    PERFORM create_provider_earning(NEW.id);
    RAISE NOTICE 'Created earning for order %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_create_earning
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION auto_create_earning_on_delivery();

-- ============================================================================
-- 7. TRIGGER: Libérer automatiquement le paiement quand commande = "completed"
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_release_earning_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'completed', libérer le paiement
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM release_provider_earning(NEW.id);
    RAISE NOTICE 'Released earning for order %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_release_earning
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_release_earning_on_completion();

-- ============================================================================
-- 8. VUE: Résumé des gains par provider
-- ============================================================================

CREATE OR REPLACE VIEW v_provider_earnings_summary AS
SELECT
  pb.provider_id,
  pb.available_cents,
  pb.pending_cents,
  pb.withdrawn_cents,
  pb.total_earned_cents,
  pb.currency,
  COUNT(pe.id) FILTER (WHERE pe.status = 'completed') AS completed_orders,
  COUNT(pe.id) FILTER (WHERE pe.status = 'pending') AS pending_orders,
  pb.last_withdrawal_at,
  pb.updated_at
FROM provider_balance pb
LEFT JOIN provider_earnings pe ON pe.provider_id = pb.provider_id
GROUP BY pb.provider_id, pb.available_cents, pb.pending_cents, pb.withdrawn_cents,
         pb.total_earned_cents, pb.currency, pb.last_withdrawal_at, pb.updated_at;

COMMENT ON VIEW v_provider_earnings_summary IS 'Résumé des gains par prestataire';

-- ============================================================================
-- 9. EXEMPLES D'UTILISATION
-- ============================================================================

/*
-- Créer un earning manuellement
SELECT create_provider_earning('order-uuid-here');

-- Libérer un paiement manuellement
SELECT release_provider_earning('order-uuid-here');

-- Voir le solde d'un prestataire
SELECT * FROM provider_balance WHERE provider_id = 'provider-uuid';

-- Voir tous les earnings d'un prestataire
SELECT * FROM provider_earnings
WHERE provider_id = 'provider-uuid'
ORDER BY created_at DESC;

-- Voir le résumé
SELECT * FROM v_provider_earnings_summary
WHERE provider_id = 'provider-uuid';
*/

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================

/*
DROP TRIGGER IF EXISTS trg_auto_release_earning ON orders;
DROP TRIGGER IF EXISTS trg_auto_create_earning ON orders;
DROP FUNCTION IF EXISTS auto_release_earning_on_completion();
DROP FUNCTION IF EXISTS auto_create_earning_on_delivery();
DROP VIEW IF EXISTS v_provider_earnings_summary;
DROP FUNCTION IF EXISTS release_provider_earning(UUID);
DROP FUNCTION IF EXISTS create_provider_earning(UUID);
DROP FUNCTION IF EXISTS calculate_provider_net_amount(UUID);
DROP TABLE IF EXISTS provider_balance;
DROP TABLE IF EXISTS provider_earnings;
*/
