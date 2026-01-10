-- ============================================================================
-- Fix: Permission denied for table users
-- Problème: Le trigger sync_profile_email() ne peut pas accéder à auth.users
-- Solution: Accorder les permissions nécessaires à la fonction SECURITY DEFINER
-- ============================================================================

-- 1. Recréer la fonction avec SECURITY DEFINER et les bonnes permissions
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
DECLARE
  auth_email TEXT;
BEGIN
  -- Ne synchroniser que si l'email a changé OU si c'est un INSERT
  -- Et seulement si NEW.email est NULL ou différent de auth.users.email
  IF (TG_OP = 'INSERT' OR OLD.email IS DISTINCT FROM NEW.email) THEN
    -- Récupérer l'email de auth.users
    SELECT email INTO auth_email
    FROM auth.users
    WHERE id = NEW.user_id;

    -- Ne mettre à jour que si l'email est différent
    IF auth_email IS NOT NULL AND (NEW.email IS NULL OR NEW.email != auth_email) THEN
      NEW.email := auth_email;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Accorder les permissions SELECT sur auth.users à la fonction
-- La fonction s'exécute avec les privilèges du créateur (postgres/supabase_admin)
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- 3. S'assurer que le trigger existe
DROP TRIGGER IF EXISTS trigger_sync_profile_email ON profiles;
CREATE TRIGGER trigger_sync_profile_email
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();

-- 4. Commentaire
COMMENT ON FUNCTION sync_profile_email() IS 'Synchronise l''email de auth.users vers profiles (avec permissions auth.users)';
