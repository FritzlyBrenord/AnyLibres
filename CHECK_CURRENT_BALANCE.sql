-- Voir la balance actuelle
SELECT
  'Balance actuelle' as info,
  provider_id,
  pending_cents / 100.0 as pending_eur,
  available_cents / 100.0 as available_eur,
  withdrawn_cents / 100.0 as withdrawn_eur,
  total_earned_cents / 100.0 as total_eur
FROM provider_balance
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';

-- Voir tous les earnings
SELECT
  'Tous les earnings' as info,
  COUNT(*) as total_count,
  SUM(net_amount_cents) / 100.0 as total_net_eur
FROM provider_earnings
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';

-- Voir les scheduled releases
SELECT
  'Scheduled releases' as info,
  status,
  COUNT(*) as count,
  SUM(amount_cents) / 100.0 as total_eur
FROM scheduled_releases
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6'
GROUP BY status;
