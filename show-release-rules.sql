-- ============================================================================
-- Script SQL pour afficher les règles de libération actives
-- ============================================================================

-- Afficher toutes les règles actives triées par priorité
SELECT
  id,
  name,
  delay_hours,
  ROUND(delay_hours::numeric / 24, 1) as delay_days,
  applies_to,
  condition,
  is_active,
  priority,
  created_at
FROM payment_release_rules
WHERE is_active = true
ORDER BY priority DESC, created_at DESC;

-- Résumé des delay_hours par type
SELECT
  applies_to,
  COUNT(*) as nb_rules,
  MIN(delay_hours) as min_delay_hours,
  MAX(delay_hours) as max_delay_hours,
  AVG(delay_hours)::int as avg_delay_hours
FROM payment_release_rules
WHERE is_active = true
GROUP BY applies_to
ORDER BY avg_delay_hours;

-- Vérifier s'il existe des règles inactives
SELECT
  COUNT(*) as inactive_rules_count
FROM payment_release_rules
WHERE is_active = false;
