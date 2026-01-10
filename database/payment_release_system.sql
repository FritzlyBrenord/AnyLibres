-- ============================================================================
-- Tables pour le système de déblocage automatique des paiements
-- ============================================================================

-- Table pour les règles de déblocage configurables par l'admin
CREATE TABLE IF NOT EXISTS public.payment_release_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  delay_hours INTEGER NOT NULL, -- Délai en heures (0 = immédiat, 336 = 14 jours, etc.)
  applies_to TEXT NOT NULL, -- 'all', 'new_providers', 'vip', 'amount_threshold', 'country'
  condition JSONB NULL, -- Conditions supplémentaires (min_amount, max_amount, provider_age_days, etc.)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 0, -- Plus élevé = prioritaire
  created_by UUID NULL, -- NULL pour les règles système par défaut
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_release_rules_pkey PRIMARY KEY (id),
  CONSTRAINT payment_release_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT payment_release_rules_delay_check CHECK (delay_hours >= 0 AND delay_hours <= 2160), -- Max 90 jours
  CONSTRAINT payment_release_rules_applies_to_check CHECK (
    applies_to IN ('all', 'new_providers', 'vip', 'amount_threshold', 'country', 'custom')
  )
);

CREATE INDEX IF NOT EXISTS idx_payment_rules_active ON public.payment_release_rules USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_payment_rules_priority ON public.payment_release_rules USING btree (priority DESC);
CREATE INDEX IF NOT EXISTS idx_payment_rules_applies_to ON public.payment_release_rules USING btree (applies_to);

-- Table pour programmer les déblocages de fonds
CREATE TABLE IF NOT EXISTS public.scheduled_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  earning_id UUID NULL, -- Lien vers provider_earnings
  provider_id UUID NOT NULL,
  amount_cents BIGINT NOT NULL,
  rule_id UUID NULL, -- Quelle règle a été appliquée
  rule_name TEXT NOT NULL,
  delay_hours INTEGER NOT NULL,
  release_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Quand libérer les fonds
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'on_hold', 'cancelled'
  hold_reason TEXT NULL, -- Si on_hold, pourquoi?
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT scheduled_releases_pkey PRIMARY KEY (id),
  CONSTRAINT scheduled_releases_provider_fkey FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT scheduled_releases_rule_fkey FOREIGN KEY (rule_id) REFERENCES payment_release_rules(id) ON DELETE SET NULL,
  CONSTRAINT scheduled_releases_earning_fkey FOREIGN KEY (earning_id) REFERENCES provider_earnings(id) ON DELETE SET NULL,
  CONSTRAINT scheduled_releases_amount_check CHECK (amount_cents > 0),
  CONSTRAINT scheduled_releases_status_check CHECK (
    status IN ('pending', 'completed', 'on_hold', 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_scheduled_releases_provider ON public.scheduled_releases USING btree (provider_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_releases_status ON public.scheduled_releases USING btree (status);
CREATE INDEX IF NOT EXISTS idx_scheduled_releases_release_at ON public.scheduled_releases USING btree (release_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_releases_pending ON public.scheduled_releases USING btree (status, release_at)
  WHERE status = 'pending';

-- Trigger pour updated_at
CREATE TRIGGER trg_payment_release_rules_updated_at
  BEFORE UPDATE ON payment_release_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_scheduled_releases_updated_at
  BEFORE UPDATE ON scheduled_releases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vue pour voir les règles appliquées et leur efficacité
CREATE OR REPLACE VIEW payment_rules_analytics AS
SELECT
  prr.id,
  prr.name,
  prr.delay_hours,
  prr.applies_to,
  prr.is_active,
  prr.priority,
  COUNT(sr.id) as times_applied,
  SUM(sr.amount_cents) as total_amount_cents,
  SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
  SUM(CASE WHEN sr.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN sr.status = 'on_hold' THEN 1 ELSE 0 END) as on_hold_count
FROM payment_release_rules prr
LEFT JOIN scheduled_releases sr ON prr.id = sr.rule_id
GROUP BY prr.id, prr.name, prr.delay_hours, prr.applies_to, prr.is_active, prr.priority
ORDER BY prr.priority DESC;

-- Vue pour les paiements à libérer bientôt
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

-- Fonction pour obtenir le délai applicable à un paiement
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
  -- Récupérer les infos du provider
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

-- Insérer quelques règles par défaut
INSERT INTO payment_release_rules (name, delay_hours, applies_to, condition, is_active, priority, created_by)
VALUES
  ('Standard', 336, 'all', NULL, TRUE, 0, NULL),
  ('Nouveaux Providers', 720, 'new_providers', '{"provider_age_days": 30}'::jsonb, TRUE, 10, NULL),
  ('VIP Premium', 0, 'vip', '{"provider_rating": 4.8}'::jsonb, TRUE, 20, NULL),
  ('Montants Élevés', 168, 'amount_threshold', '{"min_amount": 500000}'::jsonb, TRUE, 15, NULL),
  ('Petits Montants', 24, 'amount_threshold', '{"max_amount": 10000}'::jsonb, TRUE, 5, NULL)
ON CONFLICT DO NOTHING;
 
-- Commentaires
COMMENT ON TABLE payment_release_rules IS 'Règles configurables pour le déblocage automatique des paiements';
COMMENT ON TABLE scheduled_releases IS 'Programmation des déblocages de fonds pending → available';
COMMENT ON VIEW payment_rules_analytics IS 'Statistiques d''utilisation des règles de paiement';
COMMENT ON VIEW upcoming_releases IS 'Paiements programmés pour déblocage dans les prochaines 24h';
COMMENT ON FUNCTION get_applicable_release_delay IS 'Retourne la règle de délai applicable pour un paiement donné';
