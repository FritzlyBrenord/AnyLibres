-- =====================================================
-- RLS POLICIES: message_attachments
-- Description: Sécurité pour les pièces jointes des messages
-- Règle: Seuls les participants peuvent voir les pièces jointes
-- =====================================================

-- DROP existing policies
DROP POLICY IF EXISTS "Users can view attachments of their messages" ON public.message_attachments;
DROP POLICY IF EXISTS "Users can add attachments to their messages" ON public.message_attachments;
DROP POLICY IF EXISTS "Users can update attachment metadata" ON public.message_attachments;
DROP POLICY IF EXISTS "Users can delete attachments of their messages" ON public.message_attachments;

-- =====================================================
-- POLITIQUE: SELECT - Voir les pièces jointes des messages accessibles
-- =====================================================
CREATE POLICY "Users can view attachments of their messages"
  ON public.message_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.messages
      INNER JOIN public.profiles ON profiles.user_id = auth.uid()
      WHERE messages.id = message_attachments.message_id
        AND is_message_participant(messages.sender_id, messages.receiver_id, profiles.id)
    )
  );

-- =====================================================
-- POLITIQUE: INSERT - Ajouter des pièces jointes
-- Seul le sender du message peut ajouter des pièces jointes
-- =====================================================
CREATE POLICY "Users can add attachments to their messages"
  ON public.message_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.messages
      INNER JOIN public.profiles ON profiles.user_id = auth.uid()
      WHERE messages.id = message_id
        AND profiles.id = messages.sender_id
    )
  );

-- =====================================================
-- POLITIQUE: UPDATE - Mettre à jour les métadonnées
-- Permet au système d'optimisation de mettre à jour les URLs optimisées
-- L'utilisateur (sender) peut aussi mettre à jour
-- =====================================================
CREATE POLICY "Users can update attachment metadata"
  ON public.message_attachments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.messages
      INNER JOIN public.profiles ON profiles.user_id = auth.uid()
      WHERE messages.id = message_id
        AND profiles.id = messages.sender_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.messages
      INNER JOIN public.profiles ON profiles.user_id = auth.uid()
      WHERE messages.id = message_id
        AND profiles.id = messages.sender_id
    )
  );

-- =====================================================
-- POLITIQUE: DELETE - Supprimer les pièces jointes
-- Seul le sender du message peut supprimer les pièces jointes
-- =====================================================
CREATE POLICY "Users can delete attachments of their messages"
  ON public.message_attachments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.messages
      INNER JOIN public.profiles ON profiles.user_id = auth.uid()
      WHERE messages.id = message_id
        AND profiles.id = messages.sender_id
    )
  );