-- ============================================================================
-- MIGRATION: Admin Notification System
-- Date: 2026-01-20
-- Description: Tables pour permettre aux admins d'envoyer des notifications
--              ciblées aux utilisateurs (clients, prestataires, ou sélection)
-- ============================================================================

-- ============================================================================
-- TABLE: admin_notifications
-- Description: Stocke les notifications envoyées par les administrateurs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  target_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT admin_notifications_type_check CHECK (type IN ('info', 'warning', 'success', 'error')),
  CONSTRAINT admin_notifications_target_type_check CHECK (target_type IN ('all_clients', 'all_providers', 'all_users', 'specific')),
  CONSTRAINT admin_notifications_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON public.admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_target_type ON public.admin_notifications(target_type);

-- ============================================================================
-- TABLE: admin_notification_recipients
-- Description: Gère les destinataires spécifiques et le statut de lecture
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES admin_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT admin_notification_recipients_unique UNIQUE(notification_id, user_id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_admin_notification_recipients_notification_id ON public.admin_notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_admin_notification_recipients_user_id ON public.admin_notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notification_recipients_is_read ON public.admin_notification_recipients(is_read);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_recipients ENABLE ROW LEVEL SECURITY;

-- Politique: Les admins peuvent voir toutes les notifications qu'ils ont créées
CREATE POLICY "Admins can view their own notifications"
  ON public.admin_notifications FOR SELECT
  USING (admin_id = auth.uid());

-- Politique: Les admins peuvent créer des notifications
CREATE POLICY "Admins can create notifications"
  ON public.admin_notifications FOR INSERT
  WITH CHECK (admin_id = auth.uid());

-- Politique: Les utilisateurs peuvent voir leurs propres destinataires
CREATE POLICY "Users can view their notification recipients"
  ON public.admin_notification_recipients FOR SELECT
  USING (user_id = auth.uid());

-- Politique: Les admins peuvent créer des destinataires
CREATE POLICY "Admins can create notification recipients"
  ON public.admin_notification_recipients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_notifications
      WHERE admin_notifications.id = notification_id
      AND admin_notifications.admin_id = auth.uid()
    )
  );

-- Politique: Les utilisateurs peuvent mettre à jour leur statut de lecture
CREATE POLICY "Users can update their read status"
  ON public.admin_notification_recipients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.admin_notifications IS 'Notifications envoyées par les administrateurs aux utilisateurs';
COMMENT ON TABLE public.admin_notification_recipients IS 'Destinataires des notifications admin avec statut de lecture';

COMMENT ON COLUMN public.admin_notifications.type IS 'Type de notification: info, warning, success, error';
COMMENT ON COLUMN public.admin_notifications.target_type IS 'Type de cible: all_clients, all_providers, all_users, specific';
COMMENT ON COLUMN public.admin_notifications.priority IS 'Priorité: low, normal, high, urgent';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
