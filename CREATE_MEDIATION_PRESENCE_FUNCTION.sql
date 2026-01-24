-- ============================================================
-- Fix: Create trigger function for mediation_presence updates
-- ============================================================

-- Créer la fonction de trigger si elle n'existe pas
CREATE OR REPLACE FUNCTION update_mediation_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vérifier que le trigger existe
-- Si le trigger n'existe pas, il faut le créer avec:
-- CREATE TRIGGER trigger_update_mediation_presence_timestamp 
-- BEFORE UPDATE ON mediation_presence 
-- FOR EACH ROW 
-- EXECUTE FUNCTION update_mediation_presence_timestamp();
