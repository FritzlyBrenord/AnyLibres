-- ============================================================================
-- FIX: Ajouter user_id à provider_earnings pour faciliter les requêtes
-- ============================================================================

-- 1. Ajouter la colonne user_id
ALTER TABLE provider_earnings
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. Ajouter un commentaire
COMMENT ON COLUMN provider_earnings.user_id IS 'ID de l utilisateur (auth.users.id) - facilite les requêtes API';

-- 3. Ajouter une contrainte FK vers auth.users
ALTER TABLE provider_earnings
ADD CONSTRAINT provider_earnings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Remplir user_id pour les earnings existants
UPDATE provider_earnings pe
SET user_id = (
  -- Essayer de résoudre provider_id → user_id
  COALESCE(
    -- Option 1: provider_id est déjà un user_id
    (SELECT id FROM auth.users WHERE id = pe.provider_id),
    -- Option 2: provider_id est un profile_id
    (SELECT user_id FROM profiles WHERE id = pe.provider_id),
    -- Option 3: provider_id est un providers.id
    (SELECT p.user_id FROM providers prov JOIN profiles p ON p.id = prov.profile_id WHERE prov.id = pe.provider_id)
  )
)
WHERE user_id IS NULL;

-- 5. Vérifier que tous les user_id sont remplis
SELECT
  COUNT(*) AS total_earnings,
  COUNT(user_id) AS with_user_id,
  COUNT(*) - COUNT(user_id) AS missing_user_id
FROM provider_earnings;

-- 6. Afficher les earnings avec user_id
SELECT
  pe.id,
  pe.provider_id,
  pe.user_id,
  u.email,
  pe.net_amount_cents / 100.0 AS net_euros,
  pe.status
FROM provider_earnings pe
LEFT JOIN auth.users u ON u.id = pe.user_id
LIMIT 10;

-- 7. Modifier la fonction create_provider_earning pour remplir user_id automatiquement
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
  SELECT COALESCE(
    -- Option 1: c'est déjà un user_id
    (SELECT id FROM auth.users WHERE id = v_order_provider_id),
    -- Option 2: c'est un profile_id
    (SELECT user_id FROM profiles WHERE id = v_order_provider_id),
    -- Option 3: c'est un providers.id
    (SELECT p.user_id FROM providers prov JOIN profiles p ON p.id = prov.profile_id WHERE prov.id = v_order_provider_id)
  ) INTO v_user_id;

  IF v_user_id IS NULL THEN
    RAISE WARNING 'Could not find user_id for provider %, skipping order %',
      v_order_provider_id, p_order_id;
    RETURN NULL;
  END IF;

  -- Calculer les montants
  SELECT * INTO v_amount_cents, v_fee_cents, v_net_cents
  FROM calculate_provider_net_amount(p_order_id);

  -- Créer l'earning avec provider_id ET user_id
  INSERT INTO provider_earnings (
    provider_id,
    user_id,
    order_id,
    amount_cents,
    platform_fee_cents,
    net_amount_cents,
    currency,
    status,
    metadata
  ) VALUES (
    v_order_provider_id,  -- On garde le provider_id original
    v_user_id,            -- On ajoute le user_id résolu
    p_order_id,
    v_amount_cents,
    v_fee_cents,
    v_net_cents,
    v_currency,
    'pending',
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

  -- Mettre à jour le solde pending du provider (utiliser user_id)
  INSERT INTO provider_balance (provider_id, pending_cents, currency)
  VALUES (v_user_id, v_net_cents, v_currency)
  ON CONFLICT (provider_id) DO UPDATE
  SET
    pending_cents = provider_balance.pending_cents + EXCLUDED.pending_cents,
    updated_at = NOW();

  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_provider_earning IS 'Crée un gain pour le prestataire - stocke provider_id ET user_id';

-- 8. Vérifier le résultat final
SELECT
  'RÉSULTAT FINAL' AS status,
  pe.user_id,
  u.email,
  COUNT(*) AS nb_earnings,
  SUM(pe.net_amount_cents) / 100.0 AS total_euros
FROM provider_earnings pe
JOIN auth.users u ON u.id = pe.user_id
GROUP BY pe.user_id, u.email
ORDER BY total_euros DESC;
