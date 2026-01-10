-- =====================================================
-- TABLE: message_attachments
-- Description: Métadonnées des fichiers joints aux messages
-- Fonctionnalités: Tracking de compression, métadonnées vidéo/audio/image
-- =====================================================

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Message concerné
  message_id UUID NOT NULL,

  -- Type de fichier
  -- Valeurs: 'image', 'video', 'audio', 'document'
  file_type VARCHAR(20) NOT NULL,

  -- Chemins des fichiers dans les buckets
  original_url TEXT NOT NULL,      -- Fichier original uploadé
  optimized_url TEXT,               -- Version optimisée/compressée
  thumbnail_url TEXT,               -- Miniature (pour vidéos/images)

  -- Nom du fichier original
  file_name TEXT NOT NULL,

  -- Taille des fichiers (en bytes)
  original_size_bytes BIGINT NOT NULL,
  optimized_size_bytes BIGINT,

  -- Type MIME
  mime_type VARCHAR(100) NOT NULL,

  -- Métadonnées spécifiques au type de fichier
  -- Pour images: {width: 1920, height: 1080}
  -- Pour vidéos: {width: 1920, height: 1080, duration_seconds: 120, codec: "h264"}
  -- Pour audio: {duration_seconds: 180, bitrate: 128, codec: "mp3"}
  -- Pour documents: {pages: 5}
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Statut d'optimisation
  is_optimized BOOLEAN DEFAULT false,
  optimization_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  optimized_at TIMESTAMPTZ,

  CONSTRAINT message_attachments_pkey PRIMARY KEY (id),

  -- Foreign key
  CONSTRAINT message_attachments_message_id_fkey
    FOREIGN KEY (message_id)
    REFERENCES public.messages(id)
    ON DELETE CASCADE,

  -- Valeurs valides pour file_type
  CONSTRAINT message_attachments_file_type_check
    CHECK (file_type IN ('image', 'video', 'audio', 'document')),

  -- Valeurs valides pour optimization_status
  CONSTRAINT message_attachments_optimization_status_check
    CHECK (optimization_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_message_attachments_message_id ON public.message_attachments(message_id);
CREATE INDEX idx_message_attachments_file_type ON public.message_attachments(file_type);
CREATE INDEX idx_message_attachments_optimization_status ON public.message_attachments(optimization_status)
  WHERE optimization_status IN ('pending', 'processing');

-- Index pour recherche dans les métadonnées
CREATE INDEX idx_message_attachments_metadata ON public.message_attachments USING GIN (metadata);

-- Activer RLS
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Commentaires
COMMENT ON TABLE public.message_attachments IS 'Métadonnées des fichiers joints aux messages';
COMMENT ON COLUMN public.message_attachments.original_url IS 'URL du fichier original dans le bucket';
COMMENT ON COLUMN public.message_attachments.optimized_url IS 'URL de la version compressée/optimisée';
COMMENT ON COLUMN public.message_attachments.thumbnail_url IS 'URL de la miniature (vidéos/images)';
COMMENT ON COLUMN public.message_attachments.metadata IS 'Métadonnées spécifiques au type de fichier';
COMMENT ON COLUMN public.message_attachments.optimization_status IS 'Statut du processus d\'optimisation';