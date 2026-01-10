-- ============================================================================
-- DEBUG: Vérifier pourquoi l'API balances retourne 0
-- ============================================================================

-- 1. Vérifier les données brutes dans provider_balance
SELECT
  'Données brutes provider_balance' as etape,
  id,
  provider_id,
  available_cents,
  pending_cents,
  withdrawn_cents,
  total_earned_cents,
  currency
FROM provider_balance
ORDER BY created_at DESC;

-- 2. Vérifier si provider_id correspond à un user_id dans auth.users
SELECT
  'Vérification provider_id = user_id' as etape,
  pb.provider_id,
  pb.pending_cents,
  CASE
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = pb.provider_id)
    THEN 'user_id EXISTS ✓'
    ELSE 'user_id NOT FOUND ✗'
  END as user_exists
FROM provider_balance pb;

-- 3. Vérifier le lien provider_id → profiles
SELECT
  'Lien provider_id → profiles' as etape,
  pb.provider_id,
  pb.pending_cents,
  p.id as profile_id,
  p.email,
  p.display_name
FROM provider_balance pb
LEFT JOIN profiles p ON p.user_id = pb.provider_id
ORDER BY pb.created_at DESC;

-- 4. Vérifier le lien profiles → providers
SELECT
  'Lien profiles → providers' as etape,
  pb.provider_id,
  pb.pending_cents,
  p.id as profile_id,
  p.email,
  prov.id as provider_table_id,
  prov.company_name
FROM provider_balance pb
LEFT JOIN profiles p ON p.user_id = pb.provider_id
LEFT JOIN providers prov ON prov.profile_id = p.id
ORDER BY pb.created_at DESC;

-- 5. Résultat attendu par l'API
SELECT
  'Résultat attendu par API' as etape,
  pb.provider_id,
  COALESCE(prov.company_name, p.display_name, 'N/A') as provider_name,
  p.email as provider_email,
  pb.available_cents,
  pb.pending_cents,
  pb.withdrawn_cents,
  pb.total_earned_cents,
  pb.currency
FROM provider_balance pb
LEFT JOIN profiles p ON p.user_id = pb.provider_id
LEFT JOIN providers prov ON prov.profile_id = p.id
ORDER BY pb.total_earned_cents DESC;
