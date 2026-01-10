-- ============================================================================
-- FIX: Corriger le trigger auto_schedule_payment_release
-- ============================================================================
-- Problème: Le trigger soustrait de pending_cents mais create_provider_earning
--           a DÉJÀ ajouté au pending_cents
--
-- Erreur: pending_cents = 5000, on ajoute +1000 → 6000, puis on soustrait -1000 deux fois → -1000 ❌
--
-- Solution: Ne PAS toucher à pending_cents dans auto_schedule_payment_release
--           SAUF si delay_hours = 0, alors SEULEMENT transférer pending → available
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_schedule_payment_release()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_id UUID;
  v_provider_age_days INTEGER;
  v_provider_rating NUMERIC;
  v_country TEXT;
  v_selected_rule RECORD;
  v_rule_found BOOLEAN := FALSE;
  v_release_at TIMESTAMP WITH TIME ZONE;
  v_user_id UUID;
BEGIN
  -- Ne traiter que les earnings avec status = 'completed'
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Éviter de recréer si scheduled_release existe déjà
  IF EXISTS(SELECT 1 FROM scheduled_releases WHERE earning_id = NEW.id) THEN
    RAISE NOTICE 'Scheduled release already exists for earning %', NEW.id;
    RETURN NEW;
  END IF;

  -- Valider que net_amount_cents > 0
  IF NEW.net_amount_cents <= 0 THEN
    RAISE WARNING 'Skipping release for earning % with amount %', NEW.id, NEW.net_amount_cents;
    RETURN NEW;
  END IF;

  -- Déterminer le provider_id (peut être dans NEW.provider_id ou NEW.user_id)
  v_provider_id := COALESCE(NEW.user_id, NEW.provider_id);

  -- Récupérer les infos du provider pour évaluer les règles
  SELECT
    EXTRACT(DAY FROM (NOW() - u.created_at))::INTEGER,
    COALESCE(p.rating, 0),
    p.location->>'country'
  INTO v_provider_age_days, v_provider_rating, v_country
  FROM auth.users u
  LEFT JOIN profiles prof ON prof.user_id = u.id
  LEFT JOIN providers p ON p.profile_id = prof.id
  WHERE u.id = v_provider_id;

  -- Si provider pas trouvé, utiliser des valeurs par défaut
  IF NOT FOUND THEN
    v_provider_age_days := 0;
    v_provider_rating := 0;
    v_country := NULL;
  END IF;

  -- Chercher la règle applicable (par ordre de priorité)
  FOR v_selected_rule IN
    SELECT * FROM payment_release_rules
    WHERE is_active = TRUE
    ORDER BY priority DESC
  LOOP
    -- Évaluer chaque type de règle
    IF v_selected_rule.applies_to = 'all' AND v_selected_rule.condition IS NULL THEN
      v_rule_found := TRUE;
      EXIT;
    ELSIF v_selected_rule.applies_to = 'new_providers'
      AND v_provider_age_days <= COALESCE((v_selected_rule.condition->>'provider_age_days')::INTEGER, 30) THEN
      v_rule_found := TRUE;
      EXIT;
    ELSIF v_selected_rule.applies_to = 'vip'
      AND v_provider_rating >= COALESCE((v_selected_rule.condition->>'provider_rating')::NUMERIC, 4.5) THEN
      v_rule_found := TRUE;
      EXIT;
    ELSIF v_selected_rule.applies_to = 'amount_threshold' THEN
      IF (v_selected_rule.condition->>'min_amount')::BIGINT IS NULL
         OR NEW.net_amount_cents >= (v_selected_rule.condition->>'min_amount')::BIGINT THEN
        IF (v_selected_rule.condition->>'max_amount')::BIGINT IS NULL
           OR NEW.net_amount_cents <= (v_selected_rule.condition->>'max_amount')::BIGINT THEN
          v_rule_found := TRUE;
          EXIT;
        END IF;
      END IF;
    ELSIF v_selected_rule.applies_to = 'country' AND v_country IS NOT NULL THEN
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

  -- Si aucune règle trouvée, utiliser le défaut (14 jours)
  IF NOT v_rule_found THEN
    v_release_at := NOW() + INTERVAL '336 hours';
    INSERT INTO scheduled_releases (
      earning_id, provider_id, amount_cents, rule_id, rule_name,
      delay_hours, release_at, status, created_at
    ) VALUES (
      NEW.id, v_provider_id, NEW.net_amount_cents, NULL,
      'Défaut (14 jours)', 336, v_release_at, 'pending', NOW()
    );

    RAISE NOTICE 'Created default release (14 days) for earning %', NEW.id;

  ELSE
    -- Règle trouvée, créer le scheduled_release
    v_release_at := NOW() + (v_selected_rule.delay_hours || ' hours')::INTERVAL;
    INSERT INTO scheduled_releases (
      earning_id, provider_id, amount_cents, rule_id, rule_name,
      delay_hours, release_at, status, created_at
    ) VALUES (
      NEW.id, v_provider_id, NEW.net_amount_cents, v_selected_rule.id,
      v_selected_rule.name, v_selected_rule.delay_hours, v_release_at, 'pending', NOW()
    );

    RAISE NOTICE 'Created release with rule "%" (% hours) for earning %',
      v_selected_rule.name, v_selected_rule.delay_hours, NEW.id;

    -- =====================================================================
    -- CORRECTION CRITIQUE: Si delay_hours = 0 (libération immédiate)
    -- =====================================================================
    -- On transfère de pending vers available
    -- MAIS on ne touche PAS au total car create_provider_earning l'a déjà fait
    IF v_selected_rule.delay_hours = 0 THEN
      RAISE NOTICE 'Immediate release - transferring % cents from pending to available for provider %',
        NEW.net_amount_cents, v_provider_id;

      UPDATE provider_balance
      SET
        pending_cents = pending_cents - NEW.net_amount_cents,
        available_cents = available_cents + NEW.net_amount_cents,
        updated_at = NOW()
      WHERE provider_id = v_provider_id;

      -- Marquer le scheduled_release comme complété
      UPDATE scheduled_releases
      SET
        status = 'completed',
        completed_at = NOW()
      WHERE earning_id = NEW.id;

      RAISE NOTICE 'Immediate release completed for earning %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_schedule_payment_release IS
'Applique automatiquement les règles de déblocage de paiement.
IMPORTANT: Ne modifie pending_cents que si delay_hours = 0 (pour transfert vers available)';

-- Recréer le trigger
DROP TRIGGER IF EXISTS trg_auto_schedule_payment_release ON provider_earnings;

CREATE TRIGGER trg_auto_schedule_payment_release
  AFTER INSERT OR UPDATE OF status ON provider_earnings
  FOR EACH ROW WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_schedule_payment_release();

COMMENT ON TRIGGER trg_auto_schedule_payment_release ON provider_earnings IS
'Déclenche la création automatique d''un scheduled_release quand un earning est marqué comme complété';

-- ============================================================================
-- Vérifications
-- ============================================================================

SELECT 'Trigger recréé avec succès' as status;

-- Voir la définition du trigger
SELECT
  tgname as trigger_name,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgname = 'trg_auto_schedule_payment_release';
