-- ============================================================================
-- ⚠️ FICHIER COMPLET - TOUTES LES CORRECTIONS
-- ============================================================================
-- COPIER ET EXÉCUTER CE FICHIER DANS SUPABASE SQL EDITOR
--
-- Ce script corrige:
-- 1. Système de paiement automatique (country, v_rule_found, montant > 0)
-- 2. Calcul des frais avec min_fee_cents
-- ============================================================================

-- ============================================================================
-- PARTIE 1: Correction du calcul des frais (min_fee_cents)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_provider_net_amount(
  p_order_id UUID
) RETURNS TABLE (
  amount_cents BIGINT,
  platform_fee_cents BIGINT,
  net_amount_cents BIGINT
) AS $$
DECLARE
  v_total_cents BIGINT;
  v_fees_cents BIGINT;
  v_metadata JSONB;
  v_fee_config JSONB;
  v_min_fee_cents BIGINT;
  v_adjusted_fee_cents BIGINT;
BEGIN
  -- Récupérer les informations de la commande
  SELECT o.total_cents, o.fees_cents, o.metadata
  INTO v_total_cents, v_fees_cents, v_metadata
  FROM orders o
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Vérifier la configuration des frais dans metadata
  v_fee_config := v_metadata->'pricing'->'fee_config';

  -- Récupérer min_fee_cents (défaut 238 = 2.38€)
  v_min_fee_cents := COALESCE((v_fee_config->>'min_fee_cents')::BIGINT, 238);

  -- Déterminer qui paie les frais
  IF v_fee_config->>'paid_by' = 'provider' THEN
    -- Le prestataire paie les frais

    -- Si les frais dépassent le montant total, appliquer seulement min_fee_cents
    IF v_fees_cents >= v_total_cents THEN
      v_adjusted_fee_cents := v_min_fee_cents;

      -- Si même min_fee_cents dépasse le total, le provider reçoit 0
      IF v_min_fee_cents >= v_total_cents THEN
        RETURN QUERY SELECT
          v_total_cents AS amount_cents,
          v_total_cents AS platform_fee_cents,  -- Prendre tout
          0::BIGINT AS net_amount_cents;
      ELSE
        -- Provider reçoit total - min_fee_cents
        RETURN QUERY SELECT
          v_total_cents AS amount_cents,
          v_adjusted_fee_cents AS platform_fee_cents,
          (v_total_cents - v_adjusted_fee_cents) AS net_amount_cents;
      END IF;
    ELSE
      -- Cas normal: frais < montant total
      RETURN QUERY SELECT
        v_total_cents AS amount_cents,
        v_fees_cents AS platform_fee_cents,
        (v_total_cents - v_fees_cents) AS net_amount_cents;
    END IF;

  ELSIF v_fee_config->>'paid_by' = 'split' THEN
    -- Frais partagés : chacun paie la moitié
    RETURN QUERY SELECT
      v_total_cents AS amount_cents,
      (v_fees_cents / 2) AS platform_fee_cents,
      (v_total_cents - (v_fees_cents / 2)) AS net_amount_cents;

  ELSE
    -- 'client' ou défaut : le client paie les frais, le provider reçoit le sous-total
    RETURN QUERY SELECT
      (v_total_cents - v_fees_cents) AS amount_cents,
      0::BIGINT AS platform_fee_cents,
      (v_total_cents - v_fees_cents) AS net_amount_cents;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_provider_net_amount IS 'Calcule le montant net à verser au prestataire (avec gestion min_fee_cents)';

-- ============================================================================
-- PARTIE 2: Correction du système de paiement automatique
-- ============================================================================

-- 2.1. Recréer la vue upcoming_releases
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

