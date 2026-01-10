-- =====================================================
-- TABLE: message_reactions
-- Description: Réactions emoji sur les messages
-- Fonctionnalités: Support des emojis, plusieurs réactions par message
-- =====================================================

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Message concerné
  message_id UUID NOT NULL,

  -- Utilisateur qui a réagi
  profile_id UUID NOT NULL,

  -- Emoji utilisé (Unicode ou shortcode)
  -- Ex: "👍", "❤️", ":heart:", ":thumbsup:"
  emoji VARCHAR(50) NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT message_reactions_pkey PRIMARY KEY (id),

  -- Foreign keys
  CONSTRAINT message_reactions_message_id_fkey
    FOREIGN KEY (message_id)
    REFERENCES public.messages(id)
    ON DELETE CASCADE,

  CONSTRAINT message_reactions_profile_id_fkey
    FOREIGN KEY (profile_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  -- Un utilisateur ne peut réagir qu'une seule fois avec le même emoji sur un message
  CONSTRAINT message_reactions_unique
    UNIQUE (message_id, profile_id, emoji)
);

-- Index pour compter les réactions par message
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);

-- Index pour trouver les réactions d'un utilisateur
CREATE INDEX idx_message_reactions_profile_id ON public.message_reactions(profile_id);

-- Activer RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Commentaires
COMMENT ON TABLE public.message_reactions IS 'Réactions emoji sur les messages';
COMMENT ON COLUMN public.message_reactions.emoji IS 'Emoji Unicode ou shortcode';