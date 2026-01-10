-- ============================================================================
-- Table: pending_message_notifications
-- Description: Suivi des notifications de messages à envoyer après 20 minutes
-- ============================================================================

CREATE TABLE IF NOT EXISTS pending_message_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  message_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_preview TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pending_message_notifications_status
  ON pending_message_notifications(status);

CREATE INDEX IF NOT EXISTS idx_pending_message_notifications_scheduled
  ON pending_message_notifications(scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pending_message_notifications_conversation
  ON pending_message_notifications(conversation_id, recipient_id, status);

-- Activer RLS
ALTER TABLE pending_message_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own pending notifications"
  ON pending_message_notifications
  FOR SELECT
  USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Policy: Le système peut insérer des notifications
CREATE POLICY "System can insert notifications"
  ON pending_message_notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Le système peut mettre à jour les notifications
CREATE POLICY "System can update notifications"
  ON pending_message_notifications
  FOR UPDATE
  USING (true);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_pending_message_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pending_message_notifications_updated_at
  BEFORE UPDATE ON pending_message_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_message_notifications_updated_at();

-- Commentaires
COMMENT ON TABLE pending_message_notifications IS 'Suivi des notifications email pour messages non répondus après 20 minutes';
COMMENT ON COLUMN pending_message_notifications.scheduled_for IS 'Heure à laquelle la notification doit être envoyée (20 minutes après le message)';
COMMENT ON COLUMN pending_message_notifications.status IS 'pending: en attente, sent: envoyée, cancelled: annulée (utilisateur a répondu), failed: échec d''envoi';
