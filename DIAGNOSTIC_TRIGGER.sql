-- ============================================================================
-- DIAGNOSTIC: Pourquoi le trigger ne fonctionne pas ?
-- ============================================================================

-- 1. Vérifier que le trigger existe
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  CASE tgenabled
    WHEN 'O' THEN '✅ ACTIF'
    WHEN 'D' THEN '❌ DÉSACTIVÉ'
    ELSE '⚠️ AUTRE'
  END as status
FROM pg_trigger
WHERE tgname = 'trg_auto_apply_payment_rules';

-- 2. Vérifier les commandes récentes
SELECT
  id,
  status,
  created_at,
  updated_at,
  completed_at,
  provider_id,
  client_id
FROM orders
ORDER BY updated_at DESC
LIMIT 5;

-- 3. Vérifier les earnings pour ces commandes
SELECT
  pe.id,
  pe.order_id,
  pe.provider_id,
  pe.user_id,
  pe.status,
  pe.net_amount_cents / 100.0 as amount_eur,
  pe.created_at,
  pe.paid_at,
  o.status as order_status,
  CASE
    WHEN pe.user_id IS NULL THEN '❌ user_id NULL'
    WHEN pe.status = 'pending' THEN '⏳ PENDING'
    WHEN pe.status = 'completed' THEN '✅ COMPLETED'
    ELSE pe.status
  END as earning_status
FROM provider_earnings pe
LEFT JOIN orders o ON o.id = pe.order_id
ORDER BY pe.created_at DESC
LIMIT 10;

-- 4. Vérifier les scheduled_releases créés
SELECT
  id,
  earning_id,
  provider_id,
  amount_cents / 100.0 as amount_eur,
  rule_name,
  delay_hours,
  release_at,
  status,
  created_at
FROM scheduled_releases
ORDER BY created_at DESC
LIMIT 5;

-- 5. Vérifier les règles actives
SELECT
  id,
  name,
  delay_hours,
  applies_to,
  condition,
  is_active,
  priority,
  CASE
    WHEN applies_to = 'all' AND condition IS NULL THEN '✅ VALIDE'
    WHEN applies_to = 'amount_threshold' AND condition IS NULL THEN '❌ INVALIDE (pas de condition)'
    WHEN applies_to = 'new_providers' AND condition IS NULL THEN '❌ INVALIDE (pas de condition)'
    WHEN applies_to = 'vip' AND condition IS NULL THEN '❌ INVALIDE (pas de condition)'
    WHEN applies_to = 'country' AND condition IS NULL THEN '❌ INVALIDE (pas de condition)'
    ELSE '✅ VALIDE'
  END as validation
FROM payment_release_rules
WHERE is_active = true
ORDER BY priority DESC;

-- 6. Vérifier les balances actuelles
SELECT
  pb.provider_id,
  pr.email,
  pb.pending_cents / 100.0 as pending_eur,
  pb.available_cents / 100.0 as available_eur,
  pb.total_earned_cents / 100.0 as total_eur,
  pb.updated_at,
  CASE
    WHEN pb.pending_cents > 0 THEN '⏳ A des fonds pending'
    WHEN pb.available_cents > 0 THEN '✅ A des fonds available'
    ELSE '⚪ Pas de fonds'
  END as balance_status
FROM provider_balance pb
INNER JOIN profiles pr ON pr.user_id = pb.provider_id
ORDER BY pb.updated_at DESC
LIMIT 5;

-- ============================================================================
-- ANALYSE: Quel est le problème ?
-- ============================================================================

DO $$
DECLARE
  v_trigger_exists BOOLEAN;
  v_active_rules INT;
  v_pending_earnings INT;
  v_pending_balance BIGINT;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 DIAGNOSTIC DU SYSTÈME';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';

  -- Check 1: Trigger existe ?
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_apply_payment_rules'
  ) INTO v_trigger_exists;

  IF v_trigger_exists THEN
    RAISE NOTICE '✅ Trigger existe et est actif';
  ELSE
    RAISE NOTICE '❌ PROBLÈME: Le trigger n''existe pas!';
    RAISE NOTICE '   → Exécutez CREATE_AUTO_RELEASE_TRIGGER.sql';
  END IF;

  -- Check 2: Règles actives ?
  SELECT COUNT(*) INTO v_active_rules
  FROM payment_release_rules
  WHERE is_active = true;

  IF v_active_rules > 0 THEN
    RAISE NOTICE '✅ % règles actives trouvées', v_active_rules;
  ELSE
    RAISE NOTICE '❌ PROBLÈME: Aucune règle active!';
    RAISE NOTICE '   → Activez au moins une règle dans payment_release_rules';
  END IF;

  -- Check 3: Earnings pending ?
  SELECT COUNT(*) INTO v_pending_earnings
  FROM provider_earnings
  WHERE status = 'pending';

  IF v_pending_earnings > 0 THEN
    RAISE NOTICE '⏳ % earnings en attente de libération', v_pending_earnings;
  ELSE
    RAISE NOTICE '⚪ Aucun earning pending (normal si tout est libéré)';
  END IF;

  -- Check 4: Balance pending ?
  SELECT COALESCE(SUM(pending_cents), 0) INTO v_pending_balance
  FROM provider_balance;

  IF v_pending_balance > 0 THEN
    RAISE NOTICE '💰 % EUR en pending au total', v_pending_balance / 100.0;
  ELSE
    RAISE NOTICE '⚪ Aucun fond pending (normal si tout est libéré)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '💡 HYPOTHÈSES:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';

  -- Hypothèse 1: L'earning est créé AVANT que status = 'completed'
  IF EXISTS (
    SELECT 1
    FROM provider_earnings pe
    INNER JOIN orders o ON o.id = pe.order_id
    WHERE pe.status = 'pending' AND o.status != 'completed'
  ) THEN
    RAISE NOTICE '⚠️  HYPOTHÈSE 1: Des earnings existent pour commandes non-completed';
    RAISE NOTICE '   → L''earning est créé AVANT le changement de statut';
    RAISE NOTICE '   → Solution: Le trigger doit vérifier si earning existe déjà';
  END IF;

  -- Hypothèse 2: La fonction release_provider_earning échoue
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  HYPOTHÈSE 2: La fonction release_provider_earning() échoue silencieusement';
  RAISE NOTICE '   → Vérifiez les logs PostgreSQL pour les RAISE NOTICE';
  RAISE NOTICE '   → Dans Supabase Dashboard → Database → Logs';

  -- Hypothèse 3: Le user_id est NULL
  IF EXISTS (
    SELECT 1 FROM provider_earnings WHERE user_id IS NULL AND status = 'pending'
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ HYPOTHÈSE 3: Des earnings ont user_id = NULL!';
    RAISE NOTICE '   → La fonction release_provider_earning ne peut pas fonctionner';
    RAISE NOTICE '   → Solution: Exécuter FIX_PROVIDER_ID_USER_ID_RELATION.sql';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
END $$;
