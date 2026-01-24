-- Make the mediation-attachments bucket public so getPublicUrl works
UPDATE storage.buckets
SET public = true
WHERE id = 'mediation-attachments';

-- Ensure the policy allows public access for reading if we rely on public URLs
-- (Technically for public buckets, RLS for SELECT is skipped or must allow public role)
-- But usually making it public allows unauthenticated access via the public URL endpoint.
