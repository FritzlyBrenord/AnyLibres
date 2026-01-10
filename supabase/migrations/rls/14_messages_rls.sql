-- =====================================================
-- RLS POLICIES: messages
-- Description: Sécurité pour les messages
-- Règle: Seuls le sender et receiver peuvent voir/modifier les messages
-- =====================================================

-- DROP existing policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- =====================================================
-- FONCTION HELPER: Vérifier si l'utilisateur est dans la conversation
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_message_participant(
  msg_sender_id UUID,
  msg_receiver_id UUID,
  user_profile_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_profile_id IN (msg_sender_id, msg_receiver_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- POLITIQUE: SELECT - Voir les messages de ses conversations
-- =====================================================
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_participant(messages.sender_id, messages.receiver_id, profiles.id)
    )
  );

-- =====================================================
-- POLITIQUE: INSERT - Envoyer des messages
-- L'utilisateur doit être le sender
-- =====================================================
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.id = sender_id
    )
  );

-- =====================================================
-- POLITIQUE: UPDATE - Modifier ses messages
-- L'utilisateur peut modifier si:
-- - Il est le sender (pour éditer le message, le supprimer)
-- - Il est le receiver (pour marquer comme lu)
-- =====================================================
CREATE POLICY "Users can update their own messages"
  ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_participant(sender_id, receiver_id, profiles.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_participant(sender_id, receiver_id, profiles.id)
    )
  );

-- =====================================================
-- POLITIQUE: DELETE - Supprimer ses messages (hard delete)
-- Seul le sender peut supprimer définitivement
-- Note: Il est recommandé d'utiliser soft delete (is_deleted) plutôt
-- =====================================================
CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.id = sender_id
    )
  );

-- Commentaires
COMMENT ON FUNCTION public.is_message_participant IS 'Vérifie si un profile_id est participant (sender ou receiver) d''un message';