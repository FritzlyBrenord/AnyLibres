-- Vérifier si les earnings ont un user_id valide
SELECT
  id,
  order_id,
  provider_id,
  user_id,
  status,
  net_amount_cents / 100.0 as amount_usd,
  created_at,
  CASE
    WHEN user_id IS NULL THEN '❌ user_id NULL!'
    WHEN status != 'pending' THEN '⚠️ Pas pending'
    ELSE '✅ OK'
  END as validation
FROM provider_earnings
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Si user_id est NULL, le fixer
UPDATE provider_earnings pe
SET user_id = (
  SELECT pr.user_id
  FROM providers prov
  INNER JOIN profiles pr ON pr.id = prov.profile_id
  WHERE prov.id = pe.provider_id
)
WHERE user_id IS NULL AND status = 'pending';

-- Vérifier combien ont été mis à jour
SELECT
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as with_user_id,
  COUNT(*) FILTER (WHERE user_id IS NULL) as still_null
FROM provider_earnings
WHERE status = 'pending';
