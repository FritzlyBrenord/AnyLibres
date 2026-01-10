-- ============================================================================
-- Tables pour la gestion admin des soldes et sécurité
-- ============================================================================

-- Table pour logger toutes les actions admin
CREATE TABLE IF NOT EXISTS public.admin_actions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'release_funds', 'freeze_account', 'approve_withdrawal', etc.
  target_type TEXT NOT NULL, -- 'provider_balance', 'provider', 'withdrawal', etc.
  target_id UUID NOT NULL,
  metadata JSONB NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  CONSTRAINT admin_actions_log_pkey PRIMARY KEY (id),
  CONSTRAINT admin_actions_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_log_admin ON public.admin_actions_log USING btree (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_type ON public.admin_actions_log USING btree (action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_target ON public.admin_actions_log USING btree (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_date ON public.admin_actions_log USING btree (performed_at DESC);

-- Table pour les comptes providers gelés
CREATE TABLE IF NOT EXISTS public.provider_frozen_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  is_frozen BOOLEAN NOT NULL DEFAULT TRUE,
  frozen_reason TEXT NULL,
  frozen_by UUID NOT NULL, -- Admin qui a gelé
  frozen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  unfrozen_at TIMESTAMP WITH TIME ZONE NULL,
  unfrozen_by UUID NULL,
  unfrozen_reason TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT provider_frozen_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT provider_frozen_accounts_provider_unique UNIQUE (provider_id),
  CONSTRAINT provider_frozen_accounts_provider_fkey FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT provider_frozen_accounts_frozen_by_fkey FOREIGN KEY (frozen_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT provider_frozen_accounts_unfrozen_by_fkey FOREIGN KEY (unfrozen_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_provider_frozen_provider ON public.provider_frozen_accounts USING btree (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_frozen_status ON public.provider_frozen_accounts USING btree (is_frozen);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_provider_frozen_accounts_updated_at
  BEFORE UPDATE ON provider_frozen_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_admin_actions_log_updated_at
  BEFORE UPDATE ON admin_actions_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table pour les règles de sécurité configurables
CREATE TABLE IF NOT EXISTS public.security_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL, -- 'min_withdrawal', 'max_withdrawal', 'kyc_required', 'auto_freeze_threshold', etc.
  rule_value JSONB NOT NULL, -- Valeur de la règle (peut être un nombre, objet, etc.)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  applies_to TEXT NULL, -- 'all', 'country:FR', 'tier:premium', etc.
  priority INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT security_rules_pkey PRIMARY KEY (id),
  CONSTRAINT security_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_security_rules_type ON public.security_rules USING btree (rule_type);
CREATE INDEX IF NOT EXISTS idx_security_rules_active ON public.security_rules USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_security_rules_priority ON public.security_rules USING btree (priority DESC);

CREATE TRIGGER trg_security_rules_updated_at
  BEFORE UPDATE ON security_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table pour les alertes de fraude
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'suspicious_withdrawal', 'rapid_balance_change', 'multiple_ips', etc.
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'false_positive'
  details JSONB NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  resolved_by UUID NULL,
  resolution_notes TEXT NULL,
  CONSTRAINT fraud_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT fraud_alerts_provider_fkey FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fraud_alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fraud_alerts_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT fraud_alerts_status_check CHECK (status IN ('pending', 'investigating', 'resolved', 'false_positive'))
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_provider ON public.fraud_alerts USING btree (provider_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON public.fraud_alerts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity ON public.fraud_alerts USING btree (severity);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_triggered ON public.fraud_alerts USING btree (triggered_at DESC);

-- Ajouter colonne is_frozen à provider_balance si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'provider_balance'
    AND column_name = 'is_frozen'
  ) THEN
    ALTER TABLE public.provider_balance ADD COLUMN is_frozen BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Fonction pour vérifier si un compte est gelé
CREATE OR REPLACE FUNCTION is_provider_frozen(p_provider_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_frozen BOOLEAN;
BEGIN
  SELECT is_frozen INTO v_is_frozen
  FROM provider_frozen_accounts
  WHERE provider_id = p_provider_id
  AND is_frozen = TRUE;

  RETURN COALESCE(v_is_frozen, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Vue pour avoir une vue complète des soldes avec statut frozen
CREATE OR REPLACE VIEW provider_balances_with_security AS
SELECT
  pb.*,
  pfa.is_frozen,
  pfa.frozen_reason,
  pfa.frozen_at,
  pfa.frozen_by,
  CASE
    WHEN pfa.is_frozen = TRUE THEN 'frozen'
    WHEN pb.pending_cents > 0 THEN 'pending'
    WHEN pb.available_cents > 0 THEN 'available'
    ELSE 'empty'
  END as account_status
FROM provider_balance pb
LEFT JOIN provider_frozen_accounts pfa ON pb.provider_id = pfa.provider_id;

-- Commentaires
COMMENT ON TABLE admin_actions_log IS 'Log de toutes les actions administratives pour audit';
COMMENT ON TABLE provider_frozen_accounts IS 'Gestion des comptes providers gelés par admin';
COMMENT ON TABLE security_rules IS 'Règles de sécurité configurables par admin';
COMMENT ON TABLE fraud_alerts IS 'Alertes de détection de fraude automatique';
COMMENT ON VIEW provider_balances_with_security IS 'Vue complète des soldes avec informations de sécurité';
