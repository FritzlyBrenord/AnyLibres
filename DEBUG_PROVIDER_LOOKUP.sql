-- === DEBUG: VÉRIFIER SI LE PROVIDER EXISTE ===

-- Données du provider qui essaie d'accéder à la médiation:
-- authUserId: "6e2266bb-014c-4af7-8917-7b4f4e921557"
-- disputeProviderId: "f47222d0-5e07-49f0-9202-650403b0ce74"

-- 1. Vérifier si le provider existe avec cet ID
SELECT id, user_id, profile_id, created_at
FROM providers
WHERE id = 'f47222d0-5e07-49f0-9202-650403b0ce74';

-- 2. Vérifier si l'utilisateur auth existe
SELECT id, email, created_at
FROM auth.users
WHERE id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- 3. Vérifier si le provider est lié à cet utilisateur
SELECT id, user_id, profile_id
FROM providers
WHERE user_id = '6e2266bb-014c-4af7-8917-7b4f4e921557';

-- 4. Vérifier tous les providers et leurs user_id
SELECT id, user_id, profile_id
FROM providers
LIMIT 10;

-- 5. Vérifier les RLS policies sur la table providers
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'providers'
ORDER BY tablename, policyname;

-- 6. Vérifier si l'utilisateur peut voir cette ligne (tester les RLS)
SELECT id, user_id, profile_id
FROM providers
WHERE id = 'f47222d0-5e07-49f0-9202-650403b0ce74'
AND (
  user_id = auth.uid() 
  OR auth.jwt()->'app_metadata'->>'role' = 'admin'
);
