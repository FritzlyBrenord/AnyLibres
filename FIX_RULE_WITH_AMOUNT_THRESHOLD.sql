-- ============================================================================
-- FIX ALTERNATIF: Garder la condition de montant minimum
-- ============================================================================
-- Utilisez ce script si vous voulez que la règle s'applique seulement
-- aux commandes >= 5000€ (500000 centimes)

-- 1. Corriger le type de règle pour utiliser amount_threshold
UPDATE payment_release_rules
SET
  applies_to = 'amount_threshold',  -- Changer de 'all' à 'amount_threshold'
  updated_at = NOW()
WHERE id = '1f26a569-eb64-4a7f-ac33-fd0f281122a9';

-- 2. Transférer les montants pending vers available SEULEMENT pour les montants >= min_amount
UPDATE provider_balance pb
SET
  available_cents = available_cents + pending_cents,
  pending_cents = 0,
  updated_at = NOW()
WHERE pending_cents > 0
AND pending_cents >= 500000  -- Seulement si >= 5000€
AND EXISTS (
  SELECT 1 FROM payment_release_rules prr
  WHERE prr.id = '1f26a569-eb64-4a7f-ac33-fd0f281122a9'
  AND prr.delay_hours = 0
  AND prr.is_active = TRUE
);

-- 3. Marquer les scheduled_releases correspondants comme complétés
UPDATE scheduled_releases
SET
  status = 'completed',
  completed_at = NOW()
WHERE status = 'pending'
AND amount_cents >= 500000  -- Seulement >= 5000€
AND rule_id = '1f26a569-eb64-4a7f-ac33-fd0f281122a9';

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
  'Balances' as etape,
  provider_id,
  available_cents / 100.0 as available_eur,
  pending_cents / 100.0 as pending_eur,
  total_earned_cents / 100.0 as total_eur
FROM provider_balance
WHERE provider_id = '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6';
