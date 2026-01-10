-- ============================================================================
-- Fix: Permission denied for table users (v2)
-- Problème: Le trigger sync_profile_email() ne peut pas accéder à auth.users
-- Solution: Désactiver le trigger OU utiliser une approche différente
-- ============================================================================

-- OPTION 1: Désactiver complètement le trigger (SIMPLE ET EFFICACE)
-- Cette option évite complètement le problème
DROP TRIGGER IF EXISTS trigger_sync_profile_email ON profiles;

-- OPTION 2: Si vous voulez garder la synchronisation d'email,
-- créez un trigger qui s'exécute côté API plutôt que côté DB

-- Note: L'email est déjà disponible via l'API Supabase,
-- donc synchroniser dans profiles n'est pas strictement nécessaire.
-- Vous pouvez toujours récupérer l'email via:
-- const { data: { user } } = await supabase.auth.getUser();
-- et l'utiliser dans votre code.

COMMENT ON TABLE profiles IS 'Table des profils utilisateurs. L''email peut être récupéré via supabase.auth.getUser() côté API.';
