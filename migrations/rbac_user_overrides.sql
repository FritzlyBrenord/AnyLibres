-- Migration: User-level Permission Overrides
-- Allows granting or denying specific permissions to individual users.

CREATE TABLE IF NOT EXISTS public.admin_user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
  action text CHECK (action IN ('grant', 'deny')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.admin_user_permissions ENABLE ROW LEVEL SECURITY;

-- Default policy: deny all, only service role can manage (handled by API)
CREATE POLICY "Admin user permissions management" ON public.admin_user_permissions
  FOR ALL TO service_role USING (true);
