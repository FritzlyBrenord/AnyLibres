-- ============================================================================
-- 🚀 RBAC FINAL FIX REPAIR SCRIPT
-- ============================================================================

-- 1. Expansion du type ENUM (Doit être fait séparément si possible, mais on tente ici)
-- Note: 'ALTER TYPE ... ADD VALUE' ne peut pas être dans une transaction avec d'autres commandes.
-- Si cela échoue, exécutez les lignes ALTER TYPE une par une.

ALTER TYPE public.role_enum ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.role_enum ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.role_enum ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.role_enum ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.role_enum ADD VALUE IF NOT EXISTS 'content_manager';

-- 2. Structure de la table admin_roles
ALTER TABLE public.admin_roles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 3. Mise à jour des rôles existants ou nouveaux
INSERT INTO public.admin_roles (name, slug, description) VALUES
('Super Administrateur', 'super_admin', 'Rôle système racine - Accès total et permanent (Protégé)'),
('Administrateur', 'admin', 'Accès complet à la gestion métier, sans accès aux paramètres système'),
('Modérateur', 'moderator', 'Gestion des services, des utilisateurs et résolution des litiges'),
('Agent de Support', 'support', 'Gestion des tickets support et messagerie utilisateur'),
('Responsable Financier', 'finance', 'Gestion des flux monétaires, soldes et retraits'),
('Gestionnaire de Contenu', 'content_manager', 'Maintenance du catalogue des services et catégories')
ON CONFLICT (name) DO UPDATE SET 
    slug = EXCLUDED.slug, 
    description = EXCLUDED.description;

-- 4. Nettoyage des rôles orphelins (optionnel)
-- DELETE FROM public.admin_roles WHERE slug IS NULL;

-- 5. Vérification
SELECT name, slug FROM public.admin_roles;
