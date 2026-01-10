-- ============================================================================
-- FIX: Appliquer min_fee_cents quand le montant est insuffisant
-- ============================================================================
-- Problème: Quand amount <= platform_fee, le provider reçoit 0€
-- Solution: Utiliser min_fee_cents dans ce cas
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

-- Test de la fonction
SELECT '✅ Fonction mise à jour avec succès !' as resultat;
