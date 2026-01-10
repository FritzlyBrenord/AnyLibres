-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update order status on delivery
CREATE OR REPLACE FUNCTION update_order_status_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders
  SET status = 'delivered', updated_at = NOW()
  WHERE id = NEW.order_id AND status = 'in_progress';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_status_on_delivery ON public.order_deliveries;
CREATE TRIGGER trigger_update_order_status_on_delivery
  AFTER INSERT ON public.order_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_order_status_on_delivery();

-- Trigger: Update order status on revision
CREATE OR REPLACE FUNCTION update_order_status_on_revision()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders
  SET status = 'revision_requested', updated_at = NOW()
  WHERE id = NEW.order_id AND status = 'delivered';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_status_on_revision ON public.order_revisions;
CREATE TRIGGER trigger_update_order_status_on_revision
  AFTER INSERT ON public.order_revisions
  FOR EACH ROW EXECUTE FUNCTION update_order_status_on_revision();