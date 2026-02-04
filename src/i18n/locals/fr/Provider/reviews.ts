export const reviewsPage = {
    title: "Mes Avis",
    subtitle: "Consultez tous les avis de vos clients et gérez vos réponses",
    loading: "Chargement de vos avis...",
    error: {
        fetch: "Erreur lors du chargement des avis",
        generic: "Impossible de charger les avis",
    },
    stats: {
        averageRating: {
            title: "Note moyenne",
            subtitle: "sur {count} avis",
        },
        totalReviews: {
            title: "Total des avis",
        },
        responseRate: {
            title: "Taux de réponse",
            subtitle: "({with}/{total})",
        },
        pendingResponse: {
            title: "En attente de réponse",
        },
        distribution: {
            title: "Distribution des notes",
        },
        criteria: {
            title: "Notes par critère",
            communication: "Communication",
            quality: "Qualité du travail",
            deadline: "Respect des délais",
        },
    },
    filters: {
        title: "Filtres",
        searchPlaceholder: "Rechercher...",
        rating: {
            all: "Toutes les notes",
            stars: "{count} étoiles",
        },
        response: {
            all: "Tous les avis",
            responded: "Avec réponse",
            pending: "Sans réponse",
        },
        activeFilters: "Filtres actifs:",
    },
    card: {
        anonymous: "Client anonyme",
        datePrefix: "le ",
        yourResponse: "Votre réponse",
        replyButton: "Répondre à cet avis",
        criteria: {
            communication: "Communication",
            quality: "Qualité",
            deadline: "Délais",
        },
    },
    empty: {
        filtered: {
            title: "Aucun avis ne correspond aux filtres",
            subtitle: "Essayez de modifier vos critères de recherche",
        },
        none: {
            title: "Aucun avis pour le moment",
            subtitle: "Vos premiers avis apparaîtront ici",
        },
    },
};
