-- ============================================================================
-- TEST: Libération manuelle des fonds
-- ============================================================================

-- 1. Vérifier l'état actuel du prestataire
SELECT
  'État AVANT libération' as etape,
  provider_id,
  pending_cents / 100.0 as pending_eur,
  available_cents / 100.0 as available_eur,
  total_earned_cents / 100.0 as total_eur
FROM provider_balance
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';

-- 2. Voir les scheduled_releases en attente
SELECT
  'Releases AVANT' as etape,
  id,
  amount_cents / 100.0 as amount_eur,
  rule_name,
  release_at,
  status
FROM scheduled_releases
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6'
ORDER BY created_at DESC;

-- 3. LIBÉRER TOUT LE MONTANT EN ATTENTE
SELECT * FROM admin_release_pending_funds(
  '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6',  -- provider_id
  NULL  -- NULL = libérer tout
);

-- 4. Vérifier l'état APRÈS libération
SELECT
  'État APRÈS libération' as etape,
  provider_id,
  pending_cents / 100.0 as pending_eur,
  available_cents / 100.0 as available_eur,
  total_earned_cents / 100.0 as total_eur
FROM provider_balance
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';

-- 5. Voir les scheduled_releases APRÈS
SELECT
  'Releases APRÈS' as etape,
  id,
  amount_cents / 100.0 as amount_eur,
  rule_name,
  status,
  metadata->'manually_released' as manually_released,
  completed_at
FROM scheduled_releases
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6'
ORDER BY created_at DESC;

-- ============================================================================
-- RÉSULTAT ATTENDU:
-- ============================================================================
-- AVANT:
--   pending_eur: 30.00
--   available_eur: 0.00
--
-- APRÈS:
--   pending_eur: 0.00
--   available_eur: 30.00
--
-- scheduled_releases:
--   status: 'completed'
--   manually_released: true
-- ============================================================================
