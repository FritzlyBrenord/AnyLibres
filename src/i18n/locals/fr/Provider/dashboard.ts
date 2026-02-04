export const providerDashboard = {
    loading: "Chargement de votre profil...",
    redirecting: "Redirection vers la connexion...",
    notProvider: {
        title: "Vous n'êtes pas encore prestataire",
        description:
            "Vous devez compléter votre inscription en tant que prestataire pour accéder à ce tableau de bord.",
        button: "Devenir prestataire maintenant",
    },
    welcome: "Bienvenue, {name}",
    subtitle:
        "Voici votre tableau de bord professionnel pour gérer votre activité",
    sellerLevel: "Nouveau vendeur",
    stats: {
        availableBalance: "Solde disponible",
        withdraw: "Retirer",
        totalEarned: "Total gagné",
        pending: "En attente :",
        activeOrders: "Commandes actives",
        viewAll: "Voir tout",
        rating: "Notation",
        responseRate: "Taux de réponse :",
    },
    activeOrders: {
        title: "Aperçu des commandes",
        subtitle: "Gérez vos commandes actives et respectez vos délais",
        viewAll: "Voir tout",
        loading: "Chargement...",
        stats: {
            inProgress: "En cours",
            late: "En retard",
            urgent: "Urgentes",
            delivered: "Livrées",
            actionRequired: "⚠️ Action requise",
            waitingValidation: "En attente validation",
            urgentTiming: "⏰ < 48h",
        },
        priority: {
            title: "Commandes prioritaires ({count})",
            lateLabel: "EN RETARD",
            timeRemaining: {
                late: "En retard",
                lessThan1h: "< 1h",
                hours: "{count}h",
                days: "{count}j",
            },
        },
        empty: {
            noOrders: {
                title: "Aucune commande pour le moment",
                description:
                    "Créez vos premiers services pour commencer à recevoir des commandes",
                button: "Créer un service",
            },
            noActive: {
                title: "Aucune commande en cours",
                description: "Vous n'avez pas de commandes actives pour le moment",
                history: "Voir l'historique des commandes",
            },
            allGood: {
                title: "Tout est sous contrôle ! 🎉",
                description: "Aucune commande urgente ou en retard",
                viewAll: "Voir toutes les commandes",
            },
        },
    },
    recentMessages: {
        title: "Messages récents",
        viewAll: "Voir tout",
        noMessages: "Aucun message récent",
        viewAllButton: "Voir tous les messages",
        relativeTime: {
            justNow: "À l'instant",
            minutes: "Il y a {count} min",
            hours: "Il y a {count}h",
            days: "Il y a {count}j",
        },
        fallbackUser: "Utilisateur",
        noMessageText: "Aucun message",
    },
    quickActions: {
        title: "Actions rapides",
        analytics: {
            title: "Voir Analytiques",
            subtitle: "Performance & statistiques",
        },
        services: {
            title: "Gérer Services",
            subtitle: "Créer & modifier",
        },
        messages: {
            title: "Messages",
            subtitle: "Communiquer avec clients",
        },
        withdrawGains: {
            title: "Retirer gains",
            available: "{amount} disponible",
        },
    },
    withdrawal: {
        errors: {
            invalidAmount: "Veuillez entrer un montant valide",
            minAmount: "Le montant minimum est de {amount}",
            maxAmount: "Le montant maximum est de {amount}",
            insufficientFunds: "Le montant maximum disponible est {amount}",
            selectMethod: "Veuillez sélectionner une méthode de paiement",
            wait24h: "Vous devez attendre 24h entre deux retraits",
            general: "Erreur lors de la demande de retrait",
            server: "Erreur serveur lors de la demande de retrait",
        },
        success: "Retrait de {amount} effectué avec succès !",
    },
    withdrawalModal: {
        title: "Retirer vos gains",
        subtitle: "Transférez vos gains vers votre compte",
        frozenTitle: "Compte Gelé",
        frozenMessage:
            "Votre compte a été temporairement gelé. Tous les retraits sont bloqués.",
        frozenSupport:
            "Veuillez contacter le support pour plus d'informations et débloquer votre compte.",
        timerWarning: "Prochain retrait disponible dans",
        availableBalance: "Solde disponible",
        insufficientBalance: "Solde insuffisant pour effectuer un retrait",
        insufficientBalanceDetail:
            "Minimum requis : {min} • Votre solde : {balance}",
        limitsAndFees: "ⓘ Minimum : {min} • Maximum : {max} • Frais : {fees}%",
        paymentMethod: "Mode de paiement",
        addMethod: "Ajouter",
        noMethodsTitle: "Aucun mode de paiement",
        noMethodsDesc: "Ajoutez votre premier mode de paiement pour commencer",
        addFirstMethod: "Ajouter un mode de paiement",
        amountLabel: "Montant à retirer ({symbol})",
        amountPlaceholder: "0.00",
        minBtn: "Min ({amount})",
        maxBtn: "Max ({amount})",
        summaryTitle: "Récapitulatif",
        amountRequested: "Montant demandé",
        fees: "Frais ({percent}%)",
        youWillReceive: "Vous recevrez",
        cancel: "Annuler",
        confirm: "Confirmer le retrait",
        processing: "Traitement...",
        info: "Les retraits sont traités sous 2-5 jours ouvrables. Un seul retrait autorisé toutes les 24h.",
        errors: {
            accountFrozen:
                "🔒 Compte gelé - Retraits bloqués. Contactez le support.",
            insufficientBalance:
                "Solde insuffisant. Minimum requis : {min} • Votre solde : {balance}",
            minAmount: "Le montant minimum est de {amount}",
            maxAmount: "Le montant maximum est de {amount}",
            selectMethod: "Veuillez sélectionner une méthode de paiement",
            wait24h: "Vous devez attendre 24h entre deux retraits",
            generalError: "Erreur lors du retrait",
        },
    },
};
