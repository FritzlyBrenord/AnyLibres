-- ============================================================================
-- FIX COMPLET: Synchronisation provider_balance avec withdrawals et earnings
-- ============================================================================
-- Problèmes corrigés:
-- 1. pending_cents devient négatif (double trigger)
-- 2. total_earned_cents incorrect (ne compte pas tout)
-- 3. withdrawn_cents non synchronisé avec provider_withdrawals
-- ============================================================================

-- ============================================================================
-- PARTIE 1: Corriger release_provider_earning (éviter pending négatif)
-- ============================================================================

CREATE OR REPLACE FUNCTION release_provider_earning(
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_earning_id UUID;
  v_provider_id UUID;
  v_net_cents BIGINT;
  v_current_pending BIGINT;
BEGIN
  -- Récupérer l'earning UNIQUEMENT si status = 'pending'
  SELECT id, provider_id, net_amount_cents
  INTO v_earning_id, v_provider_id, v_net_cents
  FROM provider_earnings
  WHERE order_id = p_order_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE NOTICE '⚠️  No pending earning found for order: % (already released or not created)', p_order_id;
    RETURN FALSE;
  END IF;

  -- Vérifier le solde actuel
  SELECT pending_cents INTO v_current_pending
  FROM provider_balance
  WHERE provider_id = v_provider_id;

  -- Protection: Si le solde pending est insuffisant, ne pas libérer
  IF v_current_pending < v_net_cents THEN
    RAISE WARNING '⛔ Insufficient pending balance for provider %: has % but needs %',
      v_provider_id, v_current_pending, v_net_cents;
    RETURN FALSE;
  END IF;

  -- Mettre à jour le statut de l'earning (pour éviter double-release)
  UPDATE provider_earnings
  SET
    status = 'completed',
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = v_earning_id AND status = 'pending'; -- Double-check status

  IF NOT FOUND THEN
    RAISE NOTICE '⚠️  Earning already released for order: %', p_order_id;
    RETURN FALSE;
  END IF;

  -- Mettre à jour le solde du provider
  -- NOTE: total_earned_cents est calculé différemment maintenant
  UPDATE provider_balance
  SET
    pending_cents = pending_cents - v_net_cents,
    available_cents = available_cents + v_net_cents,
    -- total_earned_cents ne change pas ici (déjà compté lors de create_earning)
    updated_at = NOW()
  WHERE provider_id = v_provider_id;

  RAISE NOTICE '✅ Released % cents to provider %', v_net_cents, v_provider_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTIE 2: Corriger create_provider_earning (gérer total_earned_cents)
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

  -- Mettre à jour le solde du provider
  -- IMPORTANT: Ajouter à BOTH pending_cents ET total_earned_cents
  INSERT INTO provider_balance (provider_id, pending_cents, total_earned_cents, currency)
  VALUES (v_provider_id, v_net_cents, v_net_cents, v_currency)
  ON CONFLICT (provider_id) DO UPDATE
  SET
    pending_cents = provider_balance.pending_cents + EXCLUDED.pending_cents,
    total_earned_cents = provider_balance.total_earned_cents + EXCLUDED.total_earned_cents,
    updated_at = NOW();

  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTIE 3: Trigger pour synchroniser withdrawn_cents avec withdrawals
-- ============================================================================

CREATE OR REPLACE FUNCTION update_balance_after_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand un retrait passe de 'pending' à 'completed'
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN

    UPDATE provider_balance
    SET
      available_cents = available_cents - NEW.amount_cents,
      withdrawn_cents = withdrawn_cents + NEW.net_amount_cents, -- Montant net reçu
      last_withdrawal_at = NOW(),
      updated_at = NOW()
    WHERE provider_id = NEW.provider_id;

    RAISE NOTICE '✅ Updated balance after withdrawal: provider=% amount=%',
      NEW.provider_id, NEW.net_amount_cents;
  END IF;

  -- Quand un retrait est annulé, rembourser
  IF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN

    UPDATE provider_balance
    SET
      available_cents = available_cents + NEW.amount_cents,
      updated_at = NOW()
    WHERE provider_id = NEW.provider_id;

    RAISE NOTICE '✅ Refunded cancelled withdrawal: provider=% amount=%',
      NEW.provider_id, NEW.amount_cents;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trg_update_balance_after_withdrawal ON provider_withdrawals;

CREATE TRIGGER trg_update_balance_after_withdrawal
  AFTER UPDATE ON provider_withdrawals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_balance_after_withdrawal();

-- ============================================================================
-- PARTIE 4: Améliorer le trigger auto_release
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_release_earning_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_has_pending_earning BOOLEAN;
BEGIN
  -- Vérifier d'abord qu'un earning pending existe
  SELECT EXISTS(
    SELECT 1 FROM provider_earnings
    WHERE order_id = NEW.id AND status = 'pending'
  ) INTO v_has_pending_earning;

  -- Ne libérer QUE si:
  -- 1. Le statut passe à 'completed'
  -- 2. L'ancien statut n'était PAS 'completed'
  -- 3. Un earning pending existe
  IF NEW.status = 'completed'
     AND (OLD.status IS NULL OR OLD.status != 'completed')
     AND v_has_pending_earning THEN

    PERFORM release_provider_earning(NEW.id);
    RAISE NOTICE '✅ Released earning for order %', NEW.id;
  ELSIF NEW.status = 'completed' AND NOT v_has_pending_earning THEN
    RAISE NOTICE '⚠️  No pending earning to release for order %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trg_auto_release_earning ON orders;

CREATE TRIGGER trg_auto_release_earning
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_release_earning_on_completion();

-- ============================================================================
-- PARTIE 5: RECALCULER tous les soldes existants
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_total_earned BIGINT; -- Tous les earnings (pending + completed)
  v_pending BIGINT;
  v_completed BIGINT;
  v_withdrawn BIGINT;
  v_available BIGINT;
BEGIN
  RAISE NOTICE '🔄 Recalculating all provider balances...';

  FOR r IN
    SELECT DISTINCT provider_id
    FROM provider_balance
  LOOP
    -- 1. Total gagné = TOUS les earnings (pending + completed)
    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_total_earned
    FROM provider_earnings
    WHERE provider_id = r.provider_id;

    -- 2. Pending = earnings en statut 'pending'
    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_pending
    FROM provider_earnings
    WHERE provider_id = r.provider_id AND status = 'pending';

    -- 3. Completed = earnings en statut 'completed'
    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_completed
    FROM provider_earnings
    WHERE provider_id = r.provider_id AND status = 'completed';

    -- 4. Withdrawn = retraits complétés (net_amount)
    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_withdrawn
    FROM provider_withdrawals
    WHERE provider_id = r.provider_id AND status = 'completed';

    -- 5. Available = completed - withdrawn
    v_available := v_completed - v_withdrawn;

    -- Protection: Ne jamais avoir de valeurs négatives
    v_total_earned := GREATEST(0, v_total_earned);
    v_pending := GREATEST(0, v_pending);
    v_available := GREATEST(0, v_available);
    v_withdrawn := GREATEST(0, v_withdrawn);

    -- Mettre à jour le solde
    UPDATE provider_balance
    SET
      total_earned_cents = v_total_earned,
      pending_cents = v_pending,
      available_cents = v_available,
      withdrawn_cents = v_withdrawn,
      updated_at = NOW()
    WHERE provider_id = r.provider_id;

    RAISE NOTICE '✅ Fixed provider %: earned=% pending=% available=% withdrawn=%',
      r.provider_id, v_total_earned, v_pending, v_available, v_withdrawn;
  END LOOP;

  RAISE NOTICE '✅ All balances recalculated!';
END $$;

-- ============================================================================
-- PARTIE 6: VERIFICATION
-- ============================================================================

-- Vue pour vérifier la cohérence
CREATE OR REPLACE VIEW v_balance_verification AS
SELECT
  pb.provider_id,
  pb.total_earned_cents AS balance_total,
  pb.pending_cents AS balance_pending,
  pb.available_cents AS balance_available,
  pb.withdrawn_cents AS balance_withdrawn,

  -- Calculs réels depuis les tables
  COALESCE(SUM(pe.net_amount_cents), 0) AS earnings_total,
  COALESCE(SUM(pe.net_amount_cents) FILTER (WHERE pe.status = 'pending'), 0) AS earnings_pending,
  COALESCE(SUM(pe.net_amount_cents) FILTER (WHERE pe.status = 'completed'), 0) AS earnings_completed,
  COALESCE(SUM(pw.net_amount_cents) FILTER (WHERE pw.status = 'completed'), 0) AS withdrawals_total,

  -- Vérifications
  pb.total_earned_cents = COALESCE(SUM(pe.net_amount_cents), 0) AS total_correct,
  pb.pending_cents = COALESCE(SUM(pe.net_amount_cents) FILTER (WHERE pe.status = 'pending'), 0) AS pending_correct,
  pb.withdrawn_cents = COALESCE(SUM(pw.net_amount_cents) FILTER (WHERE pw.status = 'completed'), 0) AS withdrawn_correct,
  pb.available_cents = (
    COALESCE(SUM(pe.net_amount_cents) FILTER (WHERE pe.status = 'completed'), 0) -
    COALESCE(SUM(pw.net_amount_cents) FILTER (WHERE pw.status = 'completed'), 0)
  ) AS available_correct

FROM provider_balance pb
LEFT JOIN provider_earnings pe ON pe.provider_id = pb.provider_id
LEFT JOIN provider_withdrawals pw ON pw.provider_id = pb.provider_id
GROUP BY pb.provider_id, pb.total_earned_cents, pb.pending_cents, pb.available_cents, pb.withdrawn_cents;

-- Afficher les incohérences
SELECT *
FROM v_balance_verification
WHERE NOT (total_correct AND pending_correct AND withdrawn_correct AND available_correct)
ORDER BY provider_id;

-- Afficher un résumé
SELECT
  provider_id,
  total_earned_cents / 100.0 AS total_earned_eur,
  pending_cents / 100.0 AS pending_eur,
  available_cents / 100.0 AS available_eur,
  withdrawn_cents / 100.0 AS withdrawn_eur,
  last_withdrawal_at
FROM provider_balance
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================================================
-- RÉSUMÉ DES CHANGEMENTS
-- ============================================================================

/*
✅ CORRECTIONS APPLIQUÉES:

1. release_provider_earning():
   - Vérifie que l'earning est 'pending' avant libération
   - Vérifie que pending_cents >= montant
   - Empêche double-release
   - Ne modifie plus total_earned_cents (déjà compté)

2. create_provider_earning():
   - Ajoute à pending_cents
   - Ajoute AUSSI à total_earned_cents (comptabilise immédiatement)

3. update_balance_after_withdrawal():
   - Synchronise withdrawn_cents avec provider_withdrawals
   - Déduit de available_cents
   - Gère les annulations

4. auto_release_earning_on_completion():
   - Vérifie qu'un earning pending existe
   - Empêche appels multiples

5. Recalcul complet:
   - total_earned_cents = TOUS les earnings
   - pending_cents = earnings en 'pending'
   - available_cents = earnings 'completed' - withdrawals 'completed'
   - withdrawn_cents = withdrawals 'completed'

FORMULES:
  total_earned = pending + available + withdrawn
  available = completed_earnings - withdrawn

TEST:
  SELECT * FROM v_balance_verification;
*/

RAISE NOTICE '🎉 FIX COMPLET APPLIQUÉ AVEC SUCCÈS!';
