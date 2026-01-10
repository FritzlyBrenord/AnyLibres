-- Vérifier l'état actuel du provider
-- ==========================================

-- 1. Balance actuelle
SELECT
  'BALANCE' as source,
  provider_id,
  pending_cents / 100.0 as pending_usd,
  available_cents / 100.0 as available_usd,
  total_earned_cents / 100.0 as total_usd
FROM provider_balance
WHERE provider_id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- 2. Earnings pending
SELECT
  'EARNINGS PENDING' as source,
  COUNT(*) as count,
  SUM(net_amount_cents) / 100.0 as total_pending_usd
FROM provider_earnings
WHERE user_id = '6e2266bb-014c-4af7-8917-7b4f4e921557'
  AND status = 'pending';

-- 3. Liste des earnings pending (détail)
SELECT
  id,
  order_id,
  net_amount_cents / 100.0 as amount_usd,
  status,
  created_at
FROM provider_earnings
WHERE user_id = '6e2266bb-014c-4af7-8917-7b4f4e921557'
  AND status = 'pending'
ORDER BY created_at DESC;

-- 4. Tester la fonction admin_release_pending_funds
-- (Décommentez pour libérer tout le pending)
/*
SELECT admin_release_pending_funds(
  '6e2266bb-014c-4af7-8917-7b4f4e921557'::uuid,
  NULL  -- NULL = libère tout
);
*/
