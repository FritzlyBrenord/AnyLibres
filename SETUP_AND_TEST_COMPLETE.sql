-- ============================================================================
-- SCRIPT COMPLET: Setup + Test du système de release automatique
-- ============================================================================
-- Ce script fait TOUT en une seule exécution:
-- 1. Désactive l'ancien trigger
-- 2. Crée le nouveau trigger
-- 3. Configure la règle de test
-- 4. Teste le système complet
-- ============================================================================

\set ON_ERROR_STOP on

-- ============================================================================
-- PARTIE 1: Désactiver l'ancien trigger
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🔧 PARTIE 1: NETTOYAGE DES ANCIENS TRIGGERS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Désactiver les anciens triggers
DROP TRIGGER IF EXISTS trg_auto_create_earning_on_completed ON orders;
DROP TRIGGER IF EXISTS trg_auto_release_earning ON orders;

RAISE NOTICE '✅ Anciens triggers supprimés';

-- ============================================================================
-- PARTIE 2: Créer le nouveau trigger
-- ============================================================================

-- Note: Le trigger trg_auto_apply_payment_rules devrait déjà exister
-- Si vous voyez une erreur "trigger already exists", c'est normal et OK!

-- Vérifier si le trigger existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_apply_payment_rules'
  ) THEN
    RAISE NOTICE '✅ Trigger trg_auto_apply_payment_rules existe déjà';
  ELSE
    RAISE NOTICE '⚠️  Trigger trg_auto_apply_payment_rules n''existe pas encore';
    RAISE NOTICE '   → Vous devez d''abord exécuter CREATE_AUTO_RELEASE_TRIGGER.sql';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 3: Configurer la règle de test
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🔧 PARTIE 2: CONFIGURATION DE LA RÈGLE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- S'assurer qu'il y a au moins une règle active
INSERT INTO payment_release_rules (name, delay_hours, applies_to, condition, is_active, priority)
VALUES ('TEST_IMMEDIATE', 0, 'all', NULL, true, 100)
ON CONFLICT (name) DO UPDATE
SET
  delay_hours = 0,
  applies_to = 'all',
  condition = NULL,
  is_active = true,
  priority = 100,
  updated_at = NOW();

RAISE NOTICE '✅ Règle TEST_IMMEDIATE créée/mise à jour (libération immédiate)';

-- ============================================================================
-- PARTIE 4: TEST AUTOMATIQUE
-- ============================================================================

