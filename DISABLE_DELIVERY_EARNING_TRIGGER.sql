-- ============================================================================
-- FIX: Désactiver la création automatique d'earning lors de la livraison
-- ============================================================================
-- Problème: Le trigger crée un earning quand status = 'delivered'
--           mais il ne devrait être créé que quand client accepte (completed)
--
-- Solution: Supprimer le trigger sur 'delivered'
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Supprimer le trigger qui crée earning sur 'delivered'
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auto_create_earning ON orders;
DROP FUNCTION IF EXISTS auto_create_earning_on_delivery();

DO $$
BEGIN
  RAISE NOTICE 'Trigger sur delivered supprimé';
END $$;

-- ============================================================================
-- ÉTAPE 2: Garder seulement le trigger sur 'completed' (acceptation client)
-- ============================================================================

-- Vérifier que ce trigger existe toujours
SELECT
  'Trigger sur completed' as info,
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgname LIKE '%release%'
AND tgrelid = 'orders'::regclass;

-- ============================================================================
-- ÉTAPE 3: S'assurer que /api/orders/accept appelle bien create_provider_earning
-- ============================================================================

-- La fonction create_provider_earning sera appelée par l'API /api/orders/accept
-- quand le client accepte la livraison

-- Vérifier que la fonction existe
SELECT
  'Fonction create_provider_earning' as info,
  proname as function_name,
  'EXISTS' as status
FROM pg_proc
WHERE proname = 'create_provider_earning';

-- ============================================================================
-- ÉTAPE 4: Nettoyer les données incorrectes
-- ============================================================================

-- Trouver les earnings créés pour des commandes 'delivered' (pas encore acceptées)
SELECT
  'Earnings pour commandes delivered (à vérifier)' as info,
  COUNT(*) as total
FROM provider_earnings pe
JOIN orders o ON o.id = pe.order_id
WHERE o.status = 'delivered';

-- Ces earnings ne devraient peut-être pas exister
-- Mais on ne les supprime PAS automatiquement car ils peuvent être légitimes
-- (commandes livrées puis acceptées)

-- ============================================================================
-- ÉTAPE 5: Recalculer la balance du provider problématique
-- ============================================================================

DO $$
DECLARE
  v_total_pending BIGINT := 0;
  v_total_available BIGINT := 0;
  v_total_earned BIGINT := 0;
  v_provider_id UUID := '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';
BEGIN
  RAISE NOTICE '=== RECALCUL DE LA BALANCE ===';

  -- Calculer le total earned (tous les earnings)
  SELECT COALESCE(SUM(net_amount_cents), 0)
  INTO v_total_earned
  FROM provider_earnings
  WHERE provider_id = v_provider_id;

  RAISE NOTICE 'Total earned: % cents (% EUR)', v_total_earned, v_total_earned / 100.0;

  -- Calculer le available (releases completed)
  SELECT COALESCE(SUM(sr.amount_cents), 0)
  INTO v_total_available
  FROM scheduled_releases sr
  WHERE sr.provider_id = v_provider_id
  AND sr.status = 'completed';

  RAISE NOTICE 'Total available: % cents (% EUR)', v_total_available, v_total_available / 100.0;

  -- Calculer le pending (earned - available - withdrawn)
  SELECT
    GREATEST(
      v_total_earned - v_total_available - COALESCE(pb.withdrawn_cents, 0),
      0
    )
  INTO v_total_pending
  FROM provider_balance pb
  WHERE pb.provider_id = v_provider_id;

  RAISE NOTICE 'Total pending: % cents (% EUR)', v_total_pending, v_total_pending / 100.0;

  -- Mettre à jour la balance
  UPDATE provider_balance
  SET
    pending_cents = v_total_pending,
    available_cents = v_total_available,
    total_earned_cents = v_total_earned,
    updated_at = NOW()
  WHERE provider_id = v_provider_id;

  RAISE NOTICE 'Balance recalculée et mise à jour';
END $$;

-- Vérifier la balance finale
SELECT
  'Balance finale' as info,
  provider_id,
  pending_cents / 100.0 as pending_eur,
  available_cents / 100.0 as available_eur,
  withdrawn_cents / 100.0 as withdrawn_eur,
  total_earned_cents / 100.0 as total_earned_eur
FROM provider_balance
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

-- Après ce script:
-- 1. Livraison (delivered) → N'appelle plus create_provider_earning
-- 2. Acceptation (completed) → /api/orders/accept appelle create_provider_earning
-- 3. Earning créé → Trigger auto_schedule_payment_release se déclenche
-- 4. Balance mise à jour correctement