-- 2.2. Recréer la fonction get_applicable_release_delay
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
  SELECT
    EXTRACT(DAY FROM (NOW() - p.created_at))::INTEGER,
    p.rating,
    p.location->>'country' as country
  INTO v_provider_age_days, v_provider_rating, v_country
  FROM providers p
  WHERE p.id = p_provider_id;

  FOR v_rule IN
    SELECT * FROM payment_release_rules
    WHERE is_active = TRUE
    ORDER BY priority DESC
  LOOP
    IF v_rule.applies_to = 'all' AND v_rule.condition IS NULL THEN
      RETURN QUERY SELECT v_rule.id, v_rule.name, v_rule.delay_hours,
        (NOW() + (v_rule.delay_hours || ' hours')::INTERVAL)::TIMESTAMP WITH TIME ZONE;
      RETURN;
    ELSIF v_rule.applies_to = 'new_providers'
      AND v_provider_age_days <= COALESCE((v_rule.condition->>'provider_age_days')::INTEGER, 30) THEN
      RETURN QUERY SELECT v_rule.id, v_rule.name, v_rule.delay_hours,
        (NOW() + (v_rule.delay_hours || ' hours')::INTERVAL)::TIMESTAMP WITH TIME ZONE;
      RETURN;
    ELSIF v_rule.applies_to = 'vip'
      AND v_provider_rating >= COALESCE((v_rule.condition->>'provider_rating')::NUMERIC, 4.5) THEN
      RETURN QUERY SELECT v_rule.id, v_rule.name, v_rule.delay_hours,
        (NOW() + (v_rule.delay_hours || ' hours')::INTERVAL)::TIMESTAMP WITH TIME ZONE;
      RETURN;
    ELSIF v_rule.applies_to = 'amount_threshold' THEN
      IF (v_rule.condition->>'min_amount')::BIGINT IS NULL
         OR p_amount_cents >= (v_rule.condition->>'min_amount')::BIGINT THEN
        IF (v_rule.condition->>'max_amount')::BIGINT IS NULL
           OR p_amount_cents <= (v_rule.condition->>'max_amount')::BIGINT THEN
          RETURN QUERY SELECT v_rule.id, v_rule.name, v_rule.delay_hours,
            (NOW() + (v_rule.delay_hours || ' hours')::INTERVAL)::TIMESTAMP WITH TIME ZONE;
          RETURN;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT NULL::UUID, 'Défaut (14 jours)'::TEXT, 336::INTEGER,
    (NOW() + INTERVAL '336 hours')::TIMESTAMP WITH TIME ZONE;
END;
$$ LANGUAGE plpgsql;

-- 2.3. Recréer la fonction trigger auto_schedule_payment_release
CREATE OR REPLACE FUNCTION auto_schedule_payment_release()
RETURNS TRIGGER AS $$
DECLARE
  v_release_at TIMESTAMP WITH TIME ZONE;
  v_provider_age_days INTEGER;
  v_provider_rating NUMERIC;
  v_country TEXT;
  v_selected_rule RECORD;
  v_rule_found BOOLEAN := FALSE;
