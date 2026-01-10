-- ============================================================================
-- Reconstruire UNIQUEMENT provider_balance
-- ============================================================================

-- 1. Vider la table
TRUNCATE TABLE provider_balance CASCADE;

-- 2. Recréer les soldes depuis provider_earnings
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

-- 3. Vérifier le résultat
SELECT
  'RÉSULTAT' AS info,
  pb.provider_id,
  u.email,
  (pb.available_cents / 100.0)::DECIMAL(10,2) AS disponible_euros,
  (pb.pending_cents / 100.0)::DECIMAL(10,2) AS en_attente_euros,
  (pb.total_earned_cents / 100.0)::DECIMAL(10,2) AS total_gagne_euros
FROM provider_balance pb
JOIN auth.users u ON u.id = pb.provider_id;
