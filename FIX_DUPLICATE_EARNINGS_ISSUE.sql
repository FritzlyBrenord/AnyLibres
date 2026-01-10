-- ============================================================================
-- FIX: Corriger le problème de création en double des earnings
-- ============================================================================
-- Problème: La migration rétroactive a traité les commandes 'delivered'
--           qui avaient déjà des earnings créés par le trigger
--
-- Solution:
-- 1. Identifier et supprimer les doublons
-- 2. Recalculer les balances correctement
-- 3. S'assurer que le trigger ne crée pas de doublons
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Diagnostique
-- ============================================================================

DO $$
DECLARE
  v_duplicate_count INTEGER;
BEGIN
  RAISE NOTICE '=== DIAGNOSTIC DES DOUBLONS ===';

  -- Compter les doublons
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT order_id
    FROM provider_earnings
    GROUP BY order_id
    HAVING COUNT(*) > 1
  ) duplicates;

  RAISE NOTICE 'Nombre de commandes avec earnings en double: %', v_duplicate_count;

  IF v_duplicate_count = 0 THEN
    RAISE NOTICE 'Aucun doublon trouvé, le problème est ailleurs';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2: Sauvegarder l'état actuel des balances
-- ============================================================================

CREATE TEMP TABLE IF NOT EXISTS balance_backup AS
SELECT * FROM provider_balance;

RAISE NOTICE 'Sauvegarde des balances créée';

-- ============================================================================
-- ÉTAPE 3: Identifier les doublons
-- ============================================================================

-- Voir les doublons en détail
SELECT
  'DOUBLONS DÉTECTÉS' as status,
  order_id,
  COUNT(*) as nb_earnings,
  ARRAY_AGG(id ORDER BY created_at) as earning_ids,
  ARRAY_AGG(net_amount_cents ORDER BY created_at) as amounts,
  ARRAY_AGG(created_at ORDER BY created_at) as dates
FROM provider_earnings
GROUP BY order_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- ÉTAPE 4: Supprimer les doublons (garder le plus ancien)
-- ============================================================================

-- Créer une table temporaire avec les IDs à supprimer
CREATE TEMP TABLE earnings_to_delete AS
SELECT id
FROM (
  SELECT
    id,
    order_id,
    ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at ASC) as rn
  FROM provider_earnings
) ranked
WHERE rn > 1;

-- Afficher ce qui va être supprimé
SELECT
  'EARNINGS À SUPPRIMER' as status,
  COUNT(*) as total
FROM earnings_to_delete;

-- Supprimer les doublons
DELETE FROM provider_earnings
WHERE id IN (SELECT id FROM earnings_to_delete);

RAISE NOTICE 'Doublons supprimés';

-- ============================================================================
-- ÉTAPE 5: Recalculer toutes les balances from scratch
-- ============================================================================

-- Réinitialiser toutes les balances
UPDATE provider_balance
SET
  pending_cents = 0,
  available_cents = 0,
  total_earned_cents = 0;

RAISE NOTICE 'Balances réinitialisées';

-- Recalculer les balances à partir des earnings
DO $$
DECLARE
  v_earning RECORD;
  v_provider_id UUID;
