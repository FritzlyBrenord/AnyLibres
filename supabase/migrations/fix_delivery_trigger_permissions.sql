-- ============================================================================
-- Fix: Permission denied for table users in delivery trigger
-- Problème: Le trigger update_order_status_on_delivery() n'a pas les permissions
-- Solution: Ajouter SECURITY DEFINER à la fonction trigger
-- ============================================================================

-- 1. Supprimer le trigger existant
DROP TRIGGER IF EXISTS trigger_update_order_status_on_delivery ON public.order_deliveries;

-- 2. Recréer la fonction avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_order_status_on_delivery()
RETURNS TRIGGER
SECURITY DEFINER -- Cette ligne est CRITIQUE : exécute avec les privilèges du créateur
SET search_path = public, pg_temp -- Sécurité : définir explicitement le search_path
AS $$
BEGIN
  -- Mettre à jour le statut de la commande vers 'delivered'
  UPDATE public.orders
  SET
    status = 'delivered',
    updated_at = NOW()
  WHERE id = NEW.order_id
    AND status IN ('in_progress', 'delivery_delayed', 'revision_requested');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recréer le trigger
CREATE TRIGGER trigger_update_order_status_on_delivery
  AFTER INSERT ON public.order_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_delivery();

-- 4. Faire de même pour le trigger de révision
DROP TRIGGER IF EXISTS trigger_update_order_status_on_revision ON public.order_revisions;

CREATE OR REPLACE FUNCTION update_order_status_on_revision()
RETURNS TRIGGER
SECURITY DEFINER -- Exécute avec les privilèges du créateur
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Mettre à jour le statut de la commande vers 'revision_requested'
  UPDATE public.orders
  SET
    status = 'revision_requested',
    updated_at = NOW()
  WHERE id = NEW.order_id
    AND status = 'delivered';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_status_on_revision
  AFTER INSERT ON public.order_revisions
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_revision();

-- 5. Commentaires
COMMENT ON FUNCTION update_order_status_on_delivery() IS 'Met à jour le statut de la commande lors d''une livraison (SECURITY DEFINER pour éviter les erreurs de permissions)';
COMMENT ON FUNCTION update_order_status_on_revision() IS 'Met à jour le statut de la commande lors d''une demande de révision (SECURITY DEFINER pour éviter les erreurs de permissions)';




