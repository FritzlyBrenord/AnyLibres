// ============================================================================
// Hook: useSafeLanguage - Version sûre de useLanguage
// Fonctionne avec ou sans LanguageProvider
// ============================================================================

'use client';

import { useLanguageContextSafe } from '@/contexts/LanguageContext';

// Traductions par défaut en français
const defaultTranslations = {
    navigation: {
        explore: 'Explorer',
        about: 'À propos',
        login: 'Connexion',
        register: "S'inscrire",
    },
    home: {
        hero: {
            badge: 'Plateforme #1 en Haïti',
            title: 'Trouvez le Prestataire',
            titleHighlight: 'Parfait pour Votre Projet',
            subtitle: 'Connectez-vous avec des professionnels qualifiés pour',
            subtitleHighlight: 'tous vos projets',
            subtitleEnd: '.',
            searchPlaceholder: 'Rechercher un service...',
            searchButton: 'Rechercher',
            browseButton: 'Parcourir les catégories',
            popularLabel: 'Populaire :',
            popularTags: ['Logo Design', 'Site Web', 'SEO', 'Vidéo'],
        },
        stats: {
            projects: 'Projets',
            experts: 'Experts',
            satisfied: 'Satisfaits',
        },
        categories: {
            badge: 'Catégories',
            title: 'Explorez par Catégorie',
            subtitle: 'Trouvez exactement ce dont vous avez besoin',
            servicesCount: 'services',
        },
        popularServices: {
            badge: 'Tendances',
            title: 'Services Populaires',
            subtitle: 'Les services les plus demandés par nos clients',
            viewAll: 'Voir tout',
            viewAllServices: 'Voir tous les services',
        },
        topProviders: {
            badge: 'Excellence',
            title: 'Prestataires',
            titleHighlight: 'd\'Excellence',
            subtitle: 'Collaborez avec nos professionnels les plus talentueux et expérimentés de la plateforme',
            viewAll: 'Découvrir Tous les Prestataires',
        },
        trust: {
            badge: 'Nos garanties',
            title: 'Pourquoi Choisir AnyLibre ?',
            subtitle: 'Une plateforme de confiance pour tous vos projets',
            securePayment: {
                title: 'Paiement Sécurisé',
                description: 'Transactions 100% sécurisées avec protection acheteur',
            },
            verifiedProviders: {
                title: 'Prestataires Vérifiés',
                description: 'Tous nos prestataires sont vérifiés et qualifiés',
            },
            support247: {
                title: 'Support 24/7',
                description: 'Notre équipe est disponible à tout moment pour vous aider',
            },
            qualityGuarantee: {
                title: 'Qualité Garantie',
                description: 'Satisfaction garantie ou remboursement intégral',
            },
        },
        faq: {
            badge: 'FAQ',
            title: 'Questions Fréquentes',
            viewAll: 'Voir toutes les questions',
            questions: [
                {
                    q: 'Comment fonctionne AnyLibre ?',
                    a: 'AnyLibre connecte clients et prestataires de services. Parcourez les services, choisissez celui qui vous convient, passez commande et collaborez directement avec le prestataire.',
                },
                {
                    q: 'Les paiements sont-ils sécurisés ?',
                    a: 'Oui, tous les paiements sont sécurisés via Stripe. Votre argent est protégé jusqu\'à ce que vous confirmiez la livraison du service.',
                },
                {
                    q: 'Puis-je annuler une commande ?',
                    a: 'Oui, vous pouvez annuler une commande avant qu\'elle ne soit acceptée par le prestataire. Une fois acceptée, contactez le prestataire pour discuter.',
                },
                {
                    q: 'Comment devenir prestataire ?',
                    a: 'Créez un compte, complétez votre profil, ajoutez vos services et commencez à recevoir des commandes. C\'est simple et gratuit.',
                },
            ],
        },
        cta: {
            badge: 'Commencez maintenant',
            title: 'Prêt à Démarrer Votre Projet ?',
            subtitle: 'Rejoignez des milliers de clients satisfaits et trouvez le prestataire parfait aujourd\'hui',
            createAccount: 'Créer un Compte Gratuit',
            exploreServices: 'Explorer les Services',
        },
    },
    service: {
        addToFavorites: 'Ajouter aux favoris',
        removeFromFavorites: 'Retirer des favoris',
        share: 'Partager',
        report: 'Signaler',
    },
    pricing: {
        startingAt: 'À partir de',
        deliveryTime: 'Délai de livraison',
        days: 'jours',
        contactProvider: 'Contacter le prestataire',
        orderNow: 'Commander maintenant',
        extras: 'Options supplémentaires',
        totalPrice: 'Prix total',
    },
    provider: {
        about: 'À propos du prestataire',
        rating: 'Note',
        completedOrders: 'Commandes réalisées',
        responseTime: 'Temps de réponse',
        hours: 'heures',
        languages: 'Langues',
        verified: 'Vérifié',
        contactMe: 'Me contacter',
    },
    reviews: {
        title: 'Avis clients',
        noReviews: 'Aucun avis pour le moment',
        averageRating: 'Note moyenne',
        totalReviews: 'avis',
        writeReview: 'Écrire un avis',
        helpful: 'Utile',
    },
    similar: {
        title: 'Services similaires',
        viewAll: 'Voir tout',
    },
    serviceCard: {
        provider: 'Prestataire',
        popular: 'Populaire',
        startingAt: 'À partir de',
        days: 'j',
        discover: 'Découvrir',
    },
    explorer: {
        badge: 'Explorer',
        hero: {
            title: 'Découvrez des Services',
            titleHighlight: 'Professionnels',
            subtitle: 'Trouvez le service parfait pour votre projet parmi notre catalogue',
            searchPlaceholder: 'Rechercher un service, une compétence...',
        },
        stats: {
            services: 'Services',
            categories: 'Catégories',
            experts: 'Experts',
        },
        filters: {
            all: 'Tous',
            more: 'Plus',
            category: 'Catégorie',
            search: 'Recherche',
            clearAll: 'Tout effacer',
        },
        sort: {
            popular: 'Les plus populaires',
            recent: 'Les plus récents',
            priceAsc: 'Prix croissant',
            priceDesc: 'Prix décroissant',
            rating: 'Meilleure note',
        },
        results: {
            allServices: 'Tous les services',
            resultsFor: 'Résultats pour',
            result: 'résultat',
            results: 'résultats',
        },
        trending: {
            title: '🔥 Tendances du moment',
            subtitle: 'Les services les plus recherchés cette semaine',
        },
        noResults: {
            title: 'Aucun service trouvé',
            subtitle: 'Essayez de modifier vos critères de recherche',
            subtitleEmpty: 'Aucun service disponible pour le moment',
            resetFilters: 'Réinitialiser les filtres',
        },
        pagination: {
            previous: 'Précédent',
            next: 'Suivant',
        },
        categories: {
            badge: 'Toutes les catégories',
            title: 'Explorez par Catégorie',
            subtitle: 'Trouvez rapidement ce que vous cherchez',
            servicesCount: 'services',
        },
        errors: {
            loadingError: 'Erreur de chargement',
            retry: 'Réessayer',
        },
    },
    common: {
        loading: 'Chargement...',
        error: 'Une erreur est survenue',
        retry: 'Réessayer',
        cancel: 'Annuler',
        confirm: 'Confirmer',
    },
};

/**
 * Hook sûr pour utiliser le contexte de langue
 * Fonctionne avec ou sans LanguageProvider
 */
export function useSafeLanguage() {
    // Utiliser le contexte de manière sûre (ne lance pas d'erreur)
    const context = useLanguageContextSafe();

    // Si le contexte existe, l'utiliser
    if (context) {
        return {
            language: context.language,
            setLanguage: context.changeLanguage,
            t: context.t,
            getText: context.getText,
        };
    }

    // Sinon, retourner des valeurs par défaut
    return {
        language: 'fr' as const,
        setLanguage: () => { },
        t: defaultTranslations as any,
        getText: (obj: any) => {
            if (typeof obj === 'string') return obj;
            return obj?.fr || obj?.en || obj?.es || '';
        },
    };
}
