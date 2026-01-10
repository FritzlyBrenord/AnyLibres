-- =====================================================
-- TABLE: conversations (ENHANCED)
-- Description: Table des conversations entre clients et prestataires
-- Fonctionnalités: Support de métadonnées, typing indicator, dernière activité
-- =====================================================

-- Supprimer l'ancienne table si elle existe (pour recréation)
DROP TABLE IF EXISTS public.conversations CASCADE;

CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Participants (tableau d'UUIDs de profiles)
  participants UUID[] NOT NULL,

  -- Compteur de messages non lus par participant
  -- Format: {"profile_id_1": 5, "profile_id_2": 0}
  unread_count JSONB DEFAULT '{}'::jsonb,

  -- Dernier message de la conversation (pour affichage rapide)
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender_id UUID,

  -- Typing indicator: qui est en train de taper
  -- Format: {"profile_id": "2024-01-01T12:00:00Z"}
  typing_status JSONB DEFAULT '{}'::jsonb,

  -- Métadonnées supplémentaires (commande liée, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Est-ce que la conversation est archivée pour certains participants
  -- Format: {"profile_id": true}
  archived_by JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT conversations_pkey PRIMARY KEY (id),

  -- S'assurer qu'il y a au moins 2 participants
  CONSTRAINT conversations_participants_check CHECK (array_length(participants, 1) >= 2)
);

-- Index pour rechercher les conversations d'un utilisateur
CREATE INDEX idx_conversations_participants ON public.conversations USING GIN (participants);

-- Index pour trier par dernière activité
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- Index pour rechercher par métadonnées (ex: commande_id)
CREATE INDEX idx_conversations_metadata ON public.conversations USING GIN (metadata);

-- Activer RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Commentaires
COMMENT ON TABLE public.conversations IS 'Conversations entre clients et prestataires';
COMMENT ON COLUMN public.conversations.participants IS 'Tableau des profile_ids participants';
COMMENT ON COLUMN public.conversations.unread_count IS 'Nombre de messages non lus par participant';
COMMENT ON COLUMN public.conversations.typing_status IS 'Statut de frappe en temps réel';
COMMENT ON COLUMN public.conversations.metadata IS 'Métadonnées (order_id, service_id, etc.)';
COMMENT ON COLUMN public.conversations.archived_by IS 'Participants ayant archivé la conversation';