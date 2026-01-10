-- ============================================================================
-- FIX: Correction de la contrainte FK pour provider_earnings
-- ============================================================================
-- Problème: orders.provider_id pointe vers providers.id, pas auth.users.id
-- Solution: Modifier la FK pour pointer vers profiles.user_id

-- ============================================================================
-- 1. Supprimer la contrainte FK incorrecte
-- ============================================================================

ALTER TABLE public.provider_earnings
DROP CONSTRAINT IF EXISTS provider_earnings_provider_id_fkey;

-- ============================================================================
-- 2. Modifier la colonne provider_id pour stocker le user_id
-- ============================================================================

-- Note: On va garder provider_id comme référence au user_id (auth.users.id)
-- Car c'est plus cohérent avec les paiements

-- Recréer la contrainte correcte
-- OPTION: Pas de FK du tout (plus flexible)
-- La FK sera vérifiée au niveau applicatif

COMMENT ON COLUMN public.provider_earnings.provider_id IS 'ID du user (auth.users.id) qui est le prestataire';

-- ============================================================================
-- 3. Modifier les fonctions pour récupérer le bon user_id
-- ============================================================================

CREATE OR REPLACE FUNCTION create_provider_earning(
  p_order_id UUID
) RETURNS UUID AS $$
DECLARE
  v_order_provider_id UUID;
  v_user_id UUID;
  v_earning_id UUID;
  v_amount_cents BIGINT;
  v_fee_cents BIGINT;
  v_net_cents BIGINT;
  v_currency TEXT;
BEGIN
  -- Récupérer le provider_id de la commande
  SELECT provider_id, currency
  INTO v_order_provider_id, v_currency
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Trouver le user_id correspondant au provider
  -- On essaie d'abord avec providers.id → profiles.user_id
  SELECT p.user_id INTO v_user_id
  FROM providers prov
  JOIN profiles p ON p.id = prov.profile_id
  WHERE prov.id = v_order_provider_id;

  -- Si pas trouvé, peut-être que provider_id est déjà le profile_id
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id
    FROM profiles
    WHERE id = v_order_provider_id;
  END IF;

  -- Si toujours pas trouvé, peut-être que c'est déjà un user_id
  IF v_user_id IS NULL THEN
    -- Vérifier si c'est un user_id valide
    IF EXISTS(SELECT 1 FROM auth.users WHERE id = v_order_provider_id) THEN
      v_user_id := v_order_provider_id;
    END IF;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE WARNING 'Could not find user_id for provider %, skipping order %',
      v_order_provider_id, p_order_id;
    RETURN NULL;
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
    v_user_id,  -- On stocke le user_id, pas le provider_id
    p_order_id,
    v_amount_cents,
    v_fee_cents,
    v_net_cents,
    v_currency,
    'completed',  -- Changé de 'pending' à 'completed' pour déclencher le trigger auto_schedule_payment_release
    jsonb_build_object(
      'created_by', 'system',
      'created_at', NOW(),
      'original_provider_id', v_order_provider_id
    )
  )
  ON CONFLICT (order_id) DO NOTHING
  RETURNING id INTO v_earning_id;

  -- Si pas d'insertion (conflit), récupérer l'ID existant
  IF v_earning_id IS NULL THEN
    SELECT id INTO v_earning_id
    FROM provider_earnings
    WHERE order_id = p_order_id;

    RAISE NOTICE 'Earning already exists for order %', p_order_id;
    RETURN v_earning_id;
  END IF;

  -- Mettre à jour le solde pending du provider
  INSERT INTO provider_balance (provider_id, pending_cents, currency)
  VALUES (v_user_id, v_net_cents, v_currency)
  ON CONFLICT (provider_id) DO UPDATE
  SET
    pending_cents = provider_balance.pending_cents + EXCLUDED.pending_cents,
    updated_at = NOW();

  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_provider_earning IS 'Crée un gain pour le prestataire à partir d une commande (gère providers/profiles/users)';

-- ============================================================================
-- 4. Recréer la vue avec les bonnes jointures
-- ============================================================================

DROP VIEW IF EXISTS v_provider_earnings_summary;

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

COMMENT ON VIEW v_provider_earnings_summary IS 'Résumé des gains par prestataire (provider_id = user_id)';

-- ============================================================================
-- 5. Script de migration rétroactive CORRIGÉ
-- ============================================================================

DO $$
DECLARE
  v_order RECORD;
  v_earning_id UUID;
  v_count_success INTEGER := 0;
  v_count_skipped INTEGER := 0;
  v_count_failed INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting retroactive earnings creation...';

  FOR v_order IN
    SELECT id, provider_id, status, total_cents, fees_cents
    FROM orders
    WHERE status IN ('completed', 'delivered')
    ORDER BY created_at ASC
  LOOP
    -- Vérifier si déjà traité
    IF EXISTS(SELECT 1 FROM provider_earnings WHERE order_id = v_order.id) THEN
      v_count_skipped := v_count_skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      -- Créer l'earning (la fonction gère la résolution provider_id → user_id)
      v_earning_id := create_provider_earning(v_order.id);

      IF v_earning_id IS NULL THEN
        v_count_skipped := v_count_skipped + 1;
        CONTINUE;
      END IF;

      -- Si la commande est 'completed', libérer immédiatement le paiement
      IF v_order.status = 'completed' THEN
        PERFORM release_provider_earning(v_order.id);
      END IF;

      v_count_success := v_count_success + 1;

      IF v_count_success % 10 = 0 THEN
        RAISE NOTICE 'Progress: % earnings created...', v_count_success;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_count_failed := v_count_failed + 1;
      RAISE WARNING 'Failed to create earning for order %: %', v_order.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '=== MIGRATION COMPLETE ===';
  RAISE NOTICE 'Success: %', v_count_success;
  RAISE NOTICE 'Skipped: %', v_count_skipped;
  RAISE NOTICE 'Failed: %', v_count_failed;
END $$;

-- ============================================================================
-- 6. Vérifications
-- ============================================================================

-- Compter les earnings créés
SELECT
  COUNT(*) AS total_earnings,
  COUNT(DISTINCT provider_id) AS nb_providers,
  SUM(net_amount_cents) / 100.0 AS total_net_euros
FROM provider_earnings;

-- Voir le top 5 des providers
SELECT
  u.email,
  pb.available_cents / 100.0 AS disponible,
  pb.pending_cents / 100.0 AS en_attente,
  pb.total_earned_cents / 100.0 AS total_gagne,
  pb.currency
FROM provider_balance pb
JOIN auth.users u ON u.id = pb.provider_id
ORDER BY pb.total_earned_cents DESC
LIMIT 5;

-- Vérifier les commandes non traitées
SELECT COUNT(*)
FROM orders o
WHERE o.status IN ('completed', 'delivered')
AND NOT EXISTS (SELECT 1 FROM provider_earnings WHERE order_id = o.id);
