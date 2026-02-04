-- Migration to add granular permissions for the new admin components
-- Date: 2024-06-01

INSERT INTO public.admin_permissions (slug, description, module)
VALUES 
    -- Payment Rules
    ('payment_rules.view', 'Voir les règles de déblocage des paiements', 'Payment Rules'),
    ('payment_rules.add', 'Ajouter une règle de déblocage', 'Payment Rules'),
    ('payment_rules.edit', 'Modifier les règles de déblocage', 'Payment Rules'),
    ('payment_rules.delete', 'Supprimer les règles de déblocage', 'Payment Rules'),

    -- Donations
    ('donations.view_history', 'Voir l''historique des dons', 'Donations'),
    ('donations.create', 'Faire un don à un utilisateur', 'Donations'),

    -- Refunds (Orders)
    ('orders.refunds.view', 'Voir les demandes de remboursement', 'Orders'),
    ('orders.refunds.approve', 'Approuver un remboursement', 'Orders'),
    ('orders.refunds.reject', 'Rejeter un remboursement', 'Orders'),

    -- Balances (Finance)
    ('finance.balances.release', 'Libérer des fonds manuellement', 'Finance'),
    ('finance.balances.freeze', 'Geler/Dégeler un compte provider', 'Finance'),
    ('finance.balances.view_history', 'Voir l''historique des soldes', 'Finance'),
    ('finance.balances.edit_limits', 'Modifier les limites et timers des soldes', 'Finance'),

    -- Support
    ('support.tickets.close', 'Fermer des tickets', 'Support'),
    ('support.chats.reopen', 'Réouvrir des conversations', 'Support'),
    ('support.chats.message', 'Envoyer des messages (Support)', 'Support'),

    -- Currencies
    ('currencies.add', 'Ajouter une devise', 'Currencies'),
    ('currencies.edit', 'Modifier une devise', 'Currencies'),
    ('currencies.delete', 'Supprimer une devise', 'Currencies'),
    ('currencies.update_rates', 'Mettre à jour les taux de change', 'Currencies'),

    -- Withdrawals
    ('withdrawals.details.view', 'Voir les détails d''un retrait', 'Finance'),

    -- Orders (Granular actions)
    ('orders.actions.start', 'Démarrer une commande', 'Orders'),
    ('orders.actions.deliver', 'Livrer une commande', 'Orders'),
    ('orders.actions.accept', 'Accepter une commande', 'Orders'),
    ('orders.actions.cancel', 'Annuler une commande', 'Orders'),
    ('orders.actions.revision', 'Demander une révision', 'Orders'),
    ('orders.view_details', 'Voir les détails d''une commande', 'Orders'),

    -- Services
    ('services.performance.view', 'Voir les statistiques de performance', 'Services'),
    ('services.details.view', 'Voir les détails d''un service', 'Services')
ON CONFLICT (slug) DO UPDATE 
SET module = EXCLUDED.module, description = EXCLUDED.description;
