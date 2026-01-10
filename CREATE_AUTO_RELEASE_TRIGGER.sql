-- ============================================================================
-- TRIGGER AUTOMATIQUE: Appliquer les règles et libérer les fonds
-- ============================================================================
-- Ce trigger s'exécute automatiquement quand une commande passe à 'completed'
-- Il applique les règles de payment_release_rules et libère immédiatement
-- si delay_hours = 0, sinon crée un scheduled_release
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Fonction pour appliquer les règles et libérer/programmer
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_apply_payment_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_earning_id UUID;
  v_provider_id UUID;  -- providers.id
  v_user_id UUID;      -- auth.users.id
  v_amount_cents BIGINT;
  v_provider_age_days INTEGER;
  v_provider_rating DECIMAL;
  v_provider_country TEXT;
  v_rule RECORD;
  v_selected_rule RECORD;
  v_rule_applies BOOLEAN;
  v_release_at TIMESTAMP;
  v_released BOOLEAN;
BEGIN
  -- Vérifier que le statut passe à 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN

    RAISE NOTICE '🔄 Auto-apply rules triggered for order: %', NEW.id;

    -- 1. Récupérer l'earning pending pour cette commande
    SELECT id, provider_id, user_id, net_amount_cents
    INTO v_earning_id, v_provider_id, v_user_id, v_amount_cents
    FROM provider_earnings
    WHERE order_id = NEW.id AND status = 'pending'
    LIMIT 1;

    IF v_earning_id IS NULL THEN
      RAISE NOTICE '⚠️  No pending earning found for order: %', NEW.id;
      RETURN NEW;
    END IF;

    RAISE NOTICE '📋 Found earning: % (amount: % cents)', v_earning_id, v_amount_cents;

    -- Si user_id est NULL, le calculer
    IF v_user_id IS NULL THEN
      SELECT pr.user_id INTO v_user_id
      FROM providers prov
      INNER JOIN profiles pr ON pr.id = prov.profile_id
      WHERE prov.id = v_provider_id;

      IF v_user_id IS NOT NULL THEN
        UPDATE provider_earnings
        SET user_id = v_user_id
        WHERE id = v_earning_id;
      END IF;
    END IF;

    -- 2. Récupérer les infos du provider
    SELECT
      EXTRACT(EPOCH FROM (NOW() - COALESCE(pr.created_at, prov.created_at))) / 86400,
      COALESCE(prov.rating, 0),
      prov.country
    INTO v_provider_age_days, v_provider_rating, v_provider_country
    FROM providers prov
    LEFT JOIN profiles pr ON pr.id = prov.profile_id
    WHERE prov.id = v_provider_id;

    RAISE NOTICE '👤 Provider info: age=%d days, rating=%, country=%',
      v_provider_age_days, v_provider_rating, v_provider_country;

    -- 3. Trouver la règle qui s'applique (par priorité décroissante)
    v_selected_rule := NULL;

    FOR v_rule IN
      SELECT *
      FROM payment_release_rules
      WHERE is_active = true
      ORDER BY priority DESC
    LOOP
      v_rule_applies := false;

      -- Règle "all"
      IF v_rule.applies_to = 'all' AND v_rule.condition IS NULL THEN
        v_rule_applies := true;

      -- Règle "new_providers"
      ELSIF v_rule.applies_to = 'new_providers' AND v_rule.condition IS NOT NULL THEN
        IF v_provider_age_days <= (v_rule.condition->>'provider_age_days')::INTEGER THEN
          v_rule_applies := true;
        END IF;

      -- Règle "vip"
      ELSIF v_rule.applies_to = 'vip' AND v_rule.condition IS NOT NULL THEN
        IF v_provider_rating >= (v_rule.condition->>'provider_rating')::DECIMAL THEN
          v_rule_applies := true;
        END IF;

      -- Règle "amount_threshold"
      ELSIF v_rule.applies_to = 'amount_threshold' AND v_rule.condition IS NOT NULL THEN
        v_rule_applies := true;

        IF v_rule.condition ? 'min_amount' THEN
          IF v_amount_cents < (v_rule.condition->>'min_amount')::BIGINT THEN
            v_rule_applies := false;
          END IF;
        END IF;

        IF v_rule.condition ? 'max_amount' THEN
          IF v_amount_cents > (v_rule.condition->>'max_amount')::BIGINT THEN
            v_rule_applies := false;
          END IF;
        END IF;

      -- Règle "country"
      ELSIF v_rule.applies_to = 'country' AND v_rule.condition IS NOT NULL THEN
        -- Support pour plusieurs pays
        IF v_rule.condition ? 'countries' THEN
          IF v_rule.condition->'countries' @> to_jsonb(v_provider_country) THEN
            v_rule_applies := true;
          END IF;
        -- Support pour un seul pays
        ELSIF v_rule.condition ? 'country' THEN
          IF v_provider_country = v_rule.condition->>'country' THEN
            v_rule_applies := true;
          END IF;
        END IF;
      END IF;

      IF v_rule_applies THEN
        v_selected_rule := v_rule;
        RAISE NOTICE '✅ Rule "%" applies! (priority: %, delay: %h)',
          v_rule.name, v_rule.priority, v_rule.delay_hours;
        EXIT; -- Prendre la première règle (plus prioritaire)
      ELSE
        RAISE NOTICE '  ❌ Rule "%" does not apply', v_rule.name;
      END IF;
    END LOOP;

    -- 4. Si aucune règle ne s'applique, utiliser règle par défaut (14 jours)
    IF v_selected_rule IS NULL THEN
      RAISE NOTICE '⚠️  No rule applies, using default (14 days)';

      v_release_at := NOW() + INTERVAL '14 days';

      INSERT INTO scheduled_releases (
        earning_id, provider_id, amount_cents,
        rule_name, delay_hours, release_at, status
      ) VALUES (
        v_earning_id, v_user_id, v_amount_cents,
        'Défaut (14 jours)', 336, v_release_at, 'pending'
      );

      RAISE NOTICE '📅 Scheduled for: %', v_release_at;
      RETURN NEW;
    END IF;

    -- 5. Si delay = 0, libérer IMMÉDIATEMENT
    IF v_selected_rule.delay_hours = 0 THEN
      RAISE NOTICE '🚀 Delay is 0, releasing funds immediately...';

      v_released := release_provider_earning(NEW.id);

      IF v_released THEN
        RAISE NOTICE '✅ Funds released immediately with rule: %', v_selected_rule.name;
      ELSE
        RAISE WARNING '⚠️  Failed to release funds immediately';
      END IF;

    -- 6. Sinon, programmer le déblocage
    ELSE
      v_release_at := NOW() + (v_selected_rule.delay_hours || ' hours')::INTERVAL;

      INSERT INTO scheduled_releases (
        earning_id, provider_id, amount_cents,
        rule_id, rule_name, delay_hours, release_at, status
      ) VALUES (
        v_earning_id, v_user_id, v_amount_cents,
        v_selected_rule.id, v_selected_rule.name,
        v_selected_rule.delay_hours, v_release_at, 'pending'
      );

      RAISE NOTICE '📅 Release scheduled for: % (in %h)', v_release_at, v_selected_rule.delay_hours;
    END IF;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error in auto_apply_payment_rules: %', SQLERRM;
    RETURN NEW; -- Ne pas bloquer la transaction
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_apply_payment_rules IS
'Applique automatiquement les règles de release quand une commande est complétée';

