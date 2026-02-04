-- Migration: Expand profiles.role to allow dynamic RBAC roles
-- This script converts the role column from role_enum to text.

DO $$ 
BEGIN
    -- 1. Supprimer la valeur par défaut pour permettre le changement de type
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

    -- 2. Changer le type de la colonne en TEXT
    ALTER TABLE public.profiles ALTER COLUMN role SET DATA TYPE text USING role::text;

    -- 3. Remettre la valeur par défaut en tant que texte
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'client';

    -- 4. Optionnel: Ajouter une documentation/commentaire
    COMMENT ON COLUMN public.profiles.role IS 'User role (client, provider, or any administrative role slug from RBAC)';
END $$;
