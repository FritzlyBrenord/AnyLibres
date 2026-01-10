-- Libérer TOUT le pending d'un coup
SELECT admin_release_pending_funds(
  '6e2266bb-014c-4af7-8917-7b4f4e921557'::uuid,
  NULL  -- NULL = libère tout le pending disponible
);

-- Vérifier après
SELECT
  pending_cents / 100.0 as pending_usd,
  available_cents / 100.0 as available_usd,
  total_earned_cents / 100.0 as total_usd
FROM provider_balance
WHERE provider_id = '6e2266bb-014c-4af7-8917-7b4f4e921557';
