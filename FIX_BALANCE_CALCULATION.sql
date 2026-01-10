-- ============================================================================
-- FIX: Corriger le calcul des balances lors de la livraison
-- ============================================================================
-- Problème: pending_cents devient négatif lors de la création d'une livraison
-- Cause probable: Calcul incorrect dans create_provider_earning ou double UPDATE
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Diagnostic de la balance actuelle
-- ============================================================================

-- Voir la balance du provider problématique
SELECT
  'Balance actuelle du provider' as info,
  provider_id,
  pending_cents / 100.0 as pending_eur,
  available_cents / 100.0 as available_eur,
  withdrawn_cents / 100.0 as withdrawn_eur,
  total_earned_cents / 100.0 as total_earned_eur
FROM provider_balance
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';

-- Voir tous les earnings de ce provider
SELECT
  'Earnings du provider' as info,
  pe.id,
  pe.order_id,
  pe.net_amount_cents / 100.0 as net_eur,
  pe.status,
  pe.created_at,
  o.status as order_status
FROM provider_earnings pe
LEFT JOIN orders o ON o.id = pe.order_id
WHERE pe.provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6'
ORDER BY pe.created_at DESC;

-- Voir les scheduled_releases pour ce provider
SELECT
  'Scheduled releases' as info,
  sr.id,
  sr.order_id,
  sr.amount_cents / 100.0 as amount_eur,
  sr.status,
  sr.delay_hours,
  sr.release_at
FROM scheduled_releases sr
WHERE sr.provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6'
ORDER BY sr.created_at DESC;

-- ============================================================================
-- ÉTAPE 2: Recalculer la balance correcte pour ce provider
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

  RAISE NOTICE 'Total earned: % cents', v_total_earned;

  -- Calculer le available (releases completed)
  SELECT COALESCE(SUM(sr.amount_cents), 0)
  INTO v_total_available
  FROM scheduled_releases sr
  WHERE sr.provider_id = v_provider_id
  AND sr.status = 'completed';

  RAISE NOTICE 'Total available (releases completed): % cents', v_total_available;

  -- Calculer le pending (earned - available - withdrawn)
  SELECT v_total_earned - v_total_available - COALESCE(pb.withdrawn_cents, 0)
  INTO v_total_pending
  FROM provider_balance pb
  WHERE pb.provider_id = v_provider_id;

  RAISE NOTICE 'Total pending calculé: % cents', v_total_pending;

  -- Mettre à jour la balance
  UPDATE provider_balance
  SET
    pending_cents = v_total_pending,
    available_cents = v_total_available,
    total_earned_cents = v_total_earned,
    updated_at = NOW()
  WHERE provider_id = v_provider_id;

  RAISE NOTICE 'Balance mise à jour';
END $$;

-- Vérifier la nouvelle balance
SELECT
  'Nouvelle balance' as info,
  provider_id,
  pending_cents / 100.0 as pending_eur,
  available_cents / 100.0 as available_eur,
  withdrawn_cents / 100.0 as withdrawn_eur,
  total_earned_cents / 100.0 as total_earned_eur
FROM provider_balance
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';

-- ============================================================================
-- ÉTAPE 3: Corriger la fonction create_provider_earning
-- ============================================================================
-- Cette fonction est appelée par le trigger quand status = 'delivered'
-- Elle doit AJOUTER au pending, pas SOUSTRAIRE

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
  -- VÉRIFICATION CRITIQUE: Si l'earning existe déjà, retourner son ID sans rien faire
  SELECT id INTO v_earning_id
  FROM provider_earnings
  WHERE order_id = p_order_id;

  IF v_earning_id IS NOT NULL THEN
    RAISE NOTICE 'Earning already exists for order %, skipping creation', p_order_id;
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

  RAISE NOTICE 'Order %: amount=% fee=% net=%', p_order_id, v_amount_cents, v_fee_cents, v_net_cents;

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

  -- Si ON CONFLICT a été déclenché, ne rien faire d'autre
  IF v_earning_id IS NULL THEN
    SELECT id INTO v_earning_id
    FROM provider_earnings
    WHERE order_id = p_order_id;

    RAISE NOTICE 'ON CONFLICT - earning already exists for order %', p_order_id;
    RETURN v_earning_id;
  END IF;

  RAISE NOTICE 'Created earning % - adding % cents to pending', v_earning_id, v_net_cents;

  -- IMPORTANT: AJOUTER au pending, pas soustraire !
  INSERT INTO provider_balance (provider_id, pending_cents, total_earned_cents, currency)
  VALUES (v_user_id, v_net_cents, v_net_cents, v_currency)
  ON CONFLICT (provider_id) DO UPDATE
  SET
    pending_cents = provider_balance.pending_cents + EXCLUDED.pending_cents,
    total_earned_cents = provider_balance.total_earned_cents + EXCLUDED.total_earned_cents,
    updated_at = NOW();

  RAISE NOTICE 'Balance updated - added % cents to pending for provider %', v_net_cents, v_user_id;

  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_provider_earning IS 'Crée un gain pour le prestataire (vérifie doublons, AJOUTE au pending)';

-- ============================================================================
-- ÉTAPE 4: Vérifier que le trigger auto_schedule_payment_release N'UPDATE PAS pending_cents
-- ============================================================================

-- Cette fonction ne doit PAS toucher à pending_cents
-- Elle doit seulement créer scheduled_release
-- Si delay_hours = 0, elle transfert pending → available

SELECT
  'Vérification du trigger auto_schedule_payment_release' as info,
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'auto_schedule_payment_release';

-- ============================================================================
-- ÉTAPE 5: Tester avec une nouvelle commande
-- ============================================================================

-- Instructions pour tester:
-- 1. Créer une nouvelle commande de test
-- 2. La livrer
-- 3. Vérifier que pending_cents AUGMENTE (ne devient pas négatif)
-- 4. Vérifier les logs dans Supabase

-- Pour voir les logs après le test:
-- SELECT * FROM provider_earnings WHERE created_at > NOW() - INTERVAL '5 minutes' ORDER BY created_at DESC;
-- SELECT * FROM scheduled_releases WHERE created_at > NOW() - INTERVAL '5 minutes' ORDER BY created_at DESC;
-- SELECT * FROM provider_balance WHERE updated_at > NOW() - INTERVAL '5 minutes';
