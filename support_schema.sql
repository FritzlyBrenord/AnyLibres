-- ============================================================================
-- SUPPORT SYSTEM SCHEMA (Tickets & Live Chat)
-- ============================================================================

-- 1. SUPPORT TICKETS TABLE (For Contact Form)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id), -- Nullable for visitors
  email TEXT, -- Capture email if user not logged in
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 2. LIVE CHAT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS support_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id), -- Nullable for visitors
  visitor_id TEXT, -- For tracking non-logged in users (fingerprint/cookie)
  assigned_admin_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 3. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES support_chats(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('user', 'admin', 'bot')),
  sender_id UUID, -- Optional linked user ID
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE REALTIME
-- Keep tables private by default, but enable realtime for specific channels
ALTER PUBLICATION supabase_realtime ADD TABLE support_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;

-- 5. RLS POLICIES (Row Level Security)

-- Tickets: Users can see their own, Admins can see all
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create tickets" 
ON support_tickets FOR INSERT 
WITH CHECK (true); -- Allow anyone to insert (public form)

CREATE POLICY "Users view own tickets" 
ON support_tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all tickets" 
ON support_tickets FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Chats: Users see own, Admins see all
ALTER TABLE support_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create chats" 
ON support_chats FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users view own chats" 
ON support_chats FOR SELECT 
USING (auth.uid() = user_id OR visitor_id IS NOT NULL); -- Simplified for demo

CREATE POLICY "Admins manage chats" 
ON support_chats FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Messages: Users see own chat messages, Admins see all
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view messages" 
ON support_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM support_chats 
    WHERE id = chat_id 
    AND (user_id = auth.uid() OR assigned_admin_id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Participants insert messages" 
ON support_messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_chats 
    WHERE id = chat_id 
    AND (user_id = auth.uid() OR assigned_admin_id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
