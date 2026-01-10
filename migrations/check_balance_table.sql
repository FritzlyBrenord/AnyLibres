-- Vérifier le contenu de provider_balance
SELECT
  'Contenu provider_balance' AS info,
  pb.*
FROM provider_balance pb;

-- Vérifier si le user_id existe dans provider_balance
SELECT
  'Recherche user_id spécifique' AS info,
  pb.*
FROM provider_balance pb
WHERE pb.provider_id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- Comparer avec provider_earnings
SELECT
  'Earnings pour ce user' AS info,
  pe.user_id,
  COUNT(*) AS nb_earnings,
  SUM(pe.net_amount_cents) / 100.0 AS total_euros
FROM provider_earnings pe
WHERE pe.user_id = '6e2266bb-014c-4af7-8917-7b4f4e921557'
GROUP BY pe.user_id;
