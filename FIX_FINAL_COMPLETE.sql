-- ============================================================================
-- FIX FINAL: Libérer les 880 USD restants et nettoyer les earnings
-- ============================================================================

-- 1. Libérer tout le pending restant (880 USD)
SELECT admin_release_pending_funds(
  '6e2266bb-014c-4af7-8917-7b4f4e921557'::uuid,
  NULL  -- NULL = libère tout
);

-- 2. Marquer TOUS les earnings pending comme completed
UPDATE provider_earnings
SET
  status = 'completed',
  paid_at = NOW(),
  updated_at = NOW()
WHERE
  status = 'pending'
  AND user_id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- 3. Vérifier le résultat final
SELECT
  'Balance' as type,
  pending_cents / 100.0 as pending_usd,
  available_cents / 100.0 as available_usd,
  total_earned_cents / 100.0 as total_usd
FROM provider_balance
WHERE provider_id = '6e2266bb-014c-4af7-8917-7b4f4e921557'

UNION ALL

SELECT
  'Earnings' as type,
  SUM(CASE WHEN status = 'pending' THEN net_amount_cents ELSE 0 END) / 100.0 as pending_usd,
  SUM(CASE WHEN status = 'completed' THEN net_amount_cents ELSE 0 END) / 100.0 as completed_usd,
  SUM(net_amount_cents) / 100.0 as total_usd
FROM provider_earnings
WHERE user_id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- 4. Liste des earnings après correction
SELECT
  id,
  net_amount_cents / 100.0 as amount_usd,
  status,
  paid_at,
  created_at
FROM provider_earnings
WHERE user_id = '6e2266bb-014c-4af7-8917-7b4f4e921557'
ORDER BY created_at DESC;

RAISE NOTICE '✅ Terminé! Tous les fonds ont été libérés et les earnings marqués comme completed';
