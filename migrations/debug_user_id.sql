-- Vérifier si user_id est bien rempli dans provider_earnings
SELECT
  pe.id,
  pe.provider_id,
  pe.user_id,
  o.provider_id AS order_provider_id,
  o.client_id AS order_client_id
FROM provider_earnings pe
JOIN orders o ON o.id = pe.order_id
LIMIT 10;

-- Vérifier la résolution provider_id → user_id
SELECT
  'Résolution providers.id → user_id' AS check_type,
  prov.id AS provider_id,
  p.id AS profile_id,
  p.user_id,
  u.email
FROM providers prov
JOIN profiles p ON p.id = prov.profile_id
JOIN auth.users u ON u.id = p.user_id
LIMIT 5;
