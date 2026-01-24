-- ============================================================================
-- AMÉLIORATIONS SUPPLÉMENTAIRES POUR LE SYSTÈME DE REMBOURSEMENT
-- À appliquer APRÈS FIX_REFUNDS_RLS.sql
-- ============================================================================

-- ============================================================================
-- 1. AJOUTER RLS À AUTRES TABLES DE PAIEMENT/BALANCE
-- ============================================================================

-- Table: client_balance (si elle existe)
ALTER TABLE public.client_balance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view their balance" ON public.client_balance;
CREATE POLICY "Clients can view their balance"
  ON public.client_balance
  FOR SELECT
  USING (client_id = auth.uid());

-- Table: provider_balance (si elle existe)  
ALTER TABLE public.provider_balance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view their balance" ON public.provider_balance;
CREATE POLICY "Providers can view their balance"
  ON public.provider_balance
  FOR SELECT
  USING (provider_id = auth.uid());

-- Table: admin_balance (si elle existe)
-- Note: Admin balance devrait être moins restrictif
ALTER TABLE public.admin_balance ENABLE ROW LEVEL SECURITY;

-- Admin can view admin balance
DROP POLICY IF EXISTS "Admins can view admin balance" ON public.admin_balance;
CREATE POLICY "Admins can view admin balance"
  ON public.admin_balance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN (SELECT email FROM public.admin_users)
    )
  );

-- ============================================================================
-- 2. AJOUTER INDEX COMPOSÉ POUR REQUÊTES COURANTES
-- ============================================================================

-- Index pour requêtes "refunds du client avec status"
CREATE INDEX IF NOT EXISTS idx_refunds_client_status 
  ON public.refunds(client_id, status)
  WHERE status != 'cancelled';

-- Index pour requêtes "refunds du provider avec status"
CREATE INDEX IF NOT EXISTS idx_refunds_provider_status
  ON public.refunds(provider_id, status)
  WHERE status IN ('approved', 'processing', 'completed', 'failed');

-- Index pour requêtes "refunds avec date"
CREATE INDEX IF NOT EXISTS idx_refunds_order_created
  ON public.refunds(order_id, created_at DESC);

-- ============================================================================
-- 3. AJOUTER VUE POUR ADMIN (accès sans RLS)
-- ============================================================================

-- Vue: Résumé des remboursements avec info client/provider
CREATE OR REPLACE VIEW public.refunds_summary AS
SELECT
  r.id,
  r.order_id,
  r.client_id,
  r.provider_id,
  cp.display_name as client_name,
  pp.display_name as provider_name,
  r.amount_cents,
  r.currency,
  r.status,
  r.reason,
  r.reason_details,
  r.admin_notes,
  r.refund_method,
  r.refund_reference,
  r.refunded_at,
  r.created_at,
  r.updated_at,
  o.total_cents as order_total_cents,
  o.status as order_status,
  o.payment_status
FROM public.refunds r
LEFT JOIN public.profiles cp ON r.client_id = cp.user_id
LEFT JOIN public.profiles pp ON r.provider_id = pp.user_id
LEFT JOIN public.orders o ON r.order_id = o.id;

-- Note: Views don't inherit RLS, so admin can query directly

-- ============================================================================
-- 4. FONCTION POUR STATISTICS D'ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_refund_stats(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '30 days'),
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_refunds BIGINT,
  total_amount_cents BIGINT,
  currency TEXT,
  by_status JSONB,
  by_reason JSONB,
  daily_average_cents NUMERIC
) AS $$
DECLARE
  v_days INTEGER;
BEGIN
  v_days := EXTRACT(DAY FROM (p_end_date - p_start_date));
  
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(SUM(amount_cents), 0)::BIGINT,
    'EUR'::TEXT, -- Default currency, could be dynamic
    (SELECT JSONB_OBJECT_AGG(status, count)
     FROM (
       SELECT status, COUNT(*) as count
       FROM public.refunds
       WHERE created_at BETWEEN p_start_date AND p_end_date
       GROUP BY status
     ) s)::JSONB,
    (SELECT JSONB_OBJECT_AGG(reason, count)
     FROM (
       SELECT reason, COUNT(*) as count
       FROM public.refunds
       WHERE created_at BETWEEN p_start_date AND p_end_date
       GROUP BY reason
     ) r)::JSONB,
    COALESCE(SUM(amount_cents)::NUMERIC / NULLIF(v_days, 0), 0)
  FROM public.refunds
  WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. FONCTION POUR VÉRIFIER SI UN REFUND EST POSSIBLE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_request_refund(
  p_order_id UUID,
  p_client_id UUID
)
RETURNS TABLE (
  can_refund BOOLEAN,
  reason TEXT,
  max_amount_cents BIGINT
) AS $$
DECLARE
  v_order_status TEXT;
  v_payment_status TEXT;
  v_order_total BIGINT;
  v_existing_refunds BIGINT;
