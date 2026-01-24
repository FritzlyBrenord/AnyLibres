-- ============================================================================
-- Migration: Add Mediation Session Fields to Disputes Table
-- ============================================================================

-- Add mediation session tracking fields to disputes table
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS mediation_session_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS mediation_session_ended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS client_joined_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS provider_joined_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS admin_joined_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS client_accepted_rules BOOLEAN DEFAULT FALSE;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS provider_accepted_rules BOOLEAN DEFAULT FALSE;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS session_status TEXT DEFAULT 'pending';
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS transcript_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS mediation_requested_date TIMESTAMP WITH TIME ZONE;


-- Add index for session status queries
CREATE INDEX IF NOT EXISTS idx_disputes_session_status ON disputes(session_status);

-- ============================================================================
-- Table: Mediation Presence Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS mediation_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client', 'provider', 'admin')),
  is_present BOOLEAN DEFAULT TRUE,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mediation_presence_dispute ON mediation_presence(dispute_id);
CREATE INDEX IF NOT EXISTS idx_mediation_presence_user ON mediation_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_mediation_presence_active ON mediation_presence(dispute_id, is_present) WHERE is_present = TRUE;

-- Unique constraint: one active presence per user per dispute
CREATE UNIQUE INDEX IF NOT EXISTS idx_mediation_presence_unique_active 
  ON mediation_presence(dispute_id, user_id) 
  WHERE is_present = TRUE;

-- ============================================================================
-- RLS Policies for Mediation Presence
-- ============================================================================

ALTER TABLE mediation_presence ENABLE ROW LEVEL SECURITY;

-- Users can view presence for disputes they're involved in
DROP POLICY IF EXISTS "mediation_presence_select" ON mediation_presence;
CREATE POLICY "mediation_presence_select" ON mediation_presence
  FOR SELECT USING (
    -- User is participant in the dispute
    dispute_id IN (
      SELECT id FROM disputes 
      WHERE opened_by_id = auth.uid()
    )
    OR dispute_id IN (
      SELECT d.id FROM disputes d
      JOIN orders o ON d.order_id = o.id
      WHERE o.client_id = auth.uid() OR o.provider_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own presence
DROP POLICY IF EXISTS "mediation_presence_insert" ON mediation_presence;
CREATE POLICY "mediation_presence_insert" ON mediation_presence
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own presence
DROP POLICY IF EXISTS "mediation_presence_update" ON mediation_presence;
CREATE POLICY "mediation_presence_update" ON mediation_presence
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- Function: Auto-update presence timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_mediation_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mediation_presence_timestamp ON mediation_presence;
CREATE TRIGGER trigger_update_mediation_presence_timestamp
  BEFORE UPDATE ON mediation_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_mediation_presence_timestamp();

-- ============================================================================
-- Function: Mark presence as inactive after timeout
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_stale_mediation_presence()
RETURNS void AS $$
BEGIN
  UPDATE mediation_presence
  SET is_present = FALSE,
      left_at = NOW()
  WHERE is_present = TRUE
    AND last_heartbeat < NOW() - INTERVAL '3 minutes';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE mediation_presence IS 'Tracks real-time presence of participants in mediation sessions';
COMMENT ON COLUMN mediation_presence.last_heartbeat IS 'Updated every 30 seconds by active participants';
COMMENT ON COLUMN disputes.mediation_requested_date IS 'Date and time proposed by client for mediation meeting';
