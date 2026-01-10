-- =====================================================
-- TABLE: messages (ENHANCED)
-- Description: Messages dans les conversations
-- Fonctionnalités: Reply, suppression, types de messages, statuts de lecture avancés
-- =====================================================

-- Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS public.messages CASCADE;

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Relation avec la conversation
  conversation_id UUID NOT NULL,

  -- Expéditeur et destinataire
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,

  -- Contenu du message
  text TEXT,

  -- Type de message (pour les objets spéciaux)
  -- Valeurs possibles: 'text', 'order_request', 'order_accepted', 'order_rejected',
  -- 'revision_request', 'delivery', 'system'
  message_type VARCHAR(50) DEFAULT 'text',

  -- Pour répondre à un message spécifique
  reply_to_message_id UUID,

  -- Pièces jointes (URLs des fichiers dans les buckets)
  attachments JSONB DEFAULT '[]'::jsonb,

  -- Métadonnées supplémentaires (order_id, revision_id, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Statuts de lecture
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Statut de délivrance
  is_delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,

  -- Suppression (soft delete)
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,

  -- Édition
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT messages_pkey PRIMARY KEY (id),

  -- Foreign keys
  CONSTRAINT messages_conversation_id_fkey
    FOREIGN KEY (conversation_id)
    REFERENCES public.conversations(id)
    ON DELETE CASCADE,

  CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  CONSTRAINT messages_receiver_id_fkey
    FOREIGN KEY (receiver_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  CONSTRAINT messages_reply_to_fkey
    FOREIGN KEY (reply_to_message_id)
    REFERENCES public.messages(id)
    ON DELETE SET NULL,

  CONSTRAINT messages_deleted_by_fkey
    FOREIGN KEY (deleted_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  -- Le message doit avoir du texte OU des pièces jointes
  CONSTRAINT messages_content_check
    CHECK (
      text IS NOT NULL OR
      (attachments IS NOT NULL AND jsonb_array_length(attachments) > 0)
    )
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON public.messages(is_read) WHERE is_read = false;
CREATE INDEX idx_messages_reply_to ON public.messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
CREATE INDEX idx_messages_type ON public.messages(message_type);
CREATE INDEX idx_messages_not_deleted ON public.messages(is_deleted) WHERE is_deleted = false;

-- Index pour recherche dans les métadonnées
CREATE INDEX idx_messages_metadata ON public.messages USING GIN (metadata);

-- Activer RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Commentaires
COMMENT ON TABLE public.messages IS 'Messages des conversations';
COMMENT ON COLUMN public.messages.message_type IS 'Type de message: text, order_request, order_accepted, etc.';
COMMENT ON COLUMN public.messages.reply_to_message_id IS 'ID du message auquel on répond';
COMMENT ON COLUMN public.messages.attachments IS 'Tableau JSON des pièces jointes';
COMMENT ON COLUMN public.messages.metadata IS 'Métadonnées (order_id, revision_id, etc.)';
COMMENT ON COLUMN public.messages.is_deleted IS 'Suppression logique du message';