BEGIN
  -- Fetch order details
  SELECT status, payment_status, total_cents
  INTO v_order_status, v_payment_status, v_order_total
  FROM public.orders
  WHERE id = p_order_id AND client_id = p_client_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Order not found', 0::BIGINT;
    RETURN;
  END IF;
  
  IF v_payment_status != 'succeeded' THEN
    RETURN QUERY SELECT false, 'Order has not been paid', 0::BIGINT;
    RETURN;
  END IF;
  
  -- Check total amount already refunded
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_existing_refunds
  FROM public.refunds
  WHERE order_id = p_order_id
  AND status NOT IN ('rejected', 'cancelled');
  
  IF v_existing_refunds >= v_order_total THEN
    RETURN QUERY SELECT false, 'Full refund already requested', 0::BIGINT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Refund is possible', v_order_total - v_existing_refunds;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TABLE D'AUDIT POUR TRACER LES CHANGEMENTS DE STATUT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.refund_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  change_reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT refund_status_history_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_refund_status_history_refund_id
  ON public.refund_status_history(refund_id, changed_at DESC);

-- Trigger pour tracer les changements
CREATE OR REPLACE FUNCTION public.track_refund_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.refund_status_history (
      refund_id, old_status, new_status, changed_at
    ) VALUES (
      NEW.id, OLD.status, NEW.status, NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_track_refund_status ON public.refunds;
CREATE TRIGGER trg_track_refund_status
  AFTER UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION track_refund_status_change();

-- ============================================================================
-- 7. NOTIFICATION SYSTEM HOOK
-- ============================================================================

-- Ajouter colonne pour notifier les changements
ALTER TABLE public.refunds
ADD COLUMN IF NOT EXISTS notify_client BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_provider BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Function pour déclencher notifications (à intégrer avec system de notification)
CREATE OR REPLACE FUNCTION public.on_refund_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    -- Notify client
    IF NEW.notify_client THEN
      INSERT INTO public.notifications (
        user_id, type, title, content, related_id, action_url
      ) VALUES (
        NEW.client_id,
        'refund_status_changed'::notification_type,
        'Refund Status Updated',
        'Your refund request status has changed to: ' || NEW.status,
        NEW.id,
        '/orders/' || NEW.order_id
      );
    END IF;
    
    -- Notify provider
    IF NEW.notify_provider AND NEW.status IN ('approved', 'processing') THEN
      INSERT INTO public.notifications (
        user_id, type, title, content, related_id, action_url
      ) VALUES (
        NEW.provider_id,
        'refund_approved'::notification_type,
        'Refund Approved',
        'A refund of ' || NEW.amount_cents::TEXT || ' ' || NEW.currency || 
        ' has been approved for order ' || NEW.order_id::TEXT,
        NEW.id,
        '/provider/orders/' || NEW.order_id
      );
    END IF;
    
    NEW.last_notification_sent_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Uncomment to enable notifications:
-- DROP TRIGGER IF EXISTS trg_refund_notifications ON public.refunds;
-- CREATE TRIGGER trg_refund_notifications
--   AFTER UPDATE ON public.refunds
--   FOR EACH ROW
--   EXECUTE FUNCTION on_refund_status_change();

-- ============================================================================
-- 8. NETTOYAGE & MAINTENANCE
-- ============================================================================

-- Fonction pour canceller les refunds abandonnés (plus de 30 jours en pending)
CREATE OR REPLACE FUNCTION public.cancel_abandoned_refunds()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.refunds
  SET status = 'cancelled'
  WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION DES AMÉLIORATIONS
-- ============================================================================

-- Vérifier que tout a bien été appliqué:
-- SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'refunds';
-- SELECT routename FROM pg_proc WHERE proname IN ('get_refund_stats', 'can_request_refund', 'track_refund_status_change');
-- SELECT tablename FROM pg_tables WHERE tablename = 'refund_status_history' AND schemaname = 'public';

-- ============================================================================
-- FIN DES AMÉLIORATIONS
-- ============================================================================
