-- =====================================================
-- TRIGGERS: messages
-- Description: Gestion automatique des conversations et notifications
-- =====================================================

-- =====================================================
-- FONCTION: Mettre à jour la conversation lors d'un nouveau message
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_conversation_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile_id UUID;
  receiver_profile_id UUID;
BEGIN
  -- Récupérer les profile_ids
  sender_profile_id := NEW.sender_id;
  receiver_profile_id := NEW.receiver_id;

  -- Mettre à jour la conversation
  UPDATE public.conversations
  SET
    last_message_text = LEFT(NEW.text, 100), -- Premiers 100 caractères
    last_message_at = NEW.created_at,
    last_message_sender_id = sender_profile_id,
    updated_at = NOW(),
    -- Incrémenter le compteur de non lus pour le receiver
    unread_count = jsonb_set(
      COALESCE(unread_count, '{}'::jsonb),
      ARRAY[receiver_profile_id::text],
      to_jsonb(COALESCE((unread_count->>receiver_profile_id::text)::int, 0) + 1)
    )
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour nouveau message
DROP TRIGGER IF EXISTS trigger_update_conversation_on_new_message ON public.messages;

CREATE TRIGGER trigger_update_conversation_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_new_message();

-- =====================================================
-- FONCTION: Décrémenter unread_count quand un message est lu
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_conversation_on_message_read()
RETURNS TRIGGER AS $$
DECLARE
  reader_profile_id UUID;
BEGIN
  -- Vérifier si le message vient d'être marqué comme lu
  IF OLD.is_read = false AND NEW.is_read = true THEN
    reader_profile_id := NEW.receiver_id;

    -- Décrémenter le compteur
    UPDATE public.conversations
    SET
      unread_count = jsonb_set(
        COALESCE(unread_count, '{}'::jsonb),
        ARRAY[reader_profile_id::text],
        to_jsonb(GREATEST(COALESCE((unread_count->>reader_profile_id::text)::int, 0) - 1, 0))
      ),
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour message lu
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message_read ON public.messages;

CREATE TRIGGER trigger_update_conversation_on_message_read
  AFTER UPDATE ON public.messages
  FOR EACH ROW
  WHEN (OLD.is_read IS DISTINCT FROM NEW.is_read)
  EXECUTE FUNCTION public.update_conversation_on_message_read();

-- =====================================================
-- FONCTION: Notifier les changements de messages en temps réel
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_message_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifier via pg_notify pour le temps réel
  PERFORM pg_notify(
    'message_changes',
    json_build_object(
      'operation', TG_OP,
      'message_id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'receiver_id', NEW.receiver_id,
      'created_at', NEW.created_at,
      'is_read', NEW.is_read
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour notifications
DROP TRIGGER IF EXISTS trigger_notify_message_change ON public.messages;

CREATE TRIGGER trigger_notify_message_change
  AFTER INSERT OR UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_change();

-- =====================================================
-- FONCTION: Mettre à jour read_at automatiquement
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_message_read_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Si is_read passe de false à true, définir read_at
  IF OLD.is_read = false AND NEW.is_read = true AND NEW.read_at IS NULL THEN
    NEW.read_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour read_at
DROP TRIGGER IF EXISTS trigger_set_message_read_at ON public.messages;

CREATE TRIGGER trigger_set_message_read_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  WHEN (OLD.is_read IS DISTINCT FROM NEW.is_read)
  EXECUTE FUNCTION public.set_message_read_at();

-- =====================================================
-- FONCTION: Empêcher la suppression définitive des messages importants
-- =====================================================
CREATE OR REPLACE FUNCTION public.prevent_important_message_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher la suppression de messages de type système ou commande
  IF OLD.message_type IN ('order_request', 'order_accepted', 'order_rejected', 'delivery') THEN
    RAISE EXCEPTION 'Cannot delete system or order-related messages. Use soft delete (is_deleted) instead.';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour empêcher suppressions
DROP TRIGGER IF EXISTS trigger_prevent_important_message_deletion ON public.messages;

CREATE TRIGGER trigger_prevent_important_message_deletion
  BEFORE DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_important_message_deletion();

-- Commentaires
COMMENT ON FUNCTION public.update_conversation_on_new_message IS 'Met à jour la conversation avec le dernier message';
COMMENT ON FUNCTION public.update_conversation_on_message_read IS 'Décrémente le compteur de non lus';
COMMENT ON FUNCTION public.notify_message_change IS 'Notifie les changements via pg_notify';
COMMENT ON FUNCTION public.set_message_read_at IS 'Définit automatiquement read_at quand is_read devient true';
COMMENT ON FUNCTION public.prevent_important_message_deletion IS 'Empêche la suppression de messages système';