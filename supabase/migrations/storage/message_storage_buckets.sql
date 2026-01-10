-- =====================================================
-- STORAGE BUCKETS: Configuration pour les messages
-- Description: Buckets pour images, vidéos, audio, documents
-- =====================================================

-- =====================================================
-- BUCKET: message-images
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-images',
  'message-images',
  false, -- Privé, seuls les participants peuvent voir
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];

-- =====================================================
-- BUCKET: message-videos
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-videos',
  'message-videos',
  false,
  104857600, -- 100 MB
  ARRAY['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

-- =====================================================
-- BUCKET: message-audio
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-audio',
  'message-audio',
  false,
  20971520, -- 20 MB
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/m4a']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/m4a'];

-- =====================================================
-- BUCKET: message-documents
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-documents',
  'message-documents',
  false,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

-- Commentaires
COMMENT ON TABLE storage.buckets IS 'Buckets de stockage configurés pour la messagerie';