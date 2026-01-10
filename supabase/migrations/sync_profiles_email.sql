-- ============================================================================
-- Migration: Synchroniser les emails de auth.users vers profiles
-- ============================================================================

-- Ajouter la colonne email si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Synchroniser les emails depuis auth.users vers profiles
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.user_id = auth.users.id
  AND (profiles.email IS NULL OR profiles.email = '');

-- Créer une fonction pour synchroniser automatiquement l'email
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour l'email du profil depuis auth.users
  UPDATE profiles
  SET email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer un trigger pour synchroniser l'email à chaque insertion/mise à jour de profil
DROP TRIGGER IF EXISTS trigger_sync_profile_email ON profiles;
CREATE TRIGGER trigger_sync_profile_email
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();

-- Commentaires
COMMENT ON COLUMN profiles.email IS 'Email synchronisé depuis auth.users pour faciliter les notifications';
COMMENT ON FUNCTION sync_profile_email() IS 'Synchronise automatiquement l''email depuis auth.users vers profiles';
