-- ============================================================================
-- FIX: Corriger les balances existantes et la règle
-- ============================================================================

-- 1. Corriger la règle pour qu'elle s'applique vraiment à tous
UPDATE payment_release_rules
SET
  condition = NULL,  -- Supprimer la condition pour que applies_to='all' fonctionne
  updated_at = NOW()
WHERE id = '1f26a569-eb64-4a7f-ac33-fd0f281122a9';

-- 2. Transférer tous les montants pending vers available pour cette règle (delay=0)
UPDATE provider_balance pb
SET
  available_cents = available_cents + pending_cents,
  pending_cents = 0,
  updated_at = NOW()
WHERE pending_cents > 0
AND EXISTS (
  SELECT 1 FROM payment_release_rules prr
  WHERE prr.applies_to = 'all'
  AND prr.delay_hours = 0
  AND prr.is_active = TRUE
);

-- 3. Marquer tous les scheduled_releases en attente comme complétés
UPDATE scheduled_releases
SET
  status = 'completed',
  completed_at = NOW()
WHERE status = 'pending'
AND EXISTS (
  SELECT 1 FROM payment_release_rules prr
  WHERE prr.id = scheduled_releases.rule_id
  AND prr.delay_hours = 0
  AND prr.is_active = TRUE
);

-- 4. Vérifier les résultats
SELECT
  'Règle corrigée' as etape,
  name,
  delay_hours,
  applies_to,
  condition,
  is_active
FROM payment_release_rules
WHERE id = '1f26a569-eb64-4a7f-ac33-fd0f281122a9';

SELECT
  'Balances mises à jour' as etape,
  provider_id,
  available_cents / 100.0 as available_eur,
  pending_cents / 100.0 as pending_eur,
  total_earned_cents / 100.0 as total_eur
FROM provider_balance
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';

SELECT
  'Releases complétés' as etape,
  COUNT(*) as nb_releases_completed
FROM scheduled_releases
WHERE status = 'completed'
AND provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';
