-- ============================================================================
-- DIAGNOSTIC: Pourquoi les earnings affichent 0.00€
-- ============================================================================

-- 1. Vérifier les earnings existants
SELECT
  'EARNINGS EXISTANTS' AS check_type,
  COUNT(*) AS total,
  COUNT(DISTINCT provider_id) AS nb_providers,
  SUM(net_amount_cents) / 100.0 AS total_net_euros
FROM provider_earnings;

-- 2. Voir les provider_id dans provider_earnings
SELECT
  'PROVIDER IDS DANS EARNINGS' AS check_type,
  provider_id,
  COUNT(*) AS nb_earnings,
  SUM(net_amount_cents) / 100.0 AS total_euros
FROM provider_earnings
GROUP BY provider_id;

-- 3. Vérifier si provider_balance existe pour ces IDs
SELECT
  'PROVIDER BALANCE' AS check_type,
  pb.provider_id,
  pb.available_cents / 100.0 AS disponible,
  pb.pending_cents / 100.0 AS en_attente,
  pb.total_earned_cents / 100.0 AS total
FROM provider_balance pb;

-- 4. Vérifier la correspondance users → profiles → providers
SELECT
  'CORRESPONDANCE IDS' AS check_type,
  u.id AS user_id,
  u.email,
  p.id AS profile_id,
  prov.id AS provider_id
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN providers prov ON prov.profile_id = p.id
WHERE u.email LIKE '%provider%' OR u.email LIKE '%presta%';

-- 5. Vérifier quel user_id correspond aux earnings
SELECT
  'MAPPING EARNINGS → USER' AS check_type,
  pe.provider_id AS earnings_provider_id,
  u.id AS user_id,
  u.email,
  COUNT(pe.id) AS nb_earnings,
  SUM(pe.net_amount_cents) / 100.0 AS total_euros
FROM provider_earnings pe
LEFT JOIN auth.users u ON u.id = pe.provider_id
GROUP BY pe.provider_id, u.id, u.email;

-- 6. Si provider_id dans earnings n'est pas un user_id, chercher le user
SELECT
  'RESOLUTION PROVIDER_ID → USER_ID' AS check_type,
  pe.provider_id AS earnings_provider_id,
  p.user_id AS resolved_user_id,
  u.email AS user_email,
  COUNT(pe.id) AS nb_earnings,
  SUM(pe.net_amount_cents) / 100.0 AS total_euros
FROM provider_earnings pe
LEFT JOIN profiles p ON p.id = pe.provider_id
LEFT JOIN auth.users u ON u.id = p.user_id
GROUP BY pe.provider_id, p.user_id, u.email;

-- 7. Vérifier les orders pour comprendre d'où vient provider_id
SELECT
  'ORDERS PROVIDER_ID' AS check_type,
  o.id AS order_id,
  o.provider_id AS order_provider_id,
  pe.provider_id AS earning_provider_id,
  pe.metadata->>'original_provider_id' AS original_provider_id
FROM orders o
JOIN provider_earnings pe ON pe.order_id = o.id
LIMIT 5;

-- 8. Résumé du problème
SELECT
  '=== RÉSUMÉ ===' AS diagnostic,
  CASE
    WHEN EXISTS(SELECT 1 FROM provider_earnings pe JOIN auth.users u ON u.id = pe.provider_id)
    THEN 'provider_id dans earnings = user_id ✅'
    ELSE 'provider_id dans earnings ≠ user_id ❌'
  END AS status;
