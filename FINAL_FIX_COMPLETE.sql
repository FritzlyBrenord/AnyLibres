-- ============================================================================
-- FIX COMPLET: Recalculer les balances + Corriger le trigger
-- ============================================================================
-- Étape 1: Recalculer TOUTES les balances from scratch
-- Étape 2: Corriger le trigger auto_schedule_payment_release
-- Étape 3: Supprimer le trigger sur 'delivered'
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: RECALCULER TOUTES LES BALANCES FROM SCRATCH
-- ============================================================================

DO $$
DECLARE
  v_provider RECORD;
  v_total_earned BIGINT;
  v_total_available BIGINT;
  v_total_pending BIGINT;
BEGIN
  RAISE NOTICE '=== RECALCUL DE TOUTES LES BALANCES ===';

  -- Pour chaque provider dans provider_balance
  FOR v_provider IN SELECT DISTINCT provider_id FROM provider_balance
  LOOP
    -- Calculer le total earned (somme de tous les earnings)
    SELECT COALESCE(SUM(net_amount_cents), 0)
    INTO v_total_earned
    FROM provider_earnings
    WHERE provider_id = v_provider.provider_id;

    -- Calculer le total available (somme des releases completed)
    SELECT COALESCE(SUM(amount_cents), 0)
    INTO v_total_available
    FROM scheduled_releases
    WHERE provider_id = v_provider.provider_id
    AND status = 'completed';

    -- Calculer le pending (earned - available - withdrawn)
    SELECT GREATEST(
      v_total_earned - v_total_available - COALESCE(withdrawn_cents, 0),
      0
    )
    INTO v_total_pending
    FROM provider_balance
    WHERE provider_id = v_provider.provider_id;

    -- Mettre à jour la balance
    UPDATE provider_balance
    SET
      total_earned_cents = v_total_earned,
      available_cents = v_total_available,
      pending_cents = v_total_pending,
      updated_at = NOW()
    WHERE provider_id = v_provider.provider_id;

    RAISE NOTICE 'Provider %: earned=% available=% pending=%',
      v_provider.provider_id, v_total_earned, v_total_available, v_total_pending;
  END LOOP;

  RAISE NOTICE '=== RECALCUL TERMINÉ ===';
END $$;

-- ============================================================================
-- ÉTAPE 2: CORRIGER LE TRIGGER auto_schedule_payment_release
-- ============================================================================
-- Le trigger NE DOIT PAS toucher à pending_cents
-- Car create_provider_earning l'a DÉJÀ fait
-- SAUF si delay = 0, alors on transfère pending → available

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

  -- Déterminer le provider_id
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

    -- Si delay_hours = 0 (libération immédiate)
    -- Transférer de pending vers available
    IF v_selected_rule.delay_hours = 0 THEN
      RAISE NOTICE 'Immediate release - transferring % cents from pending to available',
        NEW.net_amount_cents;

      UPDATE provider_balance
      SET
        pending_cents = pending_cents - NEW.net_amount_cents,
        available_cents = available_cents + NEW.net_amount_cents,
        updated_at = NOW()
      WHERE provider_id = v_provider_id;

      -- Marquer le scheduled_release comme complété
      UPDATE scheduled_releases
      SET status = 'completed', completed_at = NOW()
      WHERE earning_id = NEW.id;

      RAISE NOTICE 'Immediate release completed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_schedule_payment_release IS 'Applique les règles de déblocage (ne touche pas pending_cents sauf si delay=0)';

-- Recréer le trigger
DROP TRIGGER IF EXISTS trg_auto_schedule_payment_release ON provider_earnings;
CREATE TRIGGER trg_auto_schedule_payment_release
  AFTER INSERT OR UPDATE OF status ON provider_earnings
  FOR EACH ROW WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_schedule_payment_release();

-- ============================================================================
-- ÉTAPE 3: SUPPRIMER LE TRIGGER SUR 'delivered'
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auto_create_earning ON orders;
DROP FUNCTION IF EXISTS auto_create_earning_on_delivery() CASCADE;

-- ============================================================================
-- VÉRIFICATIONS FINALES
-- ============================================================================

-- Voir les balances recalculées
SELECT
  'Balances recalculées' as info,
  provider_id,
  pending_cents / 100.0 as pending_eur,
  available_cents / 100.0 as available_eur,
  total_earned_cents / 100.0 as total_eur,
  withdrawn_cents / 100.0 as withdrawn_eur
FROM provider_balance
ORDER BY total_earned_cents DESC;

-- Vérifier les triggers
SELECT
  'Triggers actifs' as info,
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE '%earning%'
OR tgname LIKE '%release%'
ORDER BY tgname;

SELECT '=== FIX COMPLET APPLIQUÉ ===' as status;
