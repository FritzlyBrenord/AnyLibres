-- ============================================================================
-- Migration: Ajout des permissions granulaires manquantes
-- Date: 2026-02-03
-- Description: Ajoute toutes les permissions manquantes identifiées lors de l'audit
-- ============================================================================

-- Vérifier et ajouter les permissions manquantes
-- Note: ON CONFLICT DO NOTHING évite les erreurs si la permission existe déjà

-- ============================================================================
-- PERMISSIONS DASHBOARD
-- ============================================================================
INSERT INTO public.admin_permissions (slug, module, description)
VALUES 
  ('dashboard.activity.view', 'Dashboard', 'Voir les activités récentes'),
  ('analytics.live', 'Dashboard', 'Voir les analytics en temps réel')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PERMISSIONS NOTIFICATIONS (historique manquant)
-- ============================================================================
INSERT INTO public.admin_permissions (slug, module, description)
VALUES 
  ('notifications.history.view', 'Notifications', 'Voir l''historique des notifications envoyées')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PERMISSIONS SUPPORT (close chat manquante)
-- ============================================================================
INSERT INTO public.admin_permissions (slug, module, description)
VALUES 
  ('support.chats.close', 'Support', 'Fermer des conversations de chat'),
  ('support.chats.view', 'Support', 'Accéder à la messagerie de support')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PERMISSIONS SERVICES (détails manquant si nécessaire)
-- ============================================================================
-- Note: services.details.view existe déjà selon la liste fournie

-- ============================================================================
-- PERMISSIONS ADDITIONNELLES IDENTIFIÉES
-- ============================================================================

-- Permissions pour les actions détaillées sur les disputes
INSERT INTO public.admin_permissions (slug, module, description)
VALUES 
  ('disputes.details.view', 'Disputes', 'Voir les détails complets d''un litige'),
  ('disputes.assign', 'Disputes', 'S''assigner un litige pour traitement')
ON CONFLICT (slug) DO NOTHING;

-- Permissions pour les statistiques et rapports
INSERT INTO public.admin_permissions (slug, module, description)
VALUES 
  ('dashboard.stats.view', 'Dashboard', 'Voir les statistiques détaillées'),
  ('finance.reports.generate', 'Finance', 'Générer des rapports financiers'),
  ('users.stats.view', 'Users', 'Voir les statistiques utilisateurs')
ON CONFLICT (slug) DO NOTHING;

-- Permissions pour les actions administratives critiques
INSERT INTO public.admin_permissions (slug, module, description)
VALUES 
  ('system.settings.modify', 'System', 'Modifier les paramètres système critiques'),
  ('system.logs.view', 'System', 'Consulter les logs système'),
  ('system.maintenance.execute', 'System', 'Exécuter des tâches de maintenance')
ON CONFLICT (slug) DO NOTHING;

-- Permissions pour les remboursements détaillés
INSERT INTO public.admin_permissions (slug, module, description)
VALUES 
  ('orders.refunds.process', 'Orders', 'Traiter manuellement un remboursement')
ON CONFLICT (slug) DO NOTHING;

-- Permissions pour la gestion des services
INSERT INTO public.admin_permissions (slug, module, description)
VALUES 
  ('services.edit', 'Services', 'Modifier les détails d''un service'),
  ('services.delete', 'Services', 'Supprimer un service'),
  ('services.approve', 'Services', 'Approuver un nouveau service')
ON CONFLICT (slug) DO NOTHING;

-- Permissions pour les exports
INSERT INTO public.admin_permissions (slug, module, description)
VALUES 
  ('orders.export', 'Orders', 'Exporter les données de commandes'),
  ('services.export', 'Services', 'Exporter les données de services'),
  ('disputes.export', 'Disputes', 'Exporter les données de litiges')
ON CONFLICT (slug) DO NOTHING;

-- Permissions pour les modals et détails
INSERT INTO public.admin_permissions (slug, module, description)
VALUES 
  ('orders.details.full', 'Orders', 'Voir tous les détails d''une commande'),
  ('users.details.full', 'Users', 'Voir tous les détails d''un utilisateur')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Vérification : Afficher toutes les permissions créées
-- ============================================================================
-- Décommenter pour voir le résultat après migration:
-- SELECT slug, module, description, created_at 
-- FROM public.admin_permissions 
-- ORDER BY module, slug;

-- ============================================================================
-- Note importante :
-- Après cette migration, tous les composants doivent vérifier les permissions
-- appropriées avant d'afficher ou permettre des actions.
-- ============================================================================
