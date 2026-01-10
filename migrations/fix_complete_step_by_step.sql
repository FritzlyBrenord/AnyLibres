-- ============================================================================
-- FIX COMPLET ÉTAPE PAR ÉTAPE
-- ============================================================================

-- ÉTAPE 1: Voir le problème actuel
SELECT
  '=== ÉTAPE 1: DIAGNOSTIC ===' AS info;

SELECT
  'Données provider_earnings AVANT' AS status,
  pe.id,
  pe.provider_id AS earning_provider_id,
  pe.user_id AS earning_user_id,
  pe.order_id,
  o.client_id AS order_client_id,
  o.provider_id AS order_provider_id_CORRECT
FROM provider_earnings pe
JOIN orders o ON o.id = pe.order_id
LIMIT 3;

-- ÉTAPE 2: Corriger provider_id dans provider_earnings
SELECT
  '=== ÉTAPE 2: CORRIGER PROVIDER_ID ===' AS info;

UPDATE provider_earnings pe
SET provider_id = o.provider_id
FROM orders o
WHERE pe.order_id = o.id;

SELECT
  'Données APRÈS correction provider_id' AS status,
  pe.id,
  pe.provider_id AS earning_provider_id_CORRIGÉ,
  pe.user_id AS earning_user_id_PAS_ENCORE,
  o.provider_id AS order_provider_id
FROM provider_earnings pe
JOIN orders o ON o.id = pe.order_id
LIMIT 3;

-- ÉTAPE 3: Remplir user_id en résolvant provider_id → user_id
SELECT
  '=== ÉTAPE 3: REMPLIR USER_ID ===' AS info;

-- D'abord, voir la chaîne de résolution pour UN provider
SELECT
  'Exemple de résolution' AS info,
  prov.id AS providers_id,
  prov.profile_id,
  p.user_id,
  u.email
FROM providers prov
JOIN profiles p ON p.id = prov.profile_id
JOIN auth.users u ON u.id = p.user_id
LIMIT 1;

-- Maintenant, remplir user_id
UPDATE provider_earnings pe
SET user_id = (
  SELECT COALESCE(
    -- Option 1: provider_id est déjà un user_id
    (SELECT id FROM auth.users WHERE id = pe.provider_id),
    -- Option 2: provider_id est un profile_id
    (SELECT user_id FROM profiles WHERE id = pe.provider_id),
    -- Option 3: provider_id est un providers.id
    (SELECT p.user_id
     FROM providers prov
     JOIN profiles p ON p.id = prov.profile_id
     WHERE prov.id = pe.provider_id)
  )
);

-- Vérifier que user_id est bien rempli
SELECT
  'Vérification user_id' AS status,
  COUNT(*) AS total,
  COUNT(user_id) AS avec_user_id,
  COUNT(*) - COUNT(user_id) AS sans_user_id
FROM provider_earnings;

-- Voir les données complètes
SELECT
  'Données APRÈS remplissage user_id' AS status,
  pe.id,
  pe.provider_id,
  pe.user_id,
  u.email AS user_email,
  o.provider_id AS order_provider_id
FROM provider_earnings pe
JOIN orders o ON o.id = pe.order_id
LEFT JOIN auth.users u ON u.id = pe.user_id
LIMIT 3;

-- ÉTAPE 4: Recalculer provider_balance
SELECT
  '=== ÉTAPE 4: RECALCULER SOLDES ===' AS info;

TRUNCATE TABLE provider_balance CASCADE;

INSERT INTO provider_balance (
  provider_id,
  available_cents,
  pending_cents,
  withdrawn_cents,
  total_earned_cents,
  currency
)
SELECT
  pe.user_id AS provider_id,
  COALESCE(SUM(pe.net_amount_cents) FILTER (WHERE pe.status = 'completed'), 0) AS available_cents,
  COALESCE(SUM(pe.net_amount_cents) FILTER (WHERE pe.status = 'pending'), 0) AS pending_cents,
  0 AS withdrawn_cents,
  COALESCE(SUM(pe.net_amount_cents), 0) AS total_earned_cents,
  'EUR' AS currency
FROM provider_earnings pe
WHERE pe.user_id IS NOT NULL
GROUP BY pe.user_id;

-- ÉTAPE 5: RÉSULTAT FINAL
SELECT
  '=== ÉTAPE 5: RÉSULTAT FINAL ===' AS info;

SELECT
  'Soldes provider_balance' AS status,
  pb.provider_id,
  u.email AS provider_email,
  (pb.available_cents / 100.0)::DECIMAL(10,2) AS disponible_euros,
  (pb.pending_cents / 100.0)::DECIMAL(10,2) AS en_attente_euros,
  (pb.total_earned_cents / 100.0)::DECIMAL(10,2) AS total_gagne_euros,
  pb.currency
FROM provider_balance pb
JOIN auth.users u ON u.id = pb.provider_id
ORDER BY pb.total_earned_cents DESC;

-- Earnings par provider
SELECT
  'Earnings par provider' AS status,
  pe.user_id,
  u.email,
  COUNT(*) AS nb_earnings,
  COUNT(*) FILTER (WHERE pe.status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE pe.status = 'pending') AS pending,
  (SUM(pe.net_amount_cents) / 100.0)::DECIMAL(10,2) AS total_euros
FROM provider_earnings pe
JOIN auth.users u ON u.id = pe.user_id
GROUP BY pe.user_id, u.email
ORDER BY total_euros DESC;
