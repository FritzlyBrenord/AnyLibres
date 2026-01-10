-- ============================================================================
-- DIAGNOSTIC: Pourquoi l'auto-release ne libère pas les fonds
-- ============================================================================

-- 1. Vérifier les règles actives
SELECT
  'RÈGLES ACTIVES' as check_type,
  id,
  name,
  delay_hours,
  applies_to,
  condition,
  is_active,
  priority
FROM payment_release_rules
WHERE is_active = true
ORDER BY priority DESC;

-- 2. Vérifier les balances avec pending
SELECT
  'BALANCES PENDING' as check_type,
  provider_id,
  pending_cents / 100.0 as pending_usd,
  available_cents / 100.0 as available_usd
FROM provider_balance
WHERE pending_cents > 0;

-- 3. Vérifier les earnings pending
SELECT
  'EARNINGS PENDING' as check_type,
  id,
  user_id,
  net_amount_cents / 100.0 as amount_usd,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_elapsed
FROM provider_earnings
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 4. Vérifier si le provider existe dans la table providers
SELECT
  'PROVIDER INFO' as check_type,
  p.id,
  p.rating,
  p.country,
  p.created_at as provider_created_at,
  prof.created_at as profile_created_at,
  EXTRACT(EPOCH FROM (NOW() - prof.created_at)) / (3600 * 24) as provider_age_days
FROM providers p
INNER JOIN profiles prof ON prof.id = p.profile_id
WHERE p.id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- 5. Vérifier la relation provider_earnings -> providers
SELECT
  'RELATION CHECK' as check_type,
  pe.id as earning_id,
  pe.user_id,
  CASE
    WHEN p.id IS NOT NULL THEN '✅ Provider exists'
    ELSE '❌ Provider NOT FOUND'
  END as provider_status
FROM provider_earnings pe
LEFT JOIN providers p ON p.id = pe.user_id
WHERE pe.status = 'pending';
