-- ============================================================================
-- DEBUG: Pourquoi le provider est skippé
-- ============================================================================

-- 1. Est-ce que le provider_balance existe et a du pending?
SELECT
  '1. BALANCE CHECK' as step,
  CASE
    WHEN pending_cents > 0 THEN '✅ Has pending'
    ELSE '❌ No pending'
  END as status,
  pending_cents / 100.0 as pending_usd
FROM provider_balance
WHERE provider_id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- 2. Est-ce qu'il y a des earnings pending?
SELECT
  '2. EARNINGS CHECK' as step,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Has earnings'
    ELSE '❌ No earnings'
  END as status,
  COUNT(*) as count,
  SUM(net_amount_cents) / 100.0 as total_usd
FROM provider_earnings
WHERE user_id = '6e2266bb-014c-4af7-8917-7b4f4e921557'
  AND status = 'pending';

-- 3. Est-ce que le provider existe dans la table providers?
SELECT
  '3. PROVIDER CHECK' as step,
  CASE
    WHEN p.id IS NOT NULL THEN '✅ Provider exists'
    ELSE '❌ Provider NOT FOUND'
  END as status,
  p.id,
  p.rating,
  p.profile_id
FROM provider_balance pb
LEFT JOIN providers p ON p.id = pb.provider_id
WHERE pb.provider_id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- 4. Est-ce que le provider a un profile?
SELECT
  '4. PROFILE CHECK' as step,
  CASE
    WHEN prof.id IS NOT NULL THEN '✅ Profile exists'
    ELSE '❌ Profile NOT FOUND'
  END as status,
  prof.id,
  prof.location,
  prof.created_at
FROM providers p
LEFT JOIN profiles prof ON prof.id = p.profile_id
WHERE p.id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- 5. Simuler la requête exacte de l'API
SELECT
  '5. API QUERY SIMULATION' as step,
  p.id,
  p.rating,
  p.created_at,
  prof.created_at as profile_created_at,
  prof.location
FROM providers p
INNER JOIN profiles prof ON prof.id = p.profile_id
WHERE p.id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- 6. Vérifier les règles actives
SELECT
  '6. RULES CHECK' as step,
  name,
  delay_hours,
  applies_to,
  is_active
FROM payment_release_rules
WHERE is_active = true;

-- 7. Calculer le délai écoulé pour chaque earning
SELECT
  '7. DELAY CHECK' as step,
  id,
  net_amount_cents / 100.0 as amount_usd,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_elapsed,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 >= 0 THEN '✅ Should be released (0h delay)'
    ELSE '❌ Not ready'
  END as should_release
FROM provider_earnings
WHERE user_id = '6e2266bb-014c-4af7-8917-7b4f4e921557'
  AND status = 'pending';
