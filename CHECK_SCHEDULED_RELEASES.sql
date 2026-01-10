-- Vérifier les scheduled_releases pour ce provider
SELECT
  'Scheduled releases' as info,
  sr.*
FROM scheduled_releases sr
WHERE sr.provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6'
ORDER BY sr.created_at DESC
LIMIT 5;

-- Vérifier les earnings récents
SELECT
  'Recent earnings' as info,
  pe.id,
  pe.net_amount_cents / 100.0 as net_eur,
  pe.status,
  pe.created_at
FROM provider_earnings pe
WHERE pe.provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6'
ORDER BY pe.created_at DESC
LIMIT 5;

-- Vérifier la balance actuelle
SELECT
  'Balance actuelle' as info,
  pending_cents / 100.0 as pending_eur,
  available_cents / 100.0 as available_eur,
  total_earned_cents / 100.0 as total_eur
FROM provider_balance
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';
