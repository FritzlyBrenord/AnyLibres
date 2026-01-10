-- ============================================================================
-- FIX: Empêcher pending_cents de devenir négatif
-- Problème: Le trigger release_earning se déclenche plusieurs fois
-- ============================================================================

-- 1. REMPLACER la fonction release_provider_earning avec protection
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
  UPDATE provider_balance
  SET
    pending_cents = pending_cents - v_net_cents,
    available_cents = available_cents + v_net_cents,
    total_earned_cents = total_earned_cents + v_net_cents,
    updated_at = NOW()
  WHERE provider_id = v_provider_id;

  RAISE NOTICE '✅ Released % cents to provider %', v_net_cents, v_provider_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 2. AMÉLIORER le trigger pour éviter les appels multiples
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

-- 3. RECRÉER le trigger
DROP TRIGGER IF EXISTS trg_auto_release_earning ON orders;

CREATE TRIGGER trg_auto_release_earning
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_release_earning_on_completion();

-- 4. CORRECTION: Réparer les soldes négatifs existants
DO $$
DECLARE
  r RECORD;
  v_total_earnings BIGINT;
  v_total_released BIGINT;
BEGIN
  FOR r IN
    SELECT provider_id, pending_cents, available_cents
    FROM provider_balance
    WHERE pending_cents < 0 OR available_cents < 0
  LOOP
    RAISE NOTICE 'Fixing balance for provider: %', r.provider_id;

    -- Calculer le vrai pending
    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_total_earnings
    FROM provider_earnings
    WHERE provider_id = r.provider_id AND status = 'pending';

    -- Calculer le vrai released
    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_total_released
    FROM provider_earnings
    WHERE provider_id = r.provider_id AND status = 'completed';

    -- Corriger les soldes
    UPDATE provider_balance
    SET
      pending_cents = GREATEST(0, v_total_earnings),
      available_cents = GREATEST(0, v_total_released - COALESCE(withdrawn_cents, 0)),
      updated_at = NOW()
    WHERE provider_id = r.provider_id;

    RAISE NOTICE '✅ Fixed: pending=% available=%',
      GREATEST(0, v_total_earnings),
      GREATEST(0, v_total_released - COALESCE(r.withdrawn_cents, 0));
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Afficher tous les soldes
SELECT
  provider_id,
  pending_cents,
  available_cents,
  withdrawn_cents,
  total_earned_cents
FROM provider_balance
ORDER BY updated_at DESC;

-- Afficher les earnings problématiques
SELECT
  pe.id,
  pe.order_id,
  pe.provider_id,
  pe.status,
  pe.net_amount_cents,
  o.status AS order_status
FROM provider_earnings pe
JOIN orders o ON o.id = pe.order_id
WHERE pe.status = 'pending' AND o.status = 'completed'
ORDER BY pe.created_at DESC;

RAISE NOTICE '✅ Fix appliqué avec succès!';
