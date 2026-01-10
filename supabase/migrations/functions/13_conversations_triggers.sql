-- =====================================================
-- TRIGGERS: conversations
-- Description: Gestion automatique des timestamps et notifications
-- =====================================================

-- =====================================================
-- FONCTION: Mettre à jour updated_at automatiquement
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON public.conversations;

CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_updated_at();

-- =====================================================
-- FONCTION: Notifier les changements en temps réel
-- Pour que les clients puissent écouter les changements via Supabase Realtime
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_conversation_change()
RETURNS TRIGGER AS $$
DECLARE
  participant_id UUID;
BEGIN
  -- Notifier chaque participant de la conversation
  FOREACH participant_id IN ARRAY NEW.participants
  LOOP
    PERFORM pg_notify(
      'conversation_changes',
      json_build_object(
        'operation', TG_OP,
        'conversation_id', NEW.id,
        'participant_id', participant_id,
        'updated_at', NEW.updated_at
      )::text
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour notifications (INSERT, UPDATE)
DROP TRIGGER IF EXISTS trigger_notify_conversation_change ON public.conversations;

CREATE TRIGGER trigger_notify_conversation_change
  AFTER INSERT OR UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_conversation_change();

-- =====================================================
-- FONCTION: Mettre à jour typing_status avec expiration
-- Nettoyer automatiquement les statuts de frappe > 5 secondes
-- =====================================================
CREATE OR REPLACE FUNCTION public.clean_expired_typing_status()
RETURNS void AS $$
DECLARE
  conv RECORD;
  new_typing_status JSONB;
  typing_key TEXT;
  typing_timestamp TIMESTAMPTZ;
BEGIN
  -- Pour chaque conversation avec un typing_status non vide
  FOR conv IN
    SELECT id, typing_status
    FROM public.conversations
    WHERE typing_status IS NOT NULL
      AND typing_status != '{}'::jsonb
  LOOP
    new_typing_status := '{}'::jsonb;

    -- Vérifier chaque entrée dans typing_status
    FOR typing_key, typing_timestamp IN
      SELECT key, value::text::timestamptz
      FROM jsonb_each_text(conv.typing_status)
    LOOP
      -- Garder seulement si < 5 secondes
      IF typing_timestamp > (NOW() - INTERVAL '5 seconds') THEN
        new_typing_status := new_typing_status || jsonb_build_object(typing_key, typing_timestamp);
      END IF;
    END LOOP;

    -- Mettre à jour si nécessaire
    IF new_typing_status != conv.typing_status THEN
      UPDATE public.conversations
      SET typing_status = new_typing_status
      WHERE id = conv.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON FUNCTION public.update_conversation_updated_at IS 'Met à jour automatiquement le champ updated_at';
COMMENT ON FUNCTION public.notify_conversation_change IS 'Notifie les participants via pg_notify pour le temps réel';
COMMENT ON FUNCTION public.clean_expired_typing_status IS 'Nettoie les statuts de frappe expirés (> 5 secondes)';