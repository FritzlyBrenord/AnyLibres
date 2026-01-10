-- ============================================================================
-- MIGRATION COMPLÈTE: Système de gains + Rétroactivité
-- ============================================================================
-- Ce script :
-- 1. Crée toutes les tables et fonctions nécessaires
-- 2. Crée des earnings pour TOUTES les commandes déjà complétées
-- 3. Met à jour les soldes des prestataires

-- ============================================================================
-- ÉTAPE 1: Exécuter la migration principale
-- ============================================================================

\i create_provider_earnings.sql

-- OU copiez tout le contenu de create_provider_earnings.sql ici

-- ============================================================================
-- ÉTAPE 2: Créer les earnings pour les commandes déjà complétées (RÉTROACTIF)
-- ============================================================================

DO $$
DECLARE
  v_order RECORD;
  v_earning_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Pour chaque commande terminée (status = 'completed')
  FOR v_order IN
    SELECT id, provider_id, status
    FROM orders
    WHERE status IN ('completed', 'delivered')
    AND id NOT IN (SELECT order_id FROM provider_earnings WHERE order_id IS NOT NULL)
    ORDER BY created_at ASC
  LOOP
    BEGIN
      -- Créer l'earning
      v_earning_id := create_provider_earning(v_order.id);

      -- Si la commande est 'completed', libérer immédiatement le paiement
      IF v_order.status = 'completed' THEN
        PERFORM release_provider_earning(v_order.id);
      END IF;

      v_count := v_count + 1;

      RAISE NOTICE 'Created earning % for order % (provider %)',
        v_earning_id, v_order.id, v_order.provider_id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create earning for order %: %', v_order.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Total earnings created: %', v_count;
END $$;

-- ============================================================================
-- ÉTAPE 3: Vérifications
-- ============================================================================

-- Vérifier les soldes créés
SELECT
  pb.provider_id,
  u.email,
  pb.available_cents / 100.0 AS available_euros,
  pb.pending_cents / 100.0 AS pending_euros,
  pb.total_earned_cents / 100.0 AS total_earned_euros,
  pb.currency
FROM provider_balance pb
JOIN auth.users u ON u.id = pb.provider_id
WHERE pb.total_earned_cents > 0
ORDER BY pb.total_earned_cents DESC;

-- Vérifier les earnings créés
SELECT
  pe.provider_id,
  u.email,
  COUNT(*) AS nb_earnings,
  SUM(pe.net_amount_cents) / 100.0 AS total_net_euros,
  pe.currency
FROM provider_earnings pe
JOIN auth.users u ON u.id = pe.provider_id
GROUP BY pe.provider_id, u.email, pe.currency
ORDER BY total_net_euros DESC;

-- Vérifier les commandes sans earning
SELECT
  o.id AS order_id,
  o.status,
  o.total_cents / 100.0 AS total_euros,
  o.created_at
FROM orders o
WHERE o.status IN ('completed', 'delivered')
AND NOT EXISTS (
  SELECT 1 FROM provider_earnings pe WHERE pe.order_id = o.id
)
ORDER BY o.created_at DESC;
