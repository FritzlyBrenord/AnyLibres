-- =====================================================
-- RLS POLICIES: conversations
-- Description: Sécurité pour les conversations
-- Règle: Seuls les participants peuvent voir/modifier la conversation
-- =====================================================

-- DROP existing policies (si elles existent)
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

-- =====================================================
-- FONCTION HELPER: Vérifier si l'utilisateur est participant
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_conversation_participant(
  conversation_participants UUID[],
  user_profile_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_profile_id = ANY(conversation_participants);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- POLITIQUE: SELECT - Voir ses propres conversations
-- =====================================================
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_conversation_participant(conversations.participants, profiles.id)
    )
  );

-- =====================================================
-- POLITIQUE: INSERT - Créer une conversation
-- L'utilisateur doit être l'un des participants
-- =====================================================
CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_conversation_participant(participants, profiles.id)
    )
  );

-- =====================================================
-- POLITIQUE: UPDATE - Modifier ses conversations
-- L'utilisateur doit être participant pour mettre à jour
-- (ex: marquer comme archivé, mettre à jour typing_status)
-- =====================================================
CREATE POLICY "Users can update their own conversations"
  ON public.conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_conversation_participant(participants, profiles.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_conversation_participant(participants, profiles.id)
    )
  );

-- =====================================================
-- POLITIQUE: DELETE - Supprimer (archiver) la conversation
-- Seuls les participants peuvent supprimer
-- =====================================================
CREATE POLICY "Users can delete their own conversations"
  ON public.conversations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_conversation_participant(participants, profiles.id)
    )
  );

-- Commentaires
COMMENT ON FUNCTION public.is_conversation_participant IS 'Vérifie si un profile_id est participant d''une conversation';