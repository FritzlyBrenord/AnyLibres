-- =====================================================
-- MIGRATION: Suppression et archivage spécifiques par utilisateur
-- Description: Permet à chaque utilisateur de supprimer/archiver des messages
--              et conversations sans affecter l'autre utilisateur
-- =====================================================

-- Modifier la table messages pour supporter la suppression par utilisateur
ALTER TABLE public.messages
  DROP COLUMN IF EXISTS deleted_by,
  ADD COLUMN IF NOT EXISTS deleted_by_users JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS archived_by_users JSONB DEFAULT '[]'::jsonb;

-- Modifier la table conversations pour l'archivage par utilisateur
-- (archived_by existe déjà, mais on s'assure qu'il est bien JSONB)
ALTER TABLE public.conversations
  ALTER COLUMN archived_by TYPE JSONB USING archived_by::jsonb,
  ALTER COLUMN archived_by SET DEFAULT '[]'::jsonb;

-- Ajouter un index pour optimiser les requêtes de suppression/archivage
CREATE INDEX IF NOT EXISTS idx_messages_deleted_by_users ON public.messages USING GIN (deleted_by_users);
CREATE INDEX IF NOT EXISTS idx_messages_archived_by_users ON public.messages USING GIN (archived_by_users);
CREATE INDEX IF NOT EXISTS idx_conversations_archived_by ON public.conversations USING GIN (archived_by);

-- =====================================================
-- FONCTIONS HELPER pour vérifier si un utilisateur a supprimé/archivé
-- =====================================================

-- Vérifier si un message est supprimé pour un utilisateur spécifique
CREATE OR REPLACE FUNCTION public.is_message_deleted_for_user(
  deleted_by_users JSONB,
  user_profile_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN deleted_by_users ? user_profile_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifier si un message est archivé pour un utilisateur spécifique
CREATE OR REPLACE FUNCTION public.is_message_archived_for_user(
  archived_by_users JSONB,
  user_profile_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN archived_by_users ? user_profile_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifier si une conversation est archivée pour un utilisateur spécifique
CREATE OR REPLACE FUNCTION public.is_conversation_archived_for_user(
  archived_by JSONB,
  user_profile_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN archived_by ? user_profile_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Commentaires
COMMENT ON COLUMN public.messages.deleted_by_users IS 'Liste des profile_ids qui ont supprimé ce message (array JSONB)';
COMMENT ON COLUMN public.messages.archived_by_users IS 'Liste des profile_ids qui ont archivé ce message (array JSONB)';
COMMENT ON FUNCTION public.is_message_deleted_for_user IS 'Vérifie si un message est supprimé pour un utilisateur';
COMMENT ON FUNCTION public.is_message_archived_for_user IS 'Vérifie si un message est archivé pour un utilisateur';
COMMENT ON FUNCTION public.is_conversation_archived_for_user IS 'Vérifie si une conversation est archivée pour un utilisateur';