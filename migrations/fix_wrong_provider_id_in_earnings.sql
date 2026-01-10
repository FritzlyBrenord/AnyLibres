-- ============================================================================
-- FIX CRITIQUE: Corriger les provider_id incorrects dans provider_earnings
-- ============================================================================
-- Problème: Les earnings ont été créés avec orders.client_id au lieu de orders.provider_id
-- Solution: Corriger provider_id et user_id pour tous les earnings existants

-- 1. DIAGNOSTIC: Voir le problème
SELECT
  'AVANT CORRECTION' AS status,
  pe.id AS earning_id,
  pe.provider_id AS earning_provider_id_INCORRECT,
  pe.order_id,
  o.client_id AS order_client_id,
  o.provider_id AS order_provider_id_CORRECT
FROM provider_earnings pe
JOIN orders o ON o.id = pe.order_id
LIMIT 5;

-- 2. CORRIGER: Mettre le bon provider_id depuis orders
UPDATE provider_earnings pe
SET provider_id = o.provider_id
FROM orders o
WHERE pe.order_id = o.id;

-- 3. REMPLIR user_id en résolvant provider_id → user_id
UPDATE provider_earnings pe
SET user_id = (
  -- Résoudre provider_id → user_id
  COALESCE(
    -- Option 1: provider_id est déjà un user_id
    (SELECT id FROM auth.users WHERE id = pe.provider_id),
    -- Option 2: provider_id est un profile_id
    (SELECT user_id FROM profiles WHERE id = pe.provider_id),
    -- Option 3: provider_id est un providers.id
    (SELECT p.user_id FROM providers prov JOIN profiles p ON p.id = prov.profile_id WHERE prov.id = pe.provider_id)
  )
)
WHERE user_id IS NULL OR user_id != (
  COALESCE(
    (SELECT id FROM auth.users WHERE id = pe.provider_id),
    (SELECT user_id FROM profiles WHERE id = pe.provider_id),
    (SELECT p.user_id FROM providers prov JOIN profiles p ON p.id = prov.profile_id WHERE prov.id = pe.provider_id)
  )
);

-- 4. VÉRIFICATION: Voir si c'est corrigé
SELECT
  'APRÈS CORRECTION' AS status,
  pe.id AS earning_id,
  pe.provider_id AS earning_provider_id_CORRECT,
  pe.user_id,
  u.email AS provider_email,
  pe.order_id,
  o.provider_id AS order_provider_id
FROM provider_earnings pe
JOIN orders o ON o.id = pe.order_id
LEFT JOIN auth.users u ON u.id = pe.user_id
LIMIT 5;

-- 5. RECALCULER les soldes provider_balance
-- D'abord, supprimer les anciens soldes
TRUNCATE TABLE provider_balance CASCADE;

-- Recréer les soldes avec les bons provider_id (qui sont maintenant des user_id)
-- Grouper par user_id seulement (pas par currency pour éviter les doublons)
INSERT INTO provider_balance (
  provider_id,
  available_cents,
  pending_cents,
  withdrawn_cents,
  total_earned_cents,
  currency,
  last_withdrawal_at
)
SELECT
  pe.user_id AS provider_id,  -- Utiliser user_id
  COALESCE(SUM(pe.net_amount_cents) FILTER (WHERE pe.status = 'completed'), 0) AS available_cents,
  COALESCE(SUM(pe.net_amount_cents) FILTER (WHERE pe.status = 'pending'), 0) AS pending_cents,
  0 AS withdrawn_cents,
  COALESCE(SUM(pe.net_amount_cents), 0) AS total_earned_cents,
  'EUR' AS currency,  -- Fixer à EUR (convertir si nécessaire dans le futur)
  NULL AS last_withdrawal_at
FROM provider_earnings pe
WHERE pe.user_id IS NOT NULL
GROUP BY pe.user_id  -- Grouper uniquement par user_id
ON CONFLICT (provider_id) DO UPDATE
SET
  available_cents = EXCLUDED.available_cents,
  pending_cents = EXCLUDED.pending_cents,
  total_earned_cents = EXCLUDED.total_earned_cents,
  updated_at = NOW();

-- 6. RÉSUMÉ FINAL
SELECT
  '=== RÉSULTAT FINAL ===' AS info,
  pb.provider_id,
  u.email AS provider_email,
  (pb.available_cents / 100.0)::DECIMAL(10,2) AS disponible_euros,
  (pb.pending_cents / 100.0)::DECIMAL(10,2) AS en_attente_euros,
  (pb.total_earned_cents / 100.0)::DECIMAL(10,2) AS total_gagne_euros,
  pb.currency
FROM provider_balance pb
JOIN auth.users u ON u.id = pb.provider_id
ORDER BY pb.total_earned_cents DESC;

-- 7. Vérifier le nombre d'earnings par provider
SELECT
  '=== EARNINGS PAR PROVIDER ===' AS info,
  pe.user_id,
  u.email,
  COUNT(*) AS nb_earnings,
  COUNT(*) FILTER (WHERE pe.status = 'completed') AS nb_completed,
  COUNT(*) FILTER (WHERE pe.status = 'pending') AS nb_pending,
  (SUM(pe.net_amount_cents) / 100.0)::DECIMAL(10,2) AS total_euros
FROM provider_earnings pe
JOIN auth.users u ON u.id = pe.user_id
GROUP BY pe.user_id, u.email
ORDER BY total_euros DESC;
