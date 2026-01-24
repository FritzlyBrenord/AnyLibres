-- Migration: Add RLS Policies to Refunds Table
-- Created: 2026-01-17
-- Purpose: Fix "Failed to create refund request" error by implementing Row Level Security

-- ============================================================================
-- ENABLE RLS ON REFUNDS TABLE
-- ============================================================================
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY 1: Clients can view their own refund requests
-- ============================================================================
DROP POLICY IF EXISTS "Clients can view their refunds" ON public.refunds;
CREATE POLICY "Clients can view their refunds"
  ON public.refunds
  FOR SELECT
  USING (client_id = auth.uid());

-- ============================================================================
-- POLICY 2: Providers can view refund requests for their orders
-- ============================================================================
DROP POLICY IF EXISTS "Providers can view refunds for their orders" ON public.refunds;
CREATE POLICY "Providers can view refunds for their orders"
  ON public.refunds
  FOR SELECT
  USING (provider_id = auth.uid());

-- ============================================================================
-- POLICY 3: Clients can create refund requests for their paid orders
-- ============================================================================
DROP POLICY IF EXISTS "Clients can request refunds for their orders" ON public.refunds;
CREATE POLICY "Clients can request refunds for their orders"
  ON public.refunds
  FOR INSERT
  WITH CHECK (
    -- User must be the client requesting the refund
    auth.uid() = client_id
    -- Order must exist and belong to the client
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
      AND orders.client_id = auth.uid()
      -- Order must be paid
      AND orders.payment_status = 'succeeded'
    )
  );

-- ============================================================================
-- POLICY 4: Clients can update their pending or rejected refunds
-- ============================================================================
DROP POLICY IF EXISTS "Clients can update their pending refunds" ON public.refunds;
CREATE POLICY "Clients can update their pending refunds"
  ON public.refunds
  FOR UPDATE
  USING (
    -- User must be the client who requested the refund
    client_id = auth.uid()
    -- Can only update pending or rejected requests (not approved/completed)
    AND status IN ('pending', 'rejected')
  )
  WITH CHECK (
    -- Same conditions for the new values
    client_id = auth.uid()
    AND status IN ('pending', 'rejected')
  );

-- ============================================================================
-- FUNCTION: Ensure update_updated_at_column exists
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-update updated_at column on refunds update
-- ============================================================================
DROP TRIGGER IF EXISTS trg_refunds_updated_at ON public.refunds;
CREATE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to test after applying)
-- ============================================================================

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE tablename = 'refunds' AND schemaname = 'public';

-- Verify policies exist:
-- SELECT policyname, permissive, roles
-- FROM pg_policies
-- WHERE tablename = 'refunds' AND schemaname = 'public'
-- ORDER BY policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. Admin access to refunds is handled via server-side API routes
--    that use admin Supabase client (createClient({ admin: true }))
--    See: src/app/api/admin/refunds/route.ts
--
-- 2. Policy 3 ensures clients can only request refunds for:
--    - Their own orders
--    - Orders that have been paid (payment_status = 'succeeded')
--
-- 3. Policy 4 prevents modification of approved/completed/cancelled refunds
--    to maintain audit trail
--
-- 4. DELETE is not allowed at RLS level; refunds should only be cancelled
--    by updating status (soft delete pattern)
--
-- ============================================================================
