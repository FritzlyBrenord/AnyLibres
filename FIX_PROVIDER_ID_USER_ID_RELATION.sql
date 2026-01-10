-- ============================================================================
-- FIX: Résoudre le problème de relation provider_id vs user_id
-- ============================================================================
-- Problème:
--   - orders.provider_id pointe vers providers.id
--   - provider_balance.provider_id pointe vers auth.users.id (user_id)
--   - Il faut passer par profiles pour faire la liaison
--
-- Structure:
--   auth.users.id (user_id)
--     → profiles.user_id
--       → providers.profile_id
--         → orders.provider_id
-- ============================================================================

-- ============================================================================
-- PARTIE 1: Fonction helper pour obtenir user_id depuis provider_id
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_id_from_provider_id(
  p_provider_id UUID
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Remonter la chaîne: provider → profile → user
  SELECT pr.user_id INTO v_user_id
  FROM providers prov
  INNER JOIN profiles pr ON pr.id = prov.profile_id
  WHERE prov.id = p_provider_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot find user_id for provider_id: %', p_provider_id;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_id_from_provider_id IS 'Convertit provider_id vers user_id en passant par profiles';

-- ============================================================================
-- PARTIE 2: Corriger create_provider_earning pour utiliser user_id
-- ============================================================================

CREATE OR REPLACE FUNCTION create_provider_earning(
  p_order_id UUID
) RETURNS UUID AS $$
DECLARE
  v_provider_id UUID; -- ID de la table providers
  v_user_id UUID;     -- ID de auth.users
  v_earning_id UUID;
  v_amount_cents BIGINT;
  v_fee_cents BIGINT;
  v_net_cents BIGINT;
  v_currency TEXT;
BEGIN
  -- Récupérer le provider_id de la commande
  SELECT provider_id, currency
  INTO v_provider_id, v_currency
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Convertir provider_id → user_id
  v_user_id := get_user_id_from_provider_id(v_provider_id);

  -- Calculer les montants
  SELECT * INTO v_amount_cents, v_fee_cents, v_net_cents
  FROM calculate_provider_net_amount(p_order_id);

  -- Créer l'earning avec BOTH provider_id ET user_id
  INSERT INTO provider_earnings (
    provider_id,
    user_id,        -- ← Ajouter user_id
    order_id,
    amount_cents,
    platform_fee_cents,
    net_amount_cents,
    currency,
    status,
    metadata
  ) VALUES (
    v_provider_id,  -- provider.id (pour info)
    v_user_id,      -- auth.users.id (pour FK)
    p_order_id,
    v_amount_cents,
    v_fee_cents,
    v_net_cents,
    v_currency,
    'pending',
    jsonb_build_object(
      'created_by', 'system',
      'created_at', NOW(),
      'provider_id', v_provider_id
    )
  )
  RETURNING id INTO v_earning_id;

  -- Mettre à jour le solde avec user_id
  INSERT INTO provider_balance (provider_id, pending_cents, total_earned_cents, currency)
  VALUES (v_user_id, v_net_cents, v_net_cents, v_currency)
  ON CONFLICT (provider_id) DO UPDATE
  SET
    pending_cents = provider_balance.pending_cents + EXCLUDED.pending_cents,
    total_earned_cents = provider_balance.total_earned_cents + EXCLUDED.total_earned_cents,
    updated_at = NOW();

  RAISE NOTICE '✅ Created earning for order % (provider_id=%, user_id=%)',
    p_order_id, v_provider_id, v_user_id;

  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTIE 3: Corriger release_provider_earning pour utiliser user_id
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
BEGIN
  -- Récupérer l'earning avec user_id
  SELECT id, provider_id, user_id, net_amount_cents
  INTO v_earning_id, v_provider_id, v_user_id, v_net_cents
  FROM provider_earnings
  WHERE order_id = p_order_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE NOTICE '⚠️  No pending earning found for order: %', p_order_id;
    RETURN FALSE;
  END IF;

  -- Si user_id est NULL, le calculer
  IF v_user_id IS NULL THEN
    v_user_id := get_user_id_from_provider_id(v_provider_id);

    -- Mettre à jour l'earning avec user_id
    UPDATE provider_earnings
    SET user_id = v_user_id
    WHERE id = v_earning_id;
  END IF;

  -- Vérifier le solde actuel
  SELECT pending_cents INTO v_current_pending
  FROM provider_balance
  WHERE provider_id = v_user_id;

  -- Protection: Si le solde pending est insuffisant
  IF v_current_pending < v_net_cents THEN
    RAISE WARNING '⛔ Insufficient pending balance for user %: has % but needs %',
      v_user_id, v_current_pending, v_net_cents;
    RETURN FALSE;
  END IF;

  -- Mettre à jour le statut de l'earning
  UPDATE provider_earnings
  SET
    status = 'completed',
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = v_earning_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE NOTICE '⚠️  Earning already released for order: %', p_order_id;
    RETURN FALSE;
  END IF;

  -- Mettre à jour le solde avec user_id
  UPDATE provider_balance
  SET
    pending_cents = pending_cents - v_net_cents,
    available_cents = available_cents + v_net_cents,
    updated_at = NOW()
  WHERE provider_id = v_user_id;

  RAISE NOTICE '✅ Released % cents to user % (provider %)',
    v_net_cents, v_user_id, v_provider_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTIE 4: Migrer les données existantes (ajouter user_id)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_user_id UUID;
BEGIN
  RAISE NOTICE '🔄 Migrating existing earnings to add user_id...';

  -- Mettre à jour tous les earnings qui n'ont pas de user_id
  FOR r IN
    SELECT pe.id, pe.provider_id, pe.order_id
    FROM provider_earnings pe
    WHERE pe.user_id IS NULL
  LOOP
    BEGIN
      -- Obtenir user_id depuis provider_id
      v_user_id := get_user_id_from_provider_id(r.provider_id);

      -- Mettre à jour l'earning
      UPDATE provider_earnings
      SET user_id = v_user_id
      WHERE id = r.id;

      RAISE NOTICE '✅ Updated earning % with user_id=%', r.id, v_user_id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Failed to migrate earning %: %', r.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '✅ Migration completed!';
END $$;

-- ============================================================================
-- PARTIE 5: Migrer les balances existantes (corriger provider_id)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_user_id UUID;
  v_provider_record_id UUID;
BEGIN
  RAISE NOTICE '🔄 Fixing provider_balance provider_id...';

  -- Trouver les balances avec mauvais provider_id
  FOR r IN
    SELECT pb.id, pb.provider_id
    FROM provider_balance pb
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = pb.provider_id
    )
  LOOP
    BEGIN
      -- Le provider_id actuel est en fait un providers.id
      v_provider_record_id := r.provider_id;

      -- Obtenir le vrai user_id
      v_user_id := get_user_id_from_provider_id(v_provider_record_id);

      RAISE NOTICE 'Fixing balance %: provider_id % → user_id %',
        r.id, v_provider_record_id, v_user_id;

      -- Vérifier si une balance existe déjà avec ce user_id
      IF EXISTS (SELECT 1 FROM provider_balance WHERE provider_id = v_user_id) THEN
        -- Fusionner les balances
        UPDATE provider_balance
        SET
          pending_cents = pending_cents + (SELECT pending_cents FROM provider_balance WHERE id = r.id),
          available_cents = available_cents + (SELECT available_cents FROM provider_balance WHERE id = r.id),
          withdrawn_cents = withdrawn_cents + (SELECT withdrawn_cents FROM provider_balance WHERE id = r.id),
          total_earned_cents = total_earned_cents + (SELECT total_earned_cents FROM provider_balance WHERE id = r.id),
          updated_at = NOW()
        WHERE provider_id = v_user_id;

        -- Supprimer l'ancienne balance
        DELETE FROM provider_balance WHERE id = r.id;

        RAISE NOTICE '✅ Merged balance into existing user_id=%', v_user_id;
      ELSE
        -- Mettre à jour provider_id → user_id
        UPDATE provider_balance
        SET provider_id = v_user_id
        WHERE id = r.id;

        RAISE NOTICE '✅ Updated balance provider_id=%', v_user_id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Failed to fix balance %: %', r.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '✅ Balance fix completed!';
