-- ============================================================================
-- Fix: Trigger Recursion - sync_profile_email
-- Problème: Le trigger crée une boucle infinie (stack depth exceeded)
-- Solution: Modifier le trigger pour ne s'exécuter que si l'email a changé
-- ============================================================================

-- 1. Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS trigger_sync_profile_email ON profiles;

-- 2. Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS sync_profile_email();

-- 3. Créer une nouvelle fonction qui évite la récursion
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne synchroniser que si l'email a changé OU si c'est un INSERT
  -- Et seulement si NEW.email est NULL ou différent de auth.users.email
  IF (TG_OP = 'INSERT' OR OLD.email IS DISTINCT FROM NEW.email) THEN
    -- Récupérer l'email de auth.users
    DECLARE
      auth_email TEXT;
    BEGIN
      SELECT email INTO auth_email
      FROM auth.users
      WHERE id = NEW.user_id;

      -- Ne mettre à jour que si l'email est différent
      IF auth_email IS NOT NULL AND (NEW.email IS NULL OR NEW.email != auth_email) THEN
        NEW.email := auth_email;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recréer le trigger avec la nouvelle fonction
CREATE TRIGGER trigger_sync_profile_email
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();

-- 5. Commentaire
COMMENT ON FUNCTION sync_profile_email() IS 'Synchronise l''email de auth.users vers profiles (sans récursion)';
