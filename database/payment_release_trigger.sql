-- ============================================================================
-- TRIGGER: Intégration automatique du système de déblocage de paiements
-- Quand un nouveau earning est créé, créer automatiquement un scheduled_release
-- ============================================================================

-- Fonction trigger pour créer automatiquement un scheduled_release
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

      -- NOTE: provider_balance.pending_cents est déjà mis à jour par create_provider_earning()
      -- Ne pas mettre à jour ici pour éviter les doublons

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

      -- NOTE: provider_balance.pending_cents est déjà mis à jour par create_provider_earning()
      -- Ne pas mettre à jour ici pour éviter les doublons

      -- Pour les releases immédiates (delay = 0), transférer de pending vers available
      IF v_selected_rule.delay_hours = 0 THEN
        UPDATE provider_balance
        SET
          pending_cents = pending_cents - NEW.net_amount_cents,
          available_cents = available_cents + NEW.net_amount_cents,
          updated_at = NOW()
        WHERE provider_id = NEW.provider_id;

        UPDATE scheduled_releases
        SET status = 'completed', completed_at = NOW()
        WHERE earning_id = NEW.id;
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur provider_earnings
DROP TRIGGER IF EXISTS trg_auto_schedule_payment_release ON provider_earnings;

CREATE TRIGGER trg_auto_schedule_payment_release
  AFTER INSERT OR UPDATE OF status ON provider_earnings
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_schedule_payment_release();

-- Commentaires
COMMENT ON FUNCTION auto_schedule_payment_release IS 'Applique automatiquement les règles de déblocage de paiement quand un earning est complété';
COMMENT ON TRIGGER trg_auto_schedule_payment_release ON provider_earnings IS 'Déclenche la création automatique d''un scheduled_release quand un earning est marqué comme complété';
