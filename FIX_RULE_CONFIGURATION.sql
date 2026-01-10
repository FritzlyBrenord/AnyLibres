-- ============================================================================
-- FIX: Corriger la configuration de la règle "regle_test"
-- ============================================================================
-- Problème:
--   - La règle a applies_to='amount_threshold' mais condition=null
--   - Une règle amount_threshold DOIT avoir une condition avec min/max_amount
--
-- Solutions possibles:
--   OPTION 1: Changer en "all" (s'applique toujours)
--   OPTION 2: Ajouter une condition valide avec min/max_amount
-- ============================================================================

-- ============================================================================
-- OPTION 1: Changer la règle en "all" (RECOMMANDÉ pour tester)
-- ============================================================================
-- Cette règle s'appliquera à TOUS les paiements avec délai 0 (immédiat)

UPDATE payment_release_rules
SET
  applies_to = 'all',
  condition = NULL,
  updated_at = NOW()
WHERE name = 'regle_test';

RAISE NOTICE '✅ Règle "regle_test" modifiée: applies_to = "all"';

-- ============================================================================
-- OPTION 2 (Alternative): Ajouter une condition pour amount_threshold
-- ============================================================================
-- Si vous voulez garder amount_threshold, décommentez les lignes ci-dessous:

/*
UPDATE payment_release_rules
SET
  applies_to = 'amount_threshold',
  condition = jsonb_build_object(
    'min_amount', 0,        -- Montant minimum en centimes (0 = pas de minimum)
    'max_amount', 100000000 -- Montant maximum en centimes (1 000 000 EUR)
  ),
  updated_at = NOW()
WHERE name = 'regle_test';

RAISE NOTICE '✅ Règle "regle_test" modifiée avec condition: 0 - 1M EUR';
*/

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

SELECT
  id,
  name,
  delay_hours,
  applies_to,
  condition,
  is_active,
  priority,
  CASE
    WHEN applies_to = 'all' AND condition IS NULL THEN '✅ Configuration OK (all)'
    WHEN applies_to = 'amount_threshold' AND condition IS NOT NULL THEN '✅ Configuration OK (threshold)'
    WHEN applies_to = 'amount_threshold' AND condition IS NULL THEN '❌ INVALIDE (threshold sans condition)'
    WHEN applies_to = 'new_providers' AND condition->'provider_age_days' IS NULL THEN '❌ INVALIDE (new_providers sans age)'
    WHEN applies_to = 'vip' AND condition->'provider_rating' IS NULL THEN '❌ INVALIDE (vip sans rating)'
    WHEN applies_to = 'country' AND condition->'countries' IS NULL AND condition->'country' IS NULL THEN '❌ INVALIDE (country sans pays)'
    ELSE '✅ Configuration OK'
  END as validation_status
FROM payment_release_rules
WHERE name = 'regle_test';

-- ============================================================================
-- EXEMPLES DE RÈGLES VALIDES
-- ============================================================================

-- Exemple 1: Libération immédiate pour TOUS les paiements
/*
INSERT INTO payment_release_rules (name, delay_hours, applies_to, condition, is_active, priority)
VALUES ('Libération immédiate', 0, 'all', NULL, true, 100);
*/

-- Exemple 2: Libération immédiate pour petits montants (< 100 EUR)
/*
INSERT INTO payment_release_rules (name, delay_hours, applies_to, condition, is_active, priority)
VALUES (
  'Petits montants',
  0,
  'amount_threshold',
  '{"min_amount": 0, "max_amount": 10000}'::jsonb, -- 0 - 100 EUR
  true,
  90
);
*/

-- Exemple 3: Attente 7 jours pour gros montants (> 500 EUR)
/*
INSERT INTO payment_release_rules (name, delay_hours, applies_to, condition, is_active, priority)
VALUES (
  'Gros montants',
  168, -- 7 jours
  'amount_threshold',
  '{"min_amount": 50000}'::jsonb, -- > 500 EUR
  true,
  80
);
*/

-- Exemple 4: Attente 14 jours pour nouveaux prestataires (< 30 jours)
/*
INSERT INTO payment_release_rules (name, delay_hours, applies_to, condition, is_active, priority)
VALUES (
  'Nouveaux prestataires',
  336, -- 14 jours
  'new_providers',
  '{"provider_age_days": 30}'::jsonb,
  true,
  70
);
*/

-- Exemple 5: Libération immédiate pour VIP (rating >= 4.5)
/*
INSERT INTO payment_release_rules (name, delay_hours, applies_to, condition, is_active, priority)
VALUES (
  'Prestataires VIP',
  0,
  'vip',
  '{"provider_rating": 4.5}'::jsonb,
  true,
  95
);
*/

RAISE NOTICE '🎉 RÈGLE CORRIGÉE - VOUS POUVEZ MAINTENANT TESTER';
RAISE NOTICE '💡 Acceptez une commande et vérifiez les logs de l''API';
