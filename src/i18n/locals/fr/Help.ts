export const help = {
    title: "Centre d'Aide",
    subtitle: "Comment pouvons-nous vous aider ?",
    searchPlaceholder: "Rechercher dans l'aide...",

    tabs: {
        general: "Général",
        client: "Client",
        provider: "Prestataire"
    },

    general: {
        title: "À propos d'AnyLibre",
        description: "AnyLibre est une plateforme innovante connectant des clients ayant des besoins spécifiques à des prestataires qualifiés. Nous sécurisons les paiements et garantissons la qualité des services.",
        features: [
            {
                title: "Pour les Clients",
                desc: "Trouvez des experts, payez en toute sécurité et obtenez des résultats garantis."
            },
            {
                title: "Pour les Prestataires",
                desc: "Proposez vos services, gagnez de nouveaux clients et soyez payé rapidement."
            },
            {
                title: "Sécurité",
                desc: "Vos données et transactions sont protégées par les meilleurs standards."
            }
        ]
    },

    client: {
        title: "Guide Client",
        steps: [
            { title: "1. Recherche", desc: "Utilisez notre moteur de recherche pour trouver le service idéal." },
            { title: "2. Commande", desc: "Passez commande en décrivant vos besoins et payez via un compte sécurisé." },
            { title: "3. Collaboration", desc: "Échangez avec le prestataire via notre messagerie intégrée." },
            { title: "4. Validation", desc: "Validez la livraison pour libérer le paiement au prestataire." }
        ]
    },

    provider: {
        title: "Guide Prestataire",
        steps: [
            { title: "1. Profil", desc: "Créez un profil complet et attrayant pour rassurer les clients." },
            { title: "2. Services", desc: "Publiez vos offres avec des descriptions claires et des prix justes." },
            { title: "3. Réalisation", desc: "Livrez un travail de qualité dans les délais impartis." },
            { title: "4. Paiement", desc: "Recevez vos gains dès la validation de la commande par le client." },
            { title: "Devenir Prestataire", desc: "Vous avez un talent ? Rejoignez-nous !", button: "Devenir Prestataire" }
        ]
    },

    faq: {
        title: "Questions Fréquentes",
        items: [
            { q: "Est-ce gratuit ?", a: "L'inscription est gratuite. Des frais de service s'appliquent lors des commandes." },
            { q: "Comment payer ?", a: "Nous acceptons les cartes bancaires, MonCash et autres méthodes locales." },
            { q: "Puis-je annuler ?", a: "Oui, sous certaines conditions avant le début de la commande." }
        ]
    },

    chat: {
        title: "Assistant AnyLibre",
        welcome: "Bonjour ! Je suis l'assistant virtuel d'AnyLibre. Comment puis-je vous aider aujourd'hui ?",
        inputPlaceholder: "Posez votre question...",
        send: "Envoyer",
        suggested: "Suggestions",
        talkToAgent: "Parler à un agent humain",
        agentButton: "Contacter le support",
        topics: {
            order: "Problème de commande",
            payment: "Question paiement",
            account: "Mon compte",
            other: "Autre"
        }
    },

    contact: {
        title: "Contactez-nous",
        desc: "Notre équipe est là pour vous aider.",
        object: "Objet",
        message: "Message",
        sendEmail: "Envoyer par email",
        send: "Envoyer le message",
        success: "Message envoyé avec succès !",
        emailParams: {
            subject: "Support AnyLibre: {object}",
            body: "Bonjour,\n\n{message}\n\nCordialement,"
        }
    }
};
