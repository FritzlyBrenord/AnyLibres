-- =====================================================
-- RLS POLICIES: message_reactions
-- Description: Sécurité pour les réactions aux messages
-- Règle: Seuls les participants de la conversation peuvent réagir
-- =====================================================

-- DROP existing policies
DROP POLICY IF EXISTS "Users can view reactions on their messages" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.message_reactions;

-- =====================================================
-- POLITIQUE: SELECT - Voir les réactions des messages accessibles
-- =====================================================
CREATE POLICY "Users can view reactions on their messages"
  ON public.message_reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.messages
      INNER JOIN public.profiles ON profiles.user_id = auth.uid()
      WHERE messages.id = message_reactions.message_id
        AND is_message_participant(messages.sender_id, messages.receiver_id, profiles.id)
    )
  );

-- =====================================================
-- POLITIQUE: INSERT - Ajouter des réactions
-- L'utilisateur doit être participant de la conversation du message
-- =====================================================
CREATE POLICY "Users can add reactions"
  ON public.message_reactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.messages
      INNER JOIN public.profiles ON profiles.user_id = auth.uid()
      WHERE messages.id = message_id
        AND is_message_participant(messages.sender_id, messages.receiver_id, profiles.id)
        AND profiles.id = profile_id
    )
  );

-- =====================================================
-- POLITIQUE: DELETE - Supprimer ses propres réactions
-- =====================================================
CREATE POLICY "Users can delete their own reactions"
  ON public.message_reactions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.id = profile_id
    )
  );