BEGIN
  IF NEW.status = 'completed' THEN
    -- Vérifier que le montant est positif
    IF NEW.net_amount_cents IS NULL OR NEW.net_amount_cents <= 0 THEN
      -- Pas de paiement à programmer si le montant est nul ou négatif
      RETURN NEW;
    END IF;

    SELECT
      EXTRACT(DAY FROM (NOW() - COALESCE(p.created_at, prof.created_at)))::INTEGER as provider_age_days,
      COALESCE(p.rating, 0) as provider_rating,
      p.location->>'country' as country
    INTO v_provider_age_days, v_provider_rating, v_country
    FROM providers p
    LEFT JOIN profiles prof ON p.profile_id = prof.id
    WHERE p.profile_id = NEW.provider_id OR prof.id = NEW.provider_id
    LIMIT 1;

    IF v_provider_age_days IS NULL THEN
      v_provider_age_days := 0;
      v_provider_rating := 0;
    END IF;

    FOR v_selected_rule IN
      SELECT * FROM payment_release_rules WHERE is_active = TRUE ORDER BY priority DESC
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

    IF NOT v_rule_found THEN
      v_release_at := NOW() + INTERVAL '336 hours';
      INSERT INTO scheduled_releases (
        earning_id, provider_id, amount_cents, rule_id, rule_name,
        delay_hours, release_at, status, created_at
      ) VALUES (
        NEW.id, COALESCE(NEW.user_id, NEW.provider_id), NEW.net_amount_cents, NULL,
        'Défaut (14 jours)', 336, v_release_at, 'pending', NOW()
      );
      -- NOTE: provider_balance.pending_cents est déjà mis à jour par create_provider_earning()
      -- Ne pas mettre à jour ici pour éviter les doublons
    ELSE
      v_release_at := NOW() + (v_selected_rule.delay_hours || ' hours')::INTERVAL;
      INSERT INTO scheduled_releases (
        earning_id, provider_id, amount_cents, rule_id, rule_name,
        delay_hours, release_at, status, created_at
      ) VALUES (
        NEW.id, COALESCE(NEW.user_id, NEW.provider_id), NEW.net_amount_cents, v_selected_rule.id,
        v_selected_rule.name, v_selected_rule.delay_hours, v_release_at, 'pending', NOW()
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
        WHERE provider_id = COALESCE(NEW.user_id, NEW.provider_id);

        UPDATE scheduled_releases SET status = 'completed', completed_at = NOW()
        WHERE earning_id = NEW.id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2.4. Recréer le trigger
DROP TRIGGER IF EXISTS trg_auto_schedule_payment_release ON provider_earnings;
CREATE TRIGGER trg_auto_schedule_payment_release
  AFTER INSERT OR UPDATE OF status ON provider_earnings
  FOR EACH ROW WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_schedule_payment_release();

COMMENT ON FUNCTION auto_schedule_payment_release IS 'Applique automatiquement les règles de déblocage de paiement quand un earning est complété';
COMMENT ON TRIGGER trg_auto_schedule_payment_release ON provider_earnings IS 'Déclenche la création automatique d''un scheduled_release quand un earning est marqué comme complété';

-- ============================================================================
-- PARTIE 3: Fonction create_provider_earning avec status = 'completed'
-- ============================================================================

CREATE OR REPLACE FUNCTION create_provider_earning(
  p_order_id UUID
) RETURNS UUID AS $$
DECLARE
  v_order_provider_id UUID;
  v_user_id UUID;
  v_earning_id UUID;
  v_amount_cents BIGINT;
  v_fee_cents BIGINT;
  v_net_cents BIGINT;
  v_currency TEXT;
BEGIN
  -- Récupérer le provider_id de la commande
  SELECT provider_id, currency
  INTO v_order_provider_id, v_currency
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Trouver le user_id correspondant au provider
  -- On essaie d'abord avec providers.id → profiles.user_id
  SELECT p.user_id INTO v_user_id
  FROM providers prov
  JOIN profiles p ON p.id = prov.profile_id
  WHERE prov.id = v_order_provider_id;

  -- Si pas trouvé, peut-être que provider_id est déjà le profile_id
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id
    FROM profiles
    WHERE id = v_order_provider_id;
  END IF;

  -- Si toujours pas trouvé, peut-être que c'est déjà un user_id
  IF v_user_id IS NULL THEN
    -- Vérifier si c'est un user_id valide
    IF EXISTS(SELECT 1 FROM auth.users WHERE id = v_order_provider_id) THEN
      v_user_id := v_order_provider_id;
    END IF;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE WARNING 'Could not find user_id for provider %, skipping order %',
      v_order_provider_id, p_order_id;
    RETURN NULL;
  END IF;

  -- Calculer les montants
  SELECT * INTO v_amount_cents, v_fee_cents, v_net_cents
  FROM calculate_provider_net_amount(p_order_id);

  -- Créer l'earning avec status = 'completed' pour déclencher le trigger
  INSERT INTO provider_earnings (
    provider_id,
    order_id,
    amount_cents,
    platform_fee_cents,
    net_amount_cents,
    currency,
    status,
    metadata
  ) VALUES (
    v_user_id,  -- On stocke le user_id, pas le provider_id
    p_order_id,
    v_amount_cents,
    v_fee_cents,
    v_net_cents,
    v_currency,
    'completed',  -- Status = 'completed' pour déclencher auto_schedule_payment_release
    jsonb_build_object(
      'created_by', 'system',
      'created_at', NOW(),
      'original_provider_id', v_order_provider_id
    )
  )
  ON CONFLICT (order_id) DO NOTHING
  RETURNING id INTO v_earning_id;

  -- Si pas d'insertion (conflit), récupérer l'ID existant
  IF v_earning_id IS NULL THEN
    SELECT id INTO v_earning_id
    FROM provider_earnings
    WHERE order_id = p_order_id;

    RAISE NOTICE 'Earning already exists for order %', p_order_id;
    RETURN v_earning_id;
  END IF;

  -- Mettre à jour le solde pending du provider
  INSERT INTO provider_balance (provider_id, pending_cents, currency)
  VALUES (v_user_id, v_net_cents, v_currency)
  ON CONFLICT (provider_id) DO UPDATE
  SET
    pending_cents = provider_balance.pending_cents + EXCLUDED.pending_cents,
    updated_at = NOW();

  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_provider_earning IS 'Crée un gain pour le prestataire à partir d une commande (status=completed pour trigger auto_schedule)';

-- ============================================================================
-- ✅ TERMINÉ - TOUTES LES CORRECTIONS APPLIQUÉES !
-- ============================================================================
SELECT '✅ Toutes les corrections appliquées avec succès !' as resultat;
