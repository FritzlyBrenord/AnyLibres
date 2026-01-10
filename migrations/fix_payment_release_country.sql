-- ============================================================================
-- MIGRATION: Fix payment release system - country column
-- Corriger la référence à p.country qui n'existe pas
-- La colonne correcte est p.location->>'country'
-- ============================================================================

-- Recréer la vue upcoming_releases avec la bonne référence
CREATE OR REPLACE VIEW upcoming_releases AS
SELECT
  sr.*,
  pb.available_cents as current_available,
  pb.pending_cents as current_pending,
  p.company_name as provider_name,
  prof.email as provider_email
FROM scheduled_releases sr
JOIN provider_balance pb ON sr.provider_id = pb.provider_id
LEFT JOIN profiles prof ON sr.provider_id = prof.id
LEFT JOIN providers p ON prof.id = p.profile_id
WHERE sr.status = 'pending'
AND sr.release_at <= (NOW() + INTERVAL '24 hours')
ORDER BY sr.release_at ASC;

-- Recréer la fonction get_applicable_release_delay avec la bonne référence
CREATE OR REPLACE FUNCTION get_applicable_release_delay(
  p_provider_id UUID,
  p_amount_cents BIGINT
) RETURNS TABLE (
  rule_id UUID,
  rule_name TEXT,
  delay_hours INTEGER,
  release_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_provider_age_days INTEGER;
  v_provider_rating NUMERIC;
  v_country TEXT;
  v_rule RECORD;
BEGIN
  -- Récupérer les infos du provider avec location->>'country'
  SELECT
    EXTRACT(DAY FROM (NOW() - p.created_at))::INTEGER,
    p.rating,
    p.location->>'country' as country
  INTO v_provider_age_days, v_provider_rating, v_country
  FROM providers p
  WHERE p.id = p_provider_id;

  -- Chercher la règle applicable (par priorité)
  FOR v_rule IN
    SELECT * FROM payment_release_rules
    WHERE is_active = TRUE
    ORDER BY priority DESC
  LOOP
    -- Vérifier si la règle s'applique
    IF v_rule.applies_to = 'all' AND v_rule.condition IS NULL THEN
      -- Règle universelle
      RETURN QUERY SELECT
        v_rule.id,
        v_rule.name,
        v_rule.delay_hours,
        (NOW() + (v_rule.delay_hours || ' hours')::INTERVAL)::TIMESTAMP WITH TIME ZONE;
      RETURN;
    ELSIF v_rule.applies_to = 'new_providers'
      AND v_provider_age_days <= COALESCE((v_rule.condition->>'provider_age_days')::INTEGER, 30) THEN
      -- Nouveau provider
      RETURN QUERY SELECT
        v_rule.id,
        v_rule.name,
        v_rule.delay_hours,
        (NOW() + (v_rule.delay_hours || ' hours')::INTERVAL)::TIMESTAMP WITH TIME ZONE;
      RETURN;
    ELSIF v_rule.applies_to = 'vip'
      AND v_provider_rating >= COALESCE((v_rule.condition->>'provider_rating')::NUMERIC, 4.5) THEN
      -- VIP
      RETURN QUERY SELECT
        v_rule.id,
        v_rule.name,
        v_rule.delay_hours,
        (NOW() + (v_rule.delay_hours || ' hours')::INTERVAL)::TIMESTAMP WITH TIME ZONE;
      RETURN;
    ELSIF v_rule.applies_to = 'amount_threshold' THEN
      -- Vérifier seuils de montant
      IF (v_rule.condition->>'min_amount')::BIGINT IS NULL
         OR p_amount_cents >= (v_rule.condition->>'min_amount')::BIGINT THEN
        IF (v_rule.condition->>'max_amount')::BIGINT IS NULL
           OR p_amount_cents <= (v_rule.condition->>'max_amount')::BIGINT THEN
          RETURN QUERY SELECT
            v_rule.id,
            v_rule.name,
            v_rule.delay_hours,
            (NOW() + (v_rule.delay_hours || ' hours')::INTERVAL)::TIMESTAMP WITH TIME ZONE;
          RETURN;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Aucune règle ne s'applique, utiliser défaut (14 jours = 336 heures)
  RETURN QUERY SELECT
    NULL::UUID,
    'Défaut (14 jours)'::TEXT,
    336::INTEGER,
    (NOW() + INTERVAL '336 hours')::TIMESTAMP WITH TIME ZONE;
END;
$$ LANGUAGE plpgsql;

-- Recréer la fonction trigger auto_schedule_payment_release
CREATE OR REPLACE FUNCTION auto_schedule_payment_release()
RETURNS TRIGGER AS $$
DECLARE
  v_rule_info RECORD;
  v_release_at TIMESTAMP WITH TIME ZONE;
  v_provider_age_days INTEGER;
  v_provider_rating NUMERIC;
  v_country TEXT;
  v_selected_rule RECORD;
  v_rule_found BOOLEAN := FALSE;
BEGIN
  -- Ne traiter que les nouveaux earnings avec status = 'completed'
  -- (quand le client a validé le travail)
  IF NEW.status = 'completed' THEN
    -- Vérifier que le montant est positif
    IF NEW.net_amount_cents IS NULL OR NEW.net_amount_cents <= 0 THEN
      -- Pas de paiement à programmer si le montant est nul ou négatif
      RETURN NEW;
    END IF;

    -- Récupérer les infos du provider pour appliquer les règles
    SELECT
      EXTRACT(DAY FROM (NOW() - COALESCE(p.created_at, prof.created_at)))::INTEGER as provider_age_days,
      COALESCE(p.rating, 0) as provider_rating,
      p.location->>'country' as country
    INTO v_provider_age_days, v_provider_rating, v_country
    FROM providers p
    LEFT JOIN profiles prof ON p.profile_id = prof.id
    WHERE p.profile_id = NEW.provider_id OR prof.id = NEW.provider_id
    LIMIT 1;

    -- Si le provider n'existe pas dans la table providers, utiliser des valeurs par défaut
    IF v_provider_age_days IS NULL THEN
      v_provider_age_days := 0;
      v_provider_rating := 0;
    END IF;

    -- Trouver la règle applicable (par priorité)
    FOR v_selected_rule IN
      SELECT * FROM payment_release_rules
      WHERE is_active = TRUE
      ORDER BY priority DESC
    LOOP
      -- Vérifier si la règle s'applique
      IF v_selected_rule.applies_to = 'all' AND v_selected_rule.condition IS NULL THEN
        -- Règle universelle
        v_rule_found := TRUE;
        EXIT; -- Sortir de la boucle avec cette règle

      ELSIF v_selected_rule.applies_to = 'new_providers'
        AND v_provider_age_days <= COALESCE((v_selected_rule.condition->>'provider_age_days')::INTEGER, 30) THEN
        -- Nouveau provider
        v_rule_found := TRUE;
        EXIT;

      ELSIF v_selected_rule.applies_to = 'vip'
        AND v_provider_rating >= COALESCE((v_selected_rule.condition->>'provider_rating')::NUMERIC, 4.5) THEN
        -- VIP
        v_rule_found := TRUE;
        EXIT;

      ELSIF v_selected_rule.applies_to = 'amount_threshold' THEN
        -- Vérifier seuils de montant
        IF (v_selected_rule.condition->>'min_amount')::BIGINT IS NULL
           OR NEW.net_amount_cents >= (v_selected_rule.condition->>'min_amount')::BIGINT THEN
          IF (v_selected_rule.condition->>'max_amount')::BIGINT IS NULL
             OR NEW.net_amount_cents <= (v_selected_rule.condition->>'max_amount')::BIGINT THEN
            v_rule_found := TRUE;
            EXIT;
          END IF;
        END IF;

      ELSIF v_selected_rule.applies_to = 'country' AND v_country IS NOT NULL THEN
        -- Vérifier si le pays est dans la liste des pays autorisés
        IF v_selected_rule.condition->'countries' IS NOT NULL THEN
          IF v_selected_rule.condition->'countries' @> to_jsonb(ARRAY[v_country]) THEN
            v_rule_found := TRUE;
            EXIT;
          END IF;
        ELSIF v_selected_rule.condition->>'country' = v_country THEN
          v_rule_found := TRUE;
          EXIT;
        END IF;
      END IF;
    END LOOP;

    -- Si aucune règle trouvée, utiliser règle par défaut (14 jours = 336 heures)
    IF NOT v_rule_found THEN
      v_release_at := NOW() + INTERVAL '336 hours';

      -- Créer un scheduled_release avec règle par défaut
      INSERT INTO scheduled_releases (
        earning_id,
        provider_id,
        amount_cents,
        rule_id,
        rule_name,
        delay_hours,
        release_at,
        status,
        created_at
      ) VALUES (
        NEW.id,
        NEW.provider_id,
        NEW.net_amount_cents,
        NULL,
        'Défaut (14 jours)',
        336,
        v_release_at,
        'pending',
        NOW()
      );

      -- Ajouter le montant dans pending_cents
      INSERT INTO provider_balance (provider_id, pending_cents, total_earned_cents, currency)
      VALUES (NEW.provider_id, NEW.net_amount_cents, NEW.net_amount_cents, NEW.currency)
      ON CONFLICT (provider_id) DO UPDATE
      SET
        pending_cents = provider_balance.pending_cents + NEW.net_amount_cents,
        total_earned_cents = provider_balance.total_earned_cents + NEW.net_amount_cents,
        updated_at = NOW();

    ELSE
      -- Utiliser la règle trouvée
      v_release_at := NOW() + (v_selected_rule.delay_hours || ' hours')::INTERVAL;

      -- Créer un scheduled_release
      INSERT INTO scheduled_releases (
        earning_id,
        provider_id,
        amount_cents,
        rule_id,
        rule_name,
        delay_hours,
        release_at,
        status,
        created_at
      ) VALUES (
        NEW.id,
        NEW.provider_id,
        NEW.net_amount_cents,
        v_selected_rule.id,
        v_selected_rule.name,
        v_selected_rule.delay_hours,
        v_release_at,
        'pending',
        NOW()
      );

      -- Ajouter le montant dans pending_cents OU available_cents selon le délai
      IF v_selected_rule.delay_hours = 0 THEN
        -- Libération immédiate: ajouter directement dans available_cents
        INSERT INTO provider_balance (provider_id, available_cents, total_earned_cents, currency)
        VALUES (NEW.provider_id, NEW.net_amount_cents, NEW.net_amount_cents, NEW.currency)
        ON CONFLICT (provider_id) DO UPDATE
        SET
          available_cents = provider_balance.available_cents + NEW.net_amount_cents,
          total_earned_cents = provider_balance.total_earned_cents + NEW.net_amount_cents,
          updated_at = NOW();

        -- Marquer immédiatement le release comme completed
        UPDATE scheduled_releases
        SET status = 'completed', completed_at = NOW()
        WHERE earning_id = NEW.id;

      ELSE
        -- Avec délai: ajouter dans pending_cents
        INSERT INTO provider_balance (provider_id, pending_cents, total_earned_cents, currency)
        VALUES (NEW.provider_id, NEW.net_amount_cents, NEW.net_amount_cents, NEW.currency)
        ON CONFLICT (provider_id) DO UPDATE
        SET
          pending_cents = provider_balance.pending_cents + NEW.net_amount_cents,
          total_earned_cents = provider_balance.total_earned_cents + NEW.net_amount_cents,
          updated_at = NOW();
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trg_auto_schedule_payment_release ON provider_earnings;

CREATE TRIGGER trg_auto_schedule_payment_release
  AFTER INSERT OR UPDATE OF status ON provider_earnings
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_schedule_payment_release();

-- Commentaires
COMMENT ON FUNCTION auto_schedule_payment_release IS 'Applique automatiquement les règles de déblocage de paiement quand un earning est complété';
COMMENT ON TRIGGER trg_auto_schedule_payment_release ON provider_earnings IS 'Déclenche la création automatique d''un scheduled_release quand un earning est marqué comme complété';
