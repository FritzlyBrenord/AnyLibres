-- Vérifier les contraintes sur provider_balance
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'provider_balance'::regclass;

-- Vérifier le solde actuel
SELECT
  provider_id,
  pending_cents / 100.0 as pending_eur,
  available_cents / 100.0 as available_eur,
  total_earned_cents / 100.0 as total_eur
FROM provider_balance
WHERE provider_id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- Vérifier les scheduled_releases pour ce provider
SELECT
  id,
  amount_cents / 100.0 as amount_eur,
  status,
  delay_hours,
  release_at
FROM scheduled_releases
WHERE provider_id = '6e2266bb-014c-4af7-8917-7b4f4e921557'
ORDER BY created_at DESC;
