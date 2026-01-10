-- =====================================================
-- STORAGE POLICIES: Sécurité pour les buckets de messages
-- Description: Seuls les participants peuvent upload/voir les fichiers
-- =====================================================

-- =====================================================
-- FONCTION HELPER: Vérifier si l'utilisateur est participant du message
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_message_file_accessible(
  file_path TEXT,
  user_profile_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  message_id_from_path UUID;
  is_participant BOOLEAN;
BEGIN
  -- Extraire le message_id du chemin (format: conversation_id/message_id/filename)
  -- Ex: "abc-123/def-456/image.jpg" -> message_id = "def-456"
  message_id_from_path := split_part(file_path, '/', 2)::UUID;

  -- Vérifier si l'utilisateur est participant du message
  SELECT EXISTS (
    SELECT 1
    FROM public.messages
    WHERE id = message_id_from_path
      AND user_profile_id IN (sender_id, receiver_id)
  ) INTO is_participant;

  RETURN is_participant;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- POLITIQUES POUR: message-images
-- =====================================================

-- SELECT: Voir les images des conversations accessibles
DROP POLICY IF EXISTS "Users can view message images" ON storage.objects;
CREATE POLICY "Users can view message images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-images'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

-- INSERT: Upload des images
DROP POLICY IF EXISTS "Users can upload message images" ON storage.objects;
CREATE POLICY "Users can upload message images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-images'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
    )
  );

-- UPDATE: Mettre à jour les métadonnées (pour optimisation)
DROP POLICY IF EXISTS "Users can update message images" ON storage.objects;
CREATE POLICY "Users can update message images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'message-images'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

-- DELETE: Supprimer ses images
DROP POLICY IF EXISTS "Users can delete message images" ON storage.objects;
CREATE POLICY "Users can delete message images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-images'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

-- =====================================================
-- POLITIQUES POUR: message-videos
-- =====================================================

DROP POLICY IF EXISTS "Users can view message videos" ON storage.objects;
CREATE POLICY "Users can view message videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-videos'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

DROP POLICY IF EXISTS "Users can upload message videos" ON storage.objects;
CREATE POLICY "Users can upload message videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-videos'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update message videos" ON storage.objects;
CREATE POLICY "Users can update message videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'message-videos'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

DROP POLICY IF EXISTS "Users can delete message videos" ON storage.objects;
CREATE POLICY "Users can delete message videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-videos'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

-- =====================================================
-- POLITIQUES POUR: message-audio
-- =====================================================

DROP POLICY IF EXISTS "Users can view message audio" ON storage.objects;
CREATE POLICY "Users can view message audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-audio'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

DROP POLICY IF EXISTS "Users can upload message audio" ON storage.objects;
CREATE POLICY "Users can upload message audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-audio'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update message audio" ON storage.objects;
CREATE POLICY "Users can update message audio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'message-audio'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

DROP POLICY IF EXISTS "Users can delete message audio" ON storage.objects;
CREATE POLICY "Users can delete message audio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-audio'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

-- =====================================================
-- POLITIQUES POUR: message-documents
-- =====================================================

DROP POLICY IF EXISTS "Users can view message documents" ON storage.objects;
CREATE POLICY "Users can view message documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-documents'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

DROP POLICY IF EXISTS "Users can upload message documents" ON storage.objects;
CREATE POLICY "Users can upload message documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-documents'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update message documents" ON storage.objects;
CREATE POLICY "Users can update message documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'message-documents'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

DROP POLICY IF EXISTS "Users can delete message documents" ON storage.objects;
CREATE POLICY "Users can delete message documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-documents'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND is_message_file_accessible(name, profiles.id)
    )
  );

-- Commentaires
COMMENT ON FUNCTION public.is_message_file_accessible IS 'Vérifie si un utilisateur peut accéder à un fichier de message';