BEGIN
  RAISE NOTICE 'Recalcul des balances...';

  FOR v_earning IN
    SELECT
      provider_id,
      net_amount_cents,
      currency,
      order_id
    FROM provider_earnings
    ORDER BY created_at ASC
  LOOP
    -- Vérifier si le earning a une scheduled_release
    IF EXISTS(
      SELECT 1 FROM scheduled_releases
      WHERE order_id = v_earning.order_id
      AND status = 'completed'
    ) THEN
      -- C'est disponible
      UPDATE provider_balance
      SET
        available_cents = available_cents + v_earning.net_amount_cents,
        total_earned_cents = total_earned_cents + v_earning.net_amount_cents,
        updated_at = NOW()
      WHERE provider_id = v_earning.provider_id;
    ELSE
      -- C'est en attente
      UPDATE provider_balance
      SET
        pending_cents = pending_cents + v_earning.net_amount_cents,
        total_earned_cents = total_earned_cents + v_earning.net_amount_cents,
        updated_at = NOW()
      WHERE provider_id = v_earning.provider_id;
    END IF;

    -- Créer la balance si elle n'existe pas
    IF NOT FOUND THEN
      INSERT INTO provider_balance (
        provider_id,
        pending_cents,
        available_cents,
        total_earned_cents,
        currency
      ) VALUES (
        v_earning.provider_id,
        v_earning.net_amount_cents,
        0,
        v_earning.net_amount_cents,
        v_earning.currency
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Balances recalculées';
END $$;

-- ============================================================================
-- ÉTAPE 6: Améliorer create_provider_earning pour éviter les doublons
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
  -- VÉRIFICATION CRITIQUE: Si l'earning existe déjà, retourner son ID
  SELECT id INTO v_earning_id
  FROM provider_earnings
  WHERE order_id = p_order_id;

  IF v_earning_id IS NOT NULL THEN
    RAISE NOTICE 'Earning already exists for order %, returning existing ID', p_order_id;
    RETURN v_earning_id;
  END IF;

  -- Récupérer le provider_id de la commande
  SELECT provider_id, currency
  INTO v_order_provider_id, v_currency
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Trouver le user_id correspondant au provider
  SELECT p.user_id INTO v_user_id
  FROM providers prov
  JOIN profiles p ON p.id = prov.profile_id
  WHERE prov.id = v_order_provider_id;

  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id
    FROM profiles
    WHERE id = v_order_provider_id;
  END IF;

  IF v_user_id IS NULL THEN
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

  -- Créer l'earning (avec ON CONFLICT DO NOTHING pour sécurité)
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
    v_user_id,
    p_order_id,
    v_amount_cents,
    v_fee_cents,
    v_net_cents,
    v_currency,
    'completed',
    jsonb_build_object(
      'created_by', 'system',
      'created_at', NOW(),
      'original_provider_id', v_order_provider_id
    )
  )
  ON CONFLICT (order_id) DO NOTHING
  RETURNING id INTO v_earning_id;

  -- Si ON CONFLICT a été déclenché, récupérer l'ID existant
  IF v_earning_id IS NULL THEN
    SELECT id INTO v_earning_id
    FROM provider_earnings
    WHERE order_id = p_order_id;

    RAISE NOTICE 'ON CONFLICT triggered - earning already exists for order %', p_order_id;
    RETURN v_earning_id;
  END IF;

  -- Mettre à jour le solde pending du provider
  INSERT INTO provider_balance (provider_id, pending_cents, currency)
  VALUES (v_user_id, v_net_cents, v_currency)
  ON CONFLICT (provider_id) DO UPDATE
  SET
    pending_cents = provider_balance.pending_cents + EXCLUDED.pending_cents,
    total_earned_cents = provider_balance.total_earned_cents + EXCLUDED.pending_cents,
    updated_at = NOW();

  RAISE NOTICE 'Created new earning % for order %', v_earning_id, p_order_id;
  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_provider_earning IS 'Crée un gain pour le prestataire (vérifie les doublons en premier)';

-- ============================================================================
-- ÉTAPE 7: Vérifications finales
-- ============================================================================

-- Vérifier qu'il n'y a plus de doublons
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Aucun doublon'
    ELSE '❌ ENCORE DES DOUBLONS: ' || COUNT(*)::TEXT
  END as status
FROM (
  SELECT order_id
  FROM provider_earnings
  GROUP BY order_id
  HAVING COUNT(*) > 1
) duplicates;

-- Comparer les balances avant/après
SELECT
  'COMPARAISON BALANCES' as info,
  b.provider_id,
  old.pending_cents / 100.0 as old_pending,
  b.pending_cents / 100.0 as new_pending,
  old.available_cents / 100.0 as old_available,
  b.available_cents / 100.0 as new_available
FROM provider_balance b
LEFT JOIN balance_backup old ON old.provider_id = b.provider_id
WHERE old.pending_cents != b.pending_cents
   OR old.available_cents != b.available_cents
ORDER BY b.provider_id;

-- Afficher l'état final
SELECT
  'ÉTAT FINAL' as info,
  COUNT(*) as nb_providers,
  SUM(pending_cents) / 100.0 as total_pending_eur,
  SUM(available_cents) / 100.0 as total_available_eur,
  SUM(total_earned_cents) / 100.0 as total_earned_eur
FROM provider_balance;

RAISE NOTICE '=== CORRECTION TERMINÉE ===';