-- ============================================================================
-- ÉTAPE 2: Créer le trigger sur la table orders
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auto_apply_payment_rules ON orders;

CREATE TRIGGER trg_auto_apply_payment_rules
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION auto_apply_payment_rules();

RAISE NOTICE '✅ Trigger créé: trg_auto_apply_payment_rules';

-- ============================================================================
-- ÉTAPE 3: Vérifier que le trigger est bien créé
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_auto_apply_payment_rules'
  ) THEN
    RAISE NOTICE '✅ Trigger actif et prêt!';
  ELSE
    RAISE EXCEPTION 'Le trigger n''a pas été créé!';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 4: Corriger la règle "regle_test" pour qu'elle fonctionne
-- ============================================================================

UPDATE payment_release_rules
SET
  applies_to = 'all',
  condition = NULL,
  is_active = true,
  priority = 100,
  updated_at = NOW()
WHERE name = 'regle_test';

RAISE NOTICE '✅ Règle "regle_test" corrigée: applies_to="all", delay=0h';

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Afficher les règles actives
SELECT
  name,
  delay_hours,
  applies_to,
  condition,
  is_active,
  priority,
  CASE
    WHEN applies_to = 'all' AND condition IS NULL THEN '✅ OK'
    WHEN applies_to = 'amount_threshold' AND condition IS NOT NULL THEN '✅ OK'
    WHEN applies_to = 'new_providers' AND condition ? 'provider_age_days' THEN '✅ OK'
    WHEN applies_to = 'vip' AND condition ? 'provider_rating' THEN '✅ OK'
    WHEN applies_to = 'country' AND (condition ? 'country' OR condition ? 'countries') THEN '✅ OK'
    ELSE '❌ INVALIDE'
  END as status
FROM payment_release_rules
WHERE is_active = true
ORDER BY priority DESC;

-- ============================================================================
-- 🎉 TERMINÉ!
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
RAISE NOTICE '🎉 SYSTÈME DE RELEASE AUTOMATIQUE ACTIVÉ!';
RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
RAISE NOTICE '';
RAISE NOTICE '✅ Le trigger s''exécutera automatiquement quand:';
RAISE NOTICE '   - Une commande passe au statut "completed"';
RAISE NOTICE '';
RAISE NOTICE '✅ Comportement selon les règles:';
RAISE NOTICE '   - delay_hours = 0 → Libération IMMÉDIATE des fonds';
RAISE NOTICE '   - delay_hours > 0 → Création d''un scheduled_release pour CRON';
RAISE NOTICE '';
RAISE NOTICE '✅ Votre règle "regle_test":';
RAISE NOTICE '   - Applique à: TOUS les paiements';
RAISE NOTICE '   - Délai: 0 heures (IMMÉDIAT)';
RAISE NOTICE '   - Priorité: 100 (haute)';
RAISE NOTICE '';
RAISE NOTICE '💡 COMMENT TESTER:';
RAISE NOTICE '   1. Acceptez une commande (bouton "Accepter la livraison")';
RAISE NOTICE '   2. La commande passera automatiquement à status="completed"';
RAISE NOTICE '   3. Le trigger détectera ce changement';
RAISE NOTICE '   4. Les fonds seront libérés IMMÉDIATEMENT';
RAISE NOTICE '   5. Vérifiez provider_balance: pending ↓, available ↑';
RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
