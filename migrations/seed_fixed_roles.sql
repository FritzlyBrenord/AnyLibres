-- Migration: Fixed System Roles & Permissions
-- This script expands role_enum and seeds the admin_roles table with expert-defined roles.

-- 1. Expansion of role_enum (Postgres 12+ supports ADD VALUE IF NOT EXISTS in some contexts)
-- Note: In a transaction, this might fail on some Supabase versions. 
-- We'll use a safer approach if needed, but let's try the direct one first.
DO $$ 
BEGIN
    -- Check and add each value to the enum
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role_enum' AND e.enumlabel = 'super_admin') THEN
        ALTER TYPE public.role_enum ADD VALUE 'super_admin';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role_enum' AND e.enumlabel = 'moderator') THEN
        ALTER TYPE public.role_enum ADD VALUE 'moderator';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role_enum' AND e.enumlabel = 'support') THEN
        ALTER TYPE public.role_enum ADD VALUE 'support';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role_enum' AND e.enumlabel = 'finance') THEN
        ALTER TYPE public.role_enum ADD VALUE 'finance';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role_enum' AND e.enumlabel = 'content_manager') THEN
        ALTER TYPE public.role_enum ADD VALUE 'content_manager';
    END IF;
END $$;

-- 2. Seed admin_roles with fixed roles
INSERT INTO public.admin_roles (name, slug, description) VALUES
('Super Administrateur', 'super_admin', 'Rôle système racine - Accès total et permanent (Protégé)'),
('Administrateur', 'admin', 'Accès complet à la gestion métier, sans accès aux paramètres système'),
('Modérateur', 'moderator', 'Gestion des services, des utilisateurs et résolution des litiges'),
('Agent de Support', 'support', 'Gestion des tickets support et messagerie utilisateur'),
('Responsable Financier', 'finance', 'Gestion des flux monétaires, soldes et retraits'),
('Gestionnaire de Contenu', 'content_manager', 'Maintenance du catalogue des services et catégories')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, description = EXCLUDED.description;

-- 3. Associate Permissions (Helper logic)
-- Since we identify roles by name, we can now link the permissions we defined earlier.

DO $$
DECLARE
    role_id_super uuid;
    role_id_admin uuid;
    role_id_mod uuid;
    role_id_support uuid;
    role_id_finance uuid;
    role_id_content uuid;
BEGIN
    SELECT id INTO role_id_super FROM admin_roles WHERE name = 'Super Administrateur';
    SELECT id INTO role_id_admin FROM admin_roles WHERE name = 'Administrateur';
    SELECT id INTO role_id_mod FROM admin_roles WHERE name = 'Modérateur';
    SELECT id INTO role_id_support FROM admin_roles WHERE name = 'Agent de Support';
    SELECT id INTO role_id_finance FROM admin_roles WHERE name = 'Responsable Financier';
    SELECT id INTO role_id_content FROM admin_roles WHERE name = 'Gestionnaire de Contenu';

    -- Clear existing permissions for these roles to re-seed cleanly
    DELETE FROM admin_role_permissions WHERE role_id IN (role_id_super, role_id_admin, role_id_mod, role_id_support, role_id_finance, role_id_content);

    -- Super Admin: All permissions
    INSERT INTO admin_role_permissions (role_id, permission_id)
    SELECT role_id_super, id FROM admin_permissions;

    -- Admin: All except system management
    INSERT INTO admin_role_permissions (role_id, permission_id)
    SELECT role_id_admin, id FROM admin_permissions WHERE module != 'System';

    -- Modérateur: Services, Users (except delete/impersonate), Disputes, Support
    INSERT INTO admin_role_permissions (role_id, permission_id)
    SELECT role_id_mod, id FROM admin_permissions 
    WHERE module IN ('Services', 'Disputes', 'Support')
    OR (module = 'Users' AND slug IN ('users.view', 'users.manage_status'))
    OR slug = 'dashboard.view';

    -- Agent Support: Support, Notifications, Dashboard view
    INSERT INTO admin_role_permissions (role_id, permission_id)
    SELECT role_id_support, id FROM admin_permissions 
    WHERE module IN ('Support', 'Notifications')
    OR slug IN ('dashboard.view', 'dashboard.activity.view', 'support.chats.view', 'support.chats.manage');

    -- Responsable Financier: Finance, Orders (view), Dashboard
    INSERT INTO admin_role_permissions (role_id, permission_id)
    SELECT role_id_finance, id FROM admin_permissions 
    WHERE module = 'Finance'
    OR slug IN ('dashboard.view', 'orders.view');

    -- Gestionnaire Content: Services, Categories (Settings)
    INSERT INTO admin_role_permissions (role_id, permission_id)
    SELECT role_id_content, id FROM admin_permissions 
    WHERE module = 'Services'
    OR slug IN ('dashboard.view', 'settings.categories.manage');

END $$;