END $$;

-- ============================================================================
-- PARTIE 6: Recalculer tous les soldes (avec user_id correct)
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
  RAISE NOTICE '🔄 Recalculating all balances with correct user_id...';

  FOR r IN
    SELECT DISTINCT user_id
    FROM provider_earnings
    WHERE user_id IS NOT NULL
  LOOP
    -- Calculer depuis earnings (en utilisant user_id)
    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_total_earned
    FROM provider_earnings
    WHERE user_id = r.user_id;

    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_pending
    FROM provider_earnings
    WHERE user_id = r.user_id AND status = 'pending';

    SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_completed
    FROM provider_earnings
    WHERE user_id = r.user_id AND status = 'completed';

    -- Calculer withdrawals (en utilisant user_id via profile)
    SELECT COALESCE(SUM(pw.net_amount_cents), 0) INTO v_withdrawn
    FROM provider_withdrawals pw
    INNER JOIN profiles pr ON pr.user_id = r.user_id
    INNER JOIN providers prov ON prov.profile_id = pr.id
    WHERE pw.provider_id = prov.id AND pw.status = 'completed';

    v_available := v_completed - v_withdrawn;

    -- Protection
    v_total_earned := GREATEST(0, v_total_earned);
    v_pending := GREATEST(0, v_pending);
    v_available := GREATEST(0, v_available);
    v_withdrawn := GREATEST(0, v_withdrawn);

    -- Insérer ou mettre à jour
    INSERT INTO provider_balance (provider_id, total_earned_cents, pending_cents, available_cents, withdrawn_cents)
    VALUES (r.user_id, v_total_earned, v_pending, v_available, v_withdrawn)
    ON CONFLICT (provider_id) DO UPDATE
    SET
      total_earned_cents = EXCLUDED.total_earned_cents,
      pending_cents = EXCLUDED.pending_cents,
      available_cents = EXCLUDED.available_cents,
      withdrawn_cents = EXCLUDED.withdrawn_cents,
      updated_at = NOW();

    RAISE NOTICE '✅ Recalculated user %: earned=% pending=% available=% withdrawn=%',
      r.user_id, v_total_earned, v_pending, v_available, v_withdrawn;
  END LOOP;

  RAISE NOTICE '✅ All balances recalculated!';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Vérifier que tous les earnings ont un user_id
SELECT
  COUNT(*) as total_earnings,
  COUNT(user_id) as with_user_id,
  COUNT(*) - COUNT(user_id) as missing_user_id
FROM provider_earnings;

-- Vérifier que tous les provider_balance ont un user_id valide
SELECT
  pb.provider_id,
  CASE
    WHEN u.id IS NULL THEN 'INVALID'
    ELSE 'VALID'
  END as status
FROM provider_balance pb
LEFT JOIN auth.users u ON u.id = pb.provider_id;

-- Afficher un résumé
SELECT
  pb.provider_id as user_id,
  pr.email,
  prov.company_name,
  pb.total_earned_cents / 100.0 as total_eur,
  pb.pending_cents / 100.0 as pending_eur,
  pb.available_cents / 100.0 as available_eur
FROM provider_balance pb
INNER JOIN profiles pr ON pr.user_id = pb.provider_id
LEFT JOIN providers prov ON prov.profile_id = pr.id
ORDER BY pb.updated_at DESC
LIMIT 10;

RAISE NOTICE '🎉 FIX PROVIDER_ID → USER_ID APPLIQUÉ AVEC SUCCÈS!';
