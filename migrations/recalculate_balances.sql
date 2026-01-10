-- ============================================================================
-- CORRECTION: Recalculer tous les soldes provider_balance
-- ============================================================================
-- Ce script recalcule les soldes à partir des données provider_earnings

-- 1. Supprimer tous les soldes existants (on va les recréer)
TRUNCATE TABLE provider_balance;

-- 2. Recréer les soldes en agrégeant les earnings
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
  pe.provider_id,
  COALESCE(SUM(pe.net_amount_cents) FILTER (WHERE pe.status = 'completed'), 0) AS available_cents,
  COALESCE(SUM(pe.net_amount_cents) FILTER (WHERE pe.status = 'pending'), 0) AS pending_cents,
  0 AS withdrawn_cents,
  COALESCE(SUM(pe.net_amount_cents), 0) AS total_earned_cents,
  COALESCE(pe.currency, 'EUR') AS currency,
  NULL AS last_withdrawal_at
FROM provider_earnings pe
GROUP BY pe.provider_id, pe.currency
ON CONFLICT (provider_id) DO UPDATE
SET
  available_cents = EXCLUDED.available_cents,
  pending_cents = EXCLUDED.pending_cents,
  total_earned_cents = EXCLUDED.total_earned_cents,
  updated_at = NOW();

-- 3. Vérifier le résultat
SELECT
  'RÉSULTAT' AS status,
  pb.provider_id,
  u.email,
  (pb.available_cents / 100.0)::DECIMAL(10,2) AS disponible_euros,
  (pb.pending_cents / 100.0)::DECIMAL(10,2) AS en_attente_euros,
  (pb.total_earned_cents / 100.0)::DECIMAL(10,2) AS total_gagne_euros,
  pb.currency
FROM provider_balance pb
LEFT JOIN auth.users u ON u.id = pb.provider_id
ORDER BY pb.total_earned_cents DESC;

-- 4. Compter les earnings par provider
SELECT
  'EARNINGS PAR PROVIDER' AS info,
  pe.provider_id,
  COUNT(*) AS nb_earnings,
  COUNT(*) FILTER (WHERE pe.status = 'completed') AS nb_completed,
  COUNT(*) FILTER (WHERE pe.status = 'pending') AS nb_pending,
  (SUM(pe.net_amount_cents) / 100.0)::DECIMAL(10,2) AS total_euros
FROM provider_earnings pe
GROUP BY pe.provider_id
ORDER BY total_euros DESC;
