-- ============================================================================
-- Fonction pour libération manuelle des fonds par l'administrateur
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_release_pending_funds(
  p_provider_id UUID,
  p_amount_cents BIGINT DEFAULT NULL  -- NULL = tout libérer, sinon montant spécifique
) RETURNS TABLE (
  success BOOLEAN,
  released_cents BIGINT,
  new_available_cents BIGINT,
  new_pending_cents BIGINT,
  message TEXT
) AS $$
DECLARE
  v_current_pending BIGINT;
  v_amount_to_release BIGINT;
  v_new_available BIGINT;
  v_new_pending BIGINT;
BEGIN
  -- Récupérer le solde pending actuel
  SELECT pending_cents INTO v_current_pending
  FROM provider_balance
  WHERE provider_id = p_provider_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE as success,
      0::BIGINT as released_cents,
      0::BIGINT as new_available_cents,
      0::BIGINT as new_pending_cents,
      'Provider balance not found'::TEXT as message;
    RETURN;
  END IF;

  -- Vérifier qu'il y a des fonds en attente
  IF v_current_pending <= 0 THEN
    RETURN QUERY SELECT
      FALSE as success,
      0::BIGINT as released_cents,
      0::BIGINT as new_available_cents,
      v_current_pending as new_pending_cents,
      'No pending funds to release'::TEXT as message;
    RETURN;
  END IF;

  -- Déterminer le montant à libérer
  IF p_amount_cents IS NULL THEN
    v_amount_to_release := v_current_pending;
  ELSE
    -- Vérifier que le montant demandé ne dépasse pas le pending
    IF p_amount_cents > v_current_pending THEN
      RETURN QUERY SELECT
        FALSE as success,
        0::BIGINT as released_cents,
        0::BIGINT as new_available_cents,
        v_current_pending as new_pending_cents,
        format('Requested amount (%s) exceeds pending balance (%s)',
          p_amount_cents, v_current_pending)::TEXT as message;
      RETURN;
    END IF;
    v_amount_to_release := p_amount_cents;
  END IF;

  -- Transférer de pending vers available
  UPDATE provider_balance
  SET
    pending_cents = pending_cents - v_amount_to_release,
    available_cents = available_cents + v_amount_to_release,
    updated_at = NOW()
  WHERE provider_id = p_provider_id
  RETURNING available_cents, pending_cents
  INTO v_new_available, v_new_pending;

  -- Marquer les scheduled_releases correspondants comme complétés
  UPDATE scheduled_releases
  SET
    status = 'completed',
    completed_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'manually_released', true,
        'released_by', 'admin',
        'released_at', NOW()
      )
  WHERE provider_id = p_provider_id
  AND status = 'pending'
  AND amount_cents <= v_amount_to_release;

  -- Retourner le résultat
  RETURN QUERY SELECT
    TRUE as success,
    v_amount_to_release as released_cents,
    v_new_available as new_available_cents,
    v_new_pending as new_pending_cents,
    format('Successfully released %s cents. New available: %s, pending: %s',
      v_amount_to_release, v_new_available, v_new_pending)::TEXT as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_release_pending_funds IS 'Permet à l''administrateur de libérer manuellement les fonds en attente d''un prestataire';

-- ============================================================================
-- Fonction pour obtenir les détails des fonds en attente d'un prestataire
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_releases_details(
  p_provider_id UUID
) RETURNS TABLE (
  scheduled_release_id UUID,
  earning_id UUID,
  order_id UUID,
  amount_cents BIGINT,
  rule_name TEXT,
  delay_hours INTEGER,
  release_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.id as scheduled_release_id,
    sr.earning_id,
    pe.order_id,
    sr.amount_cents,
    sr.rule_name,
    sr.delay_hours,
    sr.release_at,
    sr.status,
    sr.created_at
  FROM scheduled_releases sr
  LEFT JOIN provider_earnings pe ON sr.earning_id = pe.id
  WHERE sr.provider_id = p_provider_id
  AND sr.status = 'pending'
  ORDER BY sr.release_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pending_releases_details IS 'Récupère les détails des libérations de fonds programmées pour un prestataire';

-- Test de la fonction
SELECT * FROM admin_release_pending_funds('112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6', NULL);
