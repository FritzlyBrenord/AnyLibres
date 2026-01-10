-- ============================================================================
-- TEST DIRECT DU TRIGGER: Simuler le processus complet
-- ============================================================================
-- Ce script permet de tester le trigger sans passer par l'interface
-- Il crée une commande de test et simule le processus complet
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Préparer les données de test
-- ============================================================================

DO $$
DECLARE
  v_test_order_id UUID;
  v_test_client_id UUID;
  v_test_provider_id UUID; -- providers.id
  v_test_user_id UUID;     -- auth.users.id du provider
  v_earning_id UUID;
  v_initial_pending BIGINT;
  v_initial_available BIGINT;
  v_final_pending BIGINT;
  v_final_available BIGINT;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 TEST DU TRIGGER AUTOMATIQUE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- 1. Trouver un provider existant
  SELECT prov.id, pr.user_id
  INTO v_test_provider_id, v_test_user_id
  FROM providers prov
  INNER JOIN profiles pr ON pr.id = prov.profile_id
  LIMIT 1;

  IF v_test_provider_id IS NULL THEN
    RAISE EXCEPTION '❌ Aucun provider trouvé dans la base de données!';
  END IF;

  RAISE NOTICE '✅ Provider de test trouvé:';
  RAISE NOTICE '   - provider_id (providers.id): %', v_test_provider_id;
  RAISE NOTICE '   - user_id (auth.users.id): %', v_test_user_id;

  -- 2. Trouver un client existant (autre que le provider)
  SELECT pr.user_id
  INTO v_test_client_id
  FROM profiles pr
  WHERE pr.role = 'client' AND pr.user_id != v_test_user_id
  LIMIT 1;

  IF v_test_client_id IS NULL THEN
    -- Si pas de client différent, utiliser n'importe quel user
    SELECT user_id INTO v_test_client_id
    FROM profiles
    WHERE user_id != v_test_user_id
    LIMIT 1;

    IF v_test_client_id IS NULL THEN
      -- En dernier recours, utiliser le même user
      v_test_client_id := v_test_user_id;
      RAISE NOTICE '⚠️  Pas d''autre user trouvé, utilisation du provider comme client';
    END IF;
  END IF;

  RAISE NOTICE '✅ Client de test: %', v_test_client_id;
  RAISE NOTICE '';

  -- 3. Sauvegarder la balance actuelle
  SELECT pending_cents, available_cents
  INTO v_initial_pending, v_initial_available
  FROM provider_balance
  WHERE provider_id = v_test_user_id;

  IF v_initial_pending IS NULL THEN
    v_initial_pending := 0;
    v_initial_available := 0;
    RAISE NOTICE '⚠️  Aucune balance existante, création automatique';
  END IF;

  RAISE NOTICE '💰 Balance AVANT test:';
  RAISE NOTICE '   - Pending: % EUR', v_initial_pending / 100.0;
  RAISE NOTICE '   - Available: % EUR', v_initial_available / 100.0;
  RAISE NOTICE '';

  -- ============================================================================
  -- ÉTAPE 2: Créer une commande de test
  -- ============================================================================

  RAISE NOTICE '📦 Création d''une commande de test...';

  INSERT INTO orders (
    client_id,
    provider_id,
    status,
    total_cents,
    currency,
    created_at,
    updated_at
  ) VALUES (
    v_test_client_id,
    v_test_provider_id,
    'delivered', -- Statut avant acceptation
    50000,       -- 500 EUR
    'EUR',
    NOW(),
    NOW()
  ) RETURNING id INTO v_test_order_id;

  RAISE NOTICE '✅ Commande créée: %', v_test_order_id;
  RAISE NOTICE '   - Montant: 500 EUR';
  RAISE NOTICE '   - Statut initial: delivered';
  RAISE NOTICE '';

  -- ============================================================================
  -- ÉTAPE 3: Créer l'earning (simule create_provider_earning)
  -- ============================================================================

  RAISE NOTICE '💵 Création de l''earning...';

  v_earning_id := create_provider_earning(v_test_order_id);

  RAISE NOTICE '✅ Earning créé: %', v_earning_id;
  RAISE NOTICE '';

  -- ============================================================================
  -- ÉTAPE 4: Simuler l'acceptation (changer status → completed)
  -- ============================================================================

  RAISE NOTICE '🔄 SIMULATION: Changement status → completed';
  RAISE NOTICE '   ⚡ LE TRIGGER VA SE DÉCLENCHER MAINTENANT!';
  RAISE NOTICE '';

  -- Ceci va déclencher le trigger trg_auto_apply_payment_rules
  UPDATE orders
  SET
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_test_order_id;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 RÉSULTATS DU TEST';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- ============================================================================
  -- ÉTAPE 5: Vérifier les résultats
  -- ============================================================================

  -- Vérifier la balance finale
  SELECT pending_cents, available_cents
  INTO v_final_pending, v_final_available
  FROM provider_balance
  WHERE provider_id = v_test_user_id;

  RAISE NOTICE '💰 Balance APRÈS test:';
  RAISE NOTICE '   - Pending: % EUR (avant: % EUR)', v_final_pending / 100.0, v_initial_pending / 100.0;
  RAISE NOTICE '   - Available: % EUR (avant: % EUR)', v_final_available / 100.0, v_initial_available / 100.0;
  RAISE NOTICE '';

  -- Vérifier le statut de l'earning
  DECLARE
    v_earning_status TEXT;
  BEGIN
    SELECT status INTO v_earning_status
    FROM provider_earnings
    WHERE id = v_earning_id;

    RAISE NOTICE '📋 Statut de l''earning:';
    IF v_earning_status = 'completed' THEN
      RAISE NOTICE '   ✅ COMPLETED (libéré avec succès!)';
    ELSIF v_earning_status = 'pending' THEN
      RAISE NOTICE '   ⏳ PENDING (en attente de libération)';
    ELSE
      RAISE NOTICE '   ❓ % (statut inattendu)', v_earning_status;
    END IF;
  END;
  RAISE NOTICE '';

  -- Vérifier si un scheduled_release a été créé
  DECLARE
    v_scheduled_count INT;
    v_scheduled_release RECORD;
  BEGIN
    SELECT COUNT(*) INTO v_scheduled_count
    FROM scheduled_releases
    WHERE earning_id = v_earning_id;

    IF v_scheduled_count > 0 THEN
      SELECT * INTO v_scheduled_release
      FROM scheduled_releases
      WHERE earning_id = v_earning_id
      ORDER BY created_at DESC
      LIMIT 1;

      RAISE NOTICE '📅 Scheduled release créé:';
      RAISE NOTICE '   - Règle: %', v_scheduled_release.rule_name;
      RAISE NOTICE '   - Délai: % heures', v_scheduled_release.delay_hours;
      RAISE NOTICE '   - Libération prévue: %', v_scheduled_release.release_at;
      RAISE NOTICE '   - Statut: %', v_scheduled_release.status;
    ELSE
      RAISE NOTICE '⚡ Aucun scheduled_release (libération immédiate)';
    END IF;
  END;
  RAISE NOTICE '';

  -- ============================================================================
  -- ÉTAPE 6: Analyser le résultat
  -- ============================================================================

  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🎯 ANALYSE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Calcul des changements
  DECLARE
    v_pending_change BIGINT;
    v_available_change BIGINT;
  BEGIN
    v_pending_change := v_final_pending - v_initial_pending;
    v_available_change := v_final_available - v_initial_available;

    IF v_pending_change > 0 AND v_available_change = 0 THEN
      RAISE NOTICE '✅ TEST RÉUSSI (Mode: Avec délai)';
      RAISE NOTICE '   - Les fonds sont en pending (+% EUR)', v_pending_change / 100.0;
      RAISE NOTICE '   - Un scheduled_release a été créé';
      RAISE NOTICE '   - Les fonds seront libérés plus tard par CRON';

    ELSIF v_pending_change = 0 AND v_available_change > 0 THEN
      RAISE NOTICE '✅ TEST RÉUSSI (Mode: Immédiat)';
      RAISE NOTICE '   - Les fonds ont été libérés immédiatement (+% EUR)', v_available_change / 100.0;
      RAISE NOTICE '   - L''earning est completed';
      RAISE NOTICE '   - Aucun scheduled_release (libération directe)';

    ELSIF v_pending_change = 0 AND v_available_change = 0 THEN
      RAISE NOTICE '❌ TEST ÉCHOUÉ';
      RAISE NOTICE '   - Aucun changement de balance détecté!';
      RAISE NOTICE '   - Le trigger ne s''est probablement pas déclenché';
      RAISE NOTICE '';
      RAISE NOTICE '🔍 Actions à vérifier:';
      RAISE NOTICE '   1. Le trigger existe-t-il? → SELECT * FROM pg_trigger WHERE tgname = ''trg_auto_apply_payment_rules'';';
      RAISE NOTICE '   2. Les règles sont-elles actives? → SELECT * FROM payment_release_rules WHERE is_active = true;';
      RAISE NOTICE '   3. Consultez les logs PostgreSQL pour voir les RAISE NOTICE du trigger';

    ELSE
      RAISE NOTICE '⚠️  RÉSULTAT INATTENDU';
      RAISE NOTICE '   - Pending change: % EUR', v_pending_change / 100.0;
      RAISE NOTICE '   - Available change: % EUR', v_available_change / 100.0;
    END IF;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🧹 NETTOYAGE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Voulez-vous supprimer les données de test?';
  RAISE NOTICE '   Pour garder les données: Ne rien faire';
  RAISE NOTICE '   Pour supprimer: Exécutez le bloc ci-dessous (décommentez)';
  RAISE NOTICE '';
  RAISE NOTICE 'Commande de test ID: %', v_test_order_id;
  RAISE NOTICE 'Earning de test ID: %', v_earning_id;

  -- Décommentez ces lignes si vous voulez nettoyer automatiquement:
  /*
  RAISE NOTICE '';
  RAISE NOTICE '🧹 Suppression des données de test...';

  DELETE FROM scheduled_releases WHERE earning_id = v_earning_id;
  DELETE FROM provider_earnings WHERE id = v_earning_id;
  DELETE FROM orders WHERE id = v_test_order_id;

  -- Restaurer la balance (optionnel, décommentez si nécessaire)
  -- UPDATE provider_balance
  -- SET pending_cents = v_initial_pending,
  --     available_cents = v_initial_available
  -- WHERE provider_id = v_test_user_id;

  RAISE NOTICE '✅ Données de test supprimées';
  */

END $$;

-- ============================================================================
-- COMMANDES RAPIDES POUR DEBUGGING
-- ============================================================================

-- Voir les logs du trigger (si votre BDD supporte pg_stat_statements)
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%auto_apply_payment_rules%';

-- Voir les derniers earnings
SELECT
  pe.id,
  pe.order_id,
  pe.status,
  pe.net_amount_cents / 100.0 as amount_eur,
  pe.created_at,
  pe.paid_at
FROM provider_earnings pe
ORDER BY pe.created_at DESC
LIMIT 5;

-- Voir les dernières commandes
SELECT
  id,
  status,
  total_amount_cents / 100.0 as amount_eur,
  created_at,
  completed_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- Voir les scheduled_releases récents
SELECT
  id,
  earning_id,
  rule_name,
  delay_hours,
  release_at,
  status,
  created_at
FROM scheduled_releases
ORDER BY created_at DESC
LIMIT 5;