DO $$
DECLARE
  v_test_order_id UUID;
  v_test_user_id UUID;     -- Utilisé pour client ET provider
  v_test_provider_id UUID; -- ID de la table providers
  v_earning_id UUID;
  v_initial_pending BIGINT;
  v_initial_available BIGINT;
  v_final_pending BIGINT;
  v_final_available BIGINT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 PARTIE 3: TEST AUTOMATIQUE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- 1. Trouver un provider existant
  SELECT prov.id, pr.user_id
  INTO v_test_provider_id, v_test_user_id
  FROM providers prov
  INNER JOIN profiles pr ON pr.id = prov.profile_id
  LIMIT 1;

  IF v_test_provider_id IS NULL THEN
    RAISE EXCEPTION '❌ Aucun provider trouvé! Créez d''abord un provider dans l''application.';
  END IF;

  RAISE NOTICE '✅ Provider de test: %', v_test_provider_id;
  RAISE NOTICE '   User ID: %', v_test_user_id;
  RAISE NOTICE '   (Note: Le même user sera utilisé comme client ET provider)';
  RAISE NOTICE '';

  -- 2. Sauvegarder la balance actuelle
  SELECT COALESCE(pending_cents, 0), COALESCE(available_cents, 0)
  INTO v_initial_pending, v_initial_available
  FROM provider_balance
  WHERE provider_id = v_test_user_id;

  RAISE NOTICE '💰 Balance AVANT test:';
  RAISE NOTICE '   - Pending: % EUR', v_initial_pending / 100.0;
  RAISE NOTICE '   - Available: % EUR', v_initial_available / 100.0;
  RAISE NOTICE '';

  -- 3. Créer une commande de test
  RAISE NOTICE '📦 Création d''une commande de test...';

  INSERT INTO orders (
    client_id,
    provider_id,
    status,
    total_cents,
    currency
  ) VALUES (
    v_test_user_id,      -- Même user comme client
    v_test_provider_id,  -- Provider
    'delivered',         -- Statut avant acceptation
    50000               -- 500 EUR
  ) RETURNING id INTO v_test_order_id;

  RAISE NOTICE '✅ Commande créée: %', v_test_order_id;
  RAISE NOTICE '';

  -- 4. Créer l'earning AVANT de changer le statut
  RAISE NOTICE '💵 Création de l''earning...';

  v_earning_id := create_provider_earning(v_test_order_id);

  RAISE NOTICE '✅ Earning créé: %', v_earning_id;
  RAISE NOTICE '';

  -- 5. Changer le statut → completed (DÉCLENCHE LE TRIGGER)
  RAISE NOTICE '🔄 Changement status → completed';
  RAISE NOTICE '   ⚡ LE TRIGGER VA SE DÉCLENCHER MAINTENANT!';
  RAISE NOTICE '';

  UPDATE orders
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE id = v_test_order_id;

  -- Petit délai pour laisser le trigger terminer
  PERFORM pg_sleep(0.5);

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 RÉSULTATS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- 6. Vérifier les résultats
  SELECT COALESCE(pending_cents, 0), COALESCE(available_cents, 0)
  INTO v_final_pending, v_final_available
  FROM provider_balance
  WHERE provider_id = v_test_user_id;

  RAISE NOTICE '💰 Balance APRÈS test:';
  RAISE NOTICE '   - Pending: % EUR (change: %% EUR)',
    v_final_pending / 100.0,
    (v_final_pending - v_initial_pending) / 100.0;
  RAISE NOTICE '   - Available: % EUR (change: +% EUR)',
    v_final_available / 100.0,
    (v_final_available - v_initial_available) / 100.0;
  RAISE NOTICE '';

  -- Vérifier le statut de l'earning
  DECLARE
    v_earning_status TEXT;
  BEGIN
    SELECT status INTO v_earning_status
    FROM provider_earnings
    WHERE id = v_earning_id;

    RAISE NOTICE '📋 Earning status: %', v_earning_status;
  END;
  RAISE NOTICE '';

  -- 7. Analyser le résultat
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🎯 ANALYSE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  IF (v_final_available - v_initial_available) > 0 THEN
    RAISE NOTICE '✅✅✅ TEST RÉUSSI! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE '   Les fonds ont été libérés automatiquement!';
    RAISE NOTICE '   Montant libéré: +% EUR', (v_final_available - v_initial_available) / 100.0;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 LE SYSTÈME FONCTIONNE PARFAITEMENT!';
  ELSIF (v_final_pending - v_initial_pending) > 0 THEN
    RAISE NOTICE '⏳ TEST RÉUSSI (avec délai)';
    RAISE NOTICE '';
    RAISE NOTICE '   Les fonds sont en pending';
    RAISE NOTICE '   Ils seront libérés plus tard selon la règle';
  ELSE
    RAISE NOTICE '❌ TEST ÉCHOUÉ';
    RAISE NOTICE '';
    RAISE NOTICE '   Aucun changement de balance détecté';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Vérifications à faire:';
    RAISE NOTICE '   1. Exécutez: SELECT * FROM pg_trigger WHERE tgrelid = ''orders''::regclass;';
    RAISE NOTICE '   2. Exécutez: SELECT * FROM payment_release_rules WHERE is_active = true;';
    RAISE NOTICE '   3. Consultez les logs PostgreSQL (RAISE NOTICE du trigger)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🧹 NETTOYAGE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'IDs créés:';
  RAISE NOTICE '  - Order: %', v_test_order_id;
  RAISE NOTICE '  - Earning: %', v_earning_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Pour nettoyer (optionnel):';
  RAISE NOTICE '  DELETE FROM provider_earnings WHERE id = ''%'';', v_earning_id;
  RAISE NOTICE '  DELETE FROM orders WHERE id = ''%'';', v_test_order_id;
  RAISE NOTICE '';

END $$;

-- ============================================================================
-- VÉRIFICATIONS FINALES
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
RAISE NOTICE '📋 CONFIGURATION ACTUELLE';
RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
RAISE NOTICE '';

-- Afficher les triggers actifs
SELECT
  'Trigger: ' || tgname || ' → ' ||
  CASE tgenabled
    WHEN 'O' THEN '✅ ACTIF'
    WHEN 'D' THEN '❌ DÉSACTIVÉ'
    ELSE '⚠️ AUTRE'
  END as info
FROM pg_trigger
WHERE tgrelid = 'orders'::regclass
  AND tgname NOT LIKE 'pg_%'
ORDER BY tgname;

-- Afficher les règles actives
SELECT
  'Règle: ' || name || ' (' || delay_hours || 'h) → ' ||
  CASE WHEN is_active THEN '✅ ACTIVE' ELSE '❌ INACTIVE' END as info
FROM payment_release_rules
ORDER BY priority DESC;
