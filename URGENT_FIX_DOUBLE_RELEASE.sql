-- ============================================================================
-- FIX URGENT: Empêcher la double libération des fonds
-- ============================================================================
-- PROBLÈME:
--   1. API /api/orders/accept appelle releaseEscrow()
--   2. Trigger auto_release_earning_on_completion se déclenche aussi
--   3. = DOUBLE LIBÉRATION → pending_cents devient négatif
--
-- SOLUTION: Désactiver le trigger automatique
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: DÉSACTIVER le trigger automatique
-- ============================================================================

-- Supprimer le trigger qui libère automatiquement
DROP TRIGGER IF EXISTS trg_auto_release_earning ON orders;

-- Supprimer aussi le trigger de création automatique si nécessaire
-- (On garde seulement celui-ci car il crée l'earning en "delivered")
-- DROP TRIGGER IF EXISTS trg_auto_create_earning ON orders;

RAISE NOTICE '✅ Trigger auto_release désactivé';

-- ============================================================================
-- ÉTAPE 2: Renforcer la protection dans release_provider_earning
-- ============================================================================

CREATE OR REPLACE FUNCTION release_provider_earning(
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_earning_id UUID;
  v_provider_id UUID; -- provider.id
  v_user_id UUID;     -- auth.users.id
  v_net_cents BIGINT;
  v_current_pending BIGINT;
  v_rows_updated INT;
BEGIN
  -- LOCK pour éviter race conditions
  PERFORM pg_advisory_xact_lock(hashtext(p_order_id::text));

  -- Récupérer l'earning avec user_id
  SELECT id, provider_id, user_id, net_amount_cents
  INTO v_earning_id, v_provider_id, v_user_id, v_net_cents
  FROM provider_earnings
  WHERE order_id = p_order_id AND status = 'pending'
  FOR UPDATE; -- Lock la ligne

  IF NOT FOUND THEN
    RAISE NOTICE '⚠️  No pending earning found for order: % (already released)', p_order_id;
    RETURN FALSE;
  END IF;

  -- Si user_id est NULL, le calculer
  IF v_user_id IS NULL THEN
    SELECT pr.user_id INTO v_user_id
    FROM providers prov
    INNER JOIN profiles pr ON pr.id = prov.profile_id
    WHERE prov.id = v_provider_id;

    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot find user_id for provider_id: %', v_provider_id;
    END IF;

    -- Mettre à jour l'earning avec user_id
    UPDATE provider_earnings
    SET user_id = v_user_id
    WHERE id = v_earning_id;
  END IF;

  -- Vérifier le solde actuel
  SELECT pending_cents INTO v_current_pending
  FROM provider_balance
  WHERE provider_id = v_user_id
  FOR UPDATE; -- Lock la balance

  -- Protection: Si le solde pending est insuffisant
  IF v_current_pending IS NULL OR v_current_pending < v_net_cents THEN
    RAISE WARNING '⛔ Insufficient pending balance for user %: has % but needs %',
      v_user_id, COALESCE(v_current_pending, 0), v_net_cents;
    RETURN FALSE;
  END IF;

  -- Mettre à jour le statut de l'earning (avec vérification atomique)
  UPDATE provider_earnings
  SET
    status = 'completed',
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = v_earning_id AND status = 'pending'; -- Double-check atomique

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RAISE NOTICE '⚠️  Earning already released for order: % (concurrent update)', p_order_id;
    RETURN FALSE;
  END IF;

  -- Mettre à jour le solde avec user_id
  UPDATE provider_balance
  SET
    pending_cents = pending_cents - v_net_cents,
    available_cents = available_cents + v_net_cents,
    updated_at = NOW()
  WHERE provider_id = v_user_id
    AND pending_cents >= v_net_cents; -- Protection supplémentaire

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    -- Rollback de l'earning
    UPDATE provider_earnings
    SET status = 'pending', paid_at = NULL
    WHERE id = v_earning_id;

    RAISE WARNING '⛔ Could not update balance - insufficient funds or concurrent update';
    RETURN FALSE;
  END IF;

  RAISE NOTICE '✅ Released % cents to user % (provider %)',
    v_net_cents, v_user_id, v_provider_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION release_provider_earning IS 'Libère les fonds avec protection contre double-release';

-- ============================================================================
-- ÉTAPE 3: Corriger les balances négatives existantes
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_total_earned BIGINT;
  v_pending BIGINT;
  v_completed BIGINT;
  v_withdrawn BIGINT;
  v_available BIGINT;
BEGIN
  RAISE NOTICE '🔄 Fixing negative balances...';

  FOR r IN
    SELECT pb.provider_id, pb.pending_cents, pb.available_cents
    FROM provider_balance pb
    WHERE pb.pending_cents < 0 OR pb.available_cents < 0
  LOOP
    RAISE NOTICE 'Fixing balance for user: % (pending=%, available=%)',
      r.provider_id, r.pending_cents, r.available_cents;

    -- Recalculer depuis les earnings (avec user_id)
    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_total_earned
    FROM provider_earnings
    WHERE user_id = r.provider_id;

    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_pending
    FROM provider_earnings
    WHERE user_id = r.provider_id AND status = 'pending';

    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_completed
    FROM provider_earnings
    WHERE user_id = r.provider_id AND status = 'completed';

    -- Recalculer withdrawals (nécessite de passer par profile → provider)
    SELECT COALESCE(SUM(pw.net_amount_cents), 0) INTO v_withdrawn
    FROM provider_withdrawals pw
    WHERE pw.provider_id = (
      SELECT prov.id FROM providers prov
      INNER JOIN profiles pr ON pr.id = prov.profile_id
      WHERE pr.user_id = r.provider_id
      LIMIT 1
    ) AND pw.status = 'completed';

    v_available := GREATEST(0, v_completed - v_withdrawn);

    -- Protection
    v_total_earned := GREATEST(0, v_total_earned);
    v_pending := GREATEST(0, v_pending);
    v_withdrawn := GREATEST(0, v_withdrawn);

    -- Mettre à jour
    UPDATE provider_balance
    SET
      total_earned_cents = v_total_earned,
      pending_cents = v_pending,
      available_cents = v_available,
      withdrawn_cents = v_withdrawn,
      updated_at = NOW()
    WHERE provider_id = r.provider_id;

    RAISE NOTICE '✅ Fixed: earned=% pending=% available=% withdrawn=%',
      v_total_earned, v_pending, v_available, v_withdrawn;
  END LOOP;

  RAISE NOTICE '✅ All negative balances fixed!';
END $$;

-- ============================================================================
-- ÉTAPE 4: Nettoyer les earnings en doublon
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_keep_id UUID;
  v_duplicate_ids UUID[];
BEGIN
  RAISE NOTICE '🔄 Checking for duplicate earnings...';

  -- Trouver les commandes avec plusieurs earnings "completed"
  FOR r IN
    SELECT
      order_id,
      array_agg(id ORDER BY created_at) as earning_ids,
      COUNT(*) as count
    FROM provider_earnings
    WHERE status = 'completed'
    GROUP BY order_id
    HAVING COUNT(*) > 1
  LOOP
    -- Garder le premier, supprimer les autres
    v_keep_id := r.earning_ids[1];
    v_duplicate_ids := r.earning_ids[2:array_length(r.earning_ids, 1)];

    RAISE NOTICE 'Found % duplicate earnings for order %. Keeping %, deleting %',
      r.count - 1, r.order_id, v_keep_id, v_duplicate_ids;

    -- Marquer les doublons comme "cancelled"
    UPDATE provider_earnings
    SET
      status = 'cancelled',
      notes = 'Duplicate earning removed - ' || NOW()::text,
      updated_at = NOW()
    WHERE id = ANY(v_duplicate_ids);

  END LOOP;

  RAISE NOTICE '✅ Duplicate cleanup completed!';
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier les balances
SELECT
  provider_id,
  pending_cents,
  available_cents,
  total_earned_cents,
  withdrawn_cents,
  CASE
    WHEN pending_cents < 0 THEN '❌ PENDING NEGATIVE'
    WHEN available_cents < 0 THEN '❌ AVAILABLE NEGATIVE'
    ELSE '✅ OK'
  END as status
FROM provider_balance
ORDER BY updated_at DESC;

-- Vérifier les earnings en doublon
SELECT
  order_id,
  COUNT(*) as earning_count,
  array_agg(status) as statuses
FROM provider_earnings
GROUP BY order_id
HAVING COUNT(*) FILTER (WHERE status = 'completed') > 1;

RAISE NOTICE '🎉 FIX URGENT APPLIQUÉ - LE TRIGGER EST DÉSACTIVÉ';
RAISE NOTICE '⚠️  IMPORTANT: Maintenant seule l''API /api/orders/accept libère les fonds';
