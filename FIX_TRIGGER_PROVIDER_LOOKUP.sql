-- ============================================================================
-- FIX: Corriger la recherche du provider dans auto_schedule_payment_release
-- ============================================================================
-- Problème: Le trigger cherche le provider avec NEW.provider_id
--           mais dans provider_earnings, on stocke user_id (auth.users.id)
--
-- Solution: Utiliser la bonne jointure user_id → profiles → providers
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_schedule_payment_release()
RETURNS TRIGGER
SECURITY DEFINER  -- CRITICAL: Permet d'accéder à auth.users
SET search_path = public, pg_temp
AS $$
DECLARE
  v_release_at TIMESTAMP WITH TIME ZONE;
  v_provider_age_days INTEGER;
  v_provider_rating NUMERIC;
  v_country TEXT;
  v_selected_rule RECORD;
  v_rule_found BOOLEAN := FALSE;
  v_provider_id UUID;
BEGIN
  IF NEW.status = 'completed' THEN
    -- Vérifier que le montant est positif
    IF NEW.net_amount_cents IS NULL OR NEW.net_amount_cents <= 0 THEN
      RETURN NEW;
    END IF;

    -- CORRECTION: NEW.provider_id dans provider_earnings = user_id (auth.users.id)
    -- Il faut chercher: user_id → profiles → providers
    v_provider_id := COALESCE(NEW.user_id, NEW.provider_id);

    SELECT
      EXTRACT(DAY FROM (NOW() - u.created_at))::INTEGER as provider_age_days,
      COALESCE(p.rating, 0) as provider_rating,
      p.location->>'country' as country
    INTO v_provider_age_days, v_provider_rating, v_country
    FROM auth.users u
    LEFT JOIN profiles prof ON prof.user_id = u.id
    LEFT JOIN providers p ON p.profile_id = prof.id
    WHERE u.id = v_provider_id;

    -- Si provider pas trouvé, utiliser des valeurs par défaut
    IF v_provider_age_days IS NULL THEN
      v_provider_age_days := 0;
      v_provider_rating := 0;
      v_country := NULL;
      RAISE WARNING 'Provider not found for user_id %, using defaults', v_provider_id;
    END IF;

    RAISE NOTICE 'Provider info: age=% days, rating=%, country=%',
      v_provider_age_days, v_provider_rating, v_country;

    -- Chercher la règle applicable
    FOR v_selected_rule IN
      SELECT * FROM payment_release_rules WHERE is_active = TRUE ORDER BY priority DESC
    LOOP
      RAISE NOTICE 'Evaluating rule: % (type: %)', v_selected_rule.name, v_selected_rule.applies_to;

      IF v_selected_rule.applies_to = 'all' AND v_selected_rule.condition IS NULL THEN
        RAISE NOTICE 'Rule matches: all (no condition)';
        v_rule_found := TRUE;
        EXIT;
      ELSIF v_selected_rule.applies_to = 'new_providers'
        AND v_provider_age_days <= COALESCE((v_selected_rule.condition->>'provider_age_days')::INTEGER, 30) THEN
        RAISE NOTICE 'Rule matches: new_providers';
        v_rule_found := TRUE;
        EXIT;
      ELSIF v_selected_rule.applies_to = 'vip'
        AND v_provider_rating >= COALESCE((v_selected_rule.condition->>'provider_rating')::NUMERIC, 4.5) THEN
        RAISE NOTICE 'Rule matches: vip';
        v_rule_found := TRUE;
        EXIT;
      ELSIF v_selected_rule.applies_to = 'amount_threshold' THEN
        DECLARE
          v_min_amount BIGINT := (v_selected_rule.condition->>'min_amount')::BIGINT;
          v_max_amount BIGINT := (v_selected_rule.condition->>'max_amount')::BIGINT;
        BEGIN
          RAISE NOTICE 'Checking amount_threshold: amount=%, min=%, max=%',
            NEW.net_amount_cents, v_min_amount, v_max_amount;

          IF (v_min_amount IS NULL OR NEW.net_amount_cents >= v_min_amount) THEN
            IF (v_max_amount IS NULL OR NEW.net_amount_cents <= v_max_amount) THEN
              RAISE NOTICE 'Rule matches: amount_threshold';
              v_rule_found := TRUE;
              EXIT;
            END IF;
          END IF;
        END;
      ELSIF v_selected_rule.applies_to = 'country' AND v_country IS NOT NULL THEN
        IF v_selected_rule.condition->'countries' IS NOT NULL THEN
          IF v_selected_rule.condition->'countries' @> to_jsonb(ARRAY[v_country]) THEN
            RAISE NOTICE 'Rule matches: country (array)';
            v_rule_found := TRUE;
            EXIT;
          END IF;
        ELSIF v_selected_rule.condition->>'country' = v_country THEN
          RAISE NOTICE 'Rule matches: country (single)';
          v_rule_found := TRUE;
          EXIT;
        END IF;
      END IF;
    END LOOP;

    -- Si aucune règle trouvée, utiliser le défaut (14 jours)
    IF NOT v_rule_found THEN
      RAISE NOTICE 'No rule matched - using default (14 days)';
      v_release_at := NOW() + INTERVAL '336 hours';
      INSERT INTO scheduled_releases (
        earning_id, provider_id, amount_cents, rule_id, rule_name,
        delay_hours, release_at, status, created_at
      ) VALUES (
        NEW.id, v_provider_id, NEW.net_amount_cents, NULL,
        'Défaut (14 jours)', 336, v_release_at, 'pending', NOW()
      );
    ELSE
      -- Règle trouvée !
      RAISE NOTICE 'Rule matched: "%" with delay_hours=%', v_selected_rule.name, v_selected_rule.delay_hours;

      v_release_at := NOW() + (v_selected_rule.delay_hours || ' hours')::INTERVAL;
      INSERT INTO scheduled_releases (
        earning_id, provider_id, amount_cents, rule_id, rule_name,
        delay_hours, release_at, status, created_at
      ) VALUES (
        NEW.id, v_provider_id, NEW.net_amount_cents, v_selected_rule.id,
        v_selected_rule.name, v_selected_rule.delay_hours, v_release_at, 'pending', NOW()
      );

      -- Pour les releases immédiates (delay = 0), transférer de pending vers available
      IF v_selected_rule.delay_hours = 0 THEN
        RAISE NOTICE 'Immediate release - transferring % cents from pending to available', NEW.net_amount_cents;

        UPDATE provider_balance
        SET
          pending_cents = pending_cents - NEW.net_amount_cents,
          available_cents = available_cents + NEW.net_amount_cents,
          total_earned_cents = total_earned_cents + NEW.net_amount_cents,
          updated_at = NOW()
        WHERE provider_id = v_provider_id;

        UPDATE scheduled_releases SET status = 'completed', completed_at = NOW()
        WHERE earning_id = NEW.id;

        RAISE NOTICE 'Immediate release completed';
      ELSE
        -- Mettre à jour total_earned_cents pour les releases avec délai
        UPDATE provider_balance
        SET
          total_earned_cents = total_earned_cents + NEW.net_amount_cents,
          updated_at = NOW()
        WHERE provider_id = v_provider_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_schedule_payment_release IS 'Applique les règles de déblocage (recherche provider via user_id → profiles → providers)';

-- Recréer le trigger
DROP TRIGGER IF EXISTS trg_auto_schedule_payment_release ON provider_earnings;
CREATE TRIGGER trg_auto_schedule_payment_release
  AFTER INSERT OR UPDATE OF status ON provider_earnings
  FOR EACH ROW WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_schedule_payment_release();

-- Vérification
SELECT 'Trigger corrigé - teste maintenant avec une nouvelle commande' as status;
