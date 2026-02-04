-- Migration: RBAC System for Admin
-- Description: Creates tables for roles, permissions and user assignments

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des rôles
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL DEFAULT 'admin', -- technical name for enum mapping
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des permissions
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL, -- ex: 'finance.view', 'users.delete'
    module TEXT NOT NULL,      -- ex: 'Finance', 'Users'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table de liaison Rôles <-> Permissions
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
    role_id UUID REFERENCES public.admin_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Table d'attribution des rôles aux utilisateurs
CREATE TABLE IF NOT EXISTS public.admin_user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.admin_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user_roles ENABLE ROW LEVEL SECURITY;

-- Initialisation des permissions de base
INSERT INTO public.admin_permissions (slug, module, description) VALUES
('dashboard.view', 'Dashboard', 'Voir le tableau de bord'),
('dashboard.activity.view', 'Dashboard', 'Voir les activités récentes'),
('services.view', 'Services', 'Voir la liste des services'),
('services.manage_status', 'Services', 'Changer le statut des services'),
('services.analytics.view', 'Services', 'Voir les performances des services'),
('orders.view', 'Orders', 'Voir la liste des commandes'),
('orders.manage_status', 'Orders', 'Gérer le cycle de vie des commandes'),
('orders.revision.request', 'Orders', 'Demander des révisions'),
('finance.view', 'Finance', 'Voir l''aperçu financier'),
('finance.balances.view', 'Finance', 'Voir les soldes des prestataires'),
('finance.withdrawals.manage', 'Finance', 'Gérer les demandes de retrait'),
('finance.export', 'Finance', 'Exporter les données financières'),
('users.view', 'Users', 'Voir la liste des utilisateurs'),
('users.manage_status', 'Users', 'Bloquer/Débloquer des utilisateurs'),
('users.delete', 'Users', 'Supprimer définitivement des utilisateurs'),
('users.impersonate', 'Users', 'Se connecter en tant qu''utilisateur'),
('users.export', 'Users', 'Exporter la liste des utilisateurs'),
('disputes.view', 'Disputes', 'Voir les litiges en cours'),
('disputes.manage', 'Disputes', 'Prendre en charge un litige'),
('disputes.mediation.start', 'Disputes', 'Démarrer une médiation tripartite'),
('disputes.resolve', 'Disputes', 'Rendre un verdict sur un litige'),
('support.tickets.view', 'Support', 'Voir les tickets support'),
('support.tickets.manage', 'Support', 'Fermer/Réouvrir des tickets'),
('support.chats.view', 'Support', 'Voir les chats en direct'),
('support.chats.manage', 'Support', 'Répondre aux chats support'),
('notifications.view', 'Notifications', 'Voir l''historique des notifications'),
('notifications.send', 'Notifications', 'Envoyer des notifications système'),
('settings.view', 'Settings', 'Voir les paramètres de la plateforme'),
('settings.fees.manage', 'Settings', 'Modifier les commissions et frais'),
('settings.categories.manage', 'Settings', 'Gérer les catégories et métadonnées'),
('settings.currencies.manage', 'Settings', 'Gérer les devises et taux de conversion'),
('system.roles.manage', 'System', 'Gérer les rôles et permissions'),
('system.users.manage', 'System', 'Gérer les accès du personnel administratif')
ON CONFLICT (slug) DO NOTHING;

-- Création d'un rôle Super Admin par défaut
INSERT INTO public.admin_roles (name, description) 
VALUES ('Super Administrateur', 'Accès complet à toutes les fonctionnalités du système')
ON CONFLICT (name) DO NOTHING;

-- Assigner toutes les permissions au Super Admin
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.admin_roles r, public.admin_permissions p
WHERE r.name = 'Super Administrateur'
ON CONFLICT DO NOTHING;
