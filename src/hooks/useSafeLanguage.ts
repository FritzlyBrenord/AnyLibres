// ============================================================================
// Hook: useSafeLanguage - Version sûre de useLanguage
// Fonctionne avec ou sans LanguageProvider
// ============================================================================

'use client';

import { useLanguageContextSafe } from '@/contexts/LanguageContext';
import { getT } from '@/i18n/translations';

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
    serviceList: {
        title: 'My Services',
        subtitle: 'Manage and track your services',
        newService: 'New Service',
        stats: {
            total: 'Total',
            published: 'Published',
            draft: 'Drafts',
            archived: 'Archived'
        },
        filters: {
            searchPlaceholder: 'Search for a service...',
            allStatus: 'All Statuses',
            published: 'Published',
            draft: 'Drafts',
            archived: 'Archived',
            filterButton: 'Filter',
            sortBy: {
                createdAt: 'Date Created',
                price: 'Price',
                views: 'Views',
                orders: 'Orders',
                rating: 'Rating'
            }
        },
        empty: {
            title: 'No services found',
            description: 'Start by creating your first service',
            button: 'Create a Service'
        },
        table: {
            service: 'Service',
            status: 'Status',
            price: 'Price',
            actions: 'Actions'
        },
        actions: {
            view: 'View',
            edit: 'Edit',
            publish: 'Publish',
            unarchive: 'Unarchive',
            archive: 'Archive',
            duplicate: 'Duplicate',
            delete: 'Delete'
        },
        modals: {
            cancel: 'Cancel',
            delete: {
                title: 'Confirm Deletion',
                message: 'Are you sure you want to delete the service',
                warning: 'This action is irreversible and will delete all associated data.',
                confirm: 'Delete'
            },
            status: {
                published: {
                    title: 'Publish Service',
                    message: 'Are you sure you want to publish',
                    messageSuffix: '? The service will be visible to all users.',
                    confirm: 'Publish'
                },
                draft: {
                    title: 'Set to Draft',
                    message: 'Are you sure you want to set',
                    messageSuffix: 'to draft? The service will no longer be publicly visible.',
                    confirm: 'Set to Draft'
                },
                archived: {
                    title: 'Archive Service',
                    message: 'Are you sure you want to archive',
                    messageSuffix: '? The service will be hidden but can be restored.',
                    confirm: 'Archive'
                }
            }
        }
    },
    serviceAdd: {
        title: 'Créer un service',
        editTitle: 'Modifier le service',
        subtitle: '',
        editSubtitle: '',
        buttons: {
            back: 'Retour',
            saveDraft: 'Sauvegarder',
            savingDraft: 'Sauvegarde...',
            publish: 'Publier',
            update: 'Mettre à jour',
            view: 'Voir',
            returnToView: 'Retour à la vue',
            publishing: 'Publication...',
            addExtra: 'Ajouter un extra',
            add: 'Ajouter',
            chooseVideo: 'Choisir vidéo',
            chooseDocument: 'Choisir document',
            addFAQ: 'Ajouter FAQ',
            addRequirement: 'Ajouter exigence'
        },
        messages: {
            loading: 'Chargement...',
            createError: '',
            loadingCurrencies: '',
            currencyWarning: '',
            clickToUpload: '',
            videoUploadLimit: '',
            documentUploadLimit: '',
            locationDescription: '',
            wait: ''
        },
        sections: {
            generalInfo: '',
            location: '',
            pricing: '',
            extras: '',
            media: '',
            categories: '',
            faq: '',
            requirements: ''
        },
        labels: {
            serviceTitle: '',
            shortDescription: '',
            description: '',
            basePrice: '',
            currency: '',
            minPrice: '',
            maxPrice: '',
            deliveryTime: '',
            day: '',
            days: '',
            revisions: '',
            revisionsLabelSingular: '',
            revisionsLabelPlural: '',
            maxRevisions: '',
            unlimited: '',
            extraTitle: '',
            extraPrice: '',
            extraDays: '',
            coverImage: '',
            imageGallery: '',
            videoGallery: '',
            documentGallery: '',
            categories: '',
            tags: '',
            faqItem: '',
            requirementItem: '',
            remote: '',
            remoteDescription: '',
            onsite: '',
            onsiteDescription: ''
        },
        placeholders: {
            title: '',
            shortDescription: '',
            description: '',
            price: '',
            tags: ''
        },
        sidebar: {
            statusTitle: '',
            autoSave: '',
            disabled: '',
            currentStatus: '',
            createdOn: '',
            updatedOn: '',
            statusValues: {
                published: 'Publié',
                draft: 'Brouillon',
                archived: 'Archivé'
            },
            newStatus: '',
            validationTitle: '',
            validationItems: {
                title: '',
                description: '',
                price: '',
                image: '',
                category: ''
            },
            tipsTitle: '',
            tips: {
                highQuality: '',
                clearDescription: '',
                competitivePrice: '',
                realisticDeadlines: '',
                addExtras: ''
            }
        }
    },
    serviceGuidance: {
        title: { label: '', content: '', examples: [] },
        shortDescription: { label: '', content: '', examples: [] },
        description: { label: '', content: '', examples: [] },
        basePrice: { label: '', content: '', examples: [] },
        deliveryTime: { label: '', content: '', examples: [] },
        revisions: { label: '', content: '', examples: [] },
        categories: { label: '', content: '', examples: [] },
        tags: { label: '', content: '', examples: [] },
        requirements: { label: '', content: '', examples: [] },
        extras: { label: '', content: '', examples: [] },
        faq: { label: '', content: '', examples: [] },
        images: { label: '', content: '', examples: [] },
        location: { label: '', content: '', examples: [] }
    },
    serviceView: {
        loading: "Loading service...",
        notFound: {
            title: "Service not found",
            description: "The service you are looking for does not exist or you do not have access to it.",
            button: "Back to services"
        },
        header: {
            back: "Back",
            preview: "Service preview",
            edit: "Edit",
            view: "View",
            publish: "Publish",
            draft: "Draft",
            archive: "Archive",
            restore: "Restore",
            delete: "Delete"
        },
        tabs: {
            overview: "Overview",
            content: "Content",
            media: "Media"
        },
        info: {
            title: "Information",
            price: "Price",
            delivery: "Delivery",
            revisions: "Revisions",
            location: "Location",
            days: "day(s)",
            included: "included"
        },
        extra: {
            additionalDelay: "Additional delay"
        },
        sections: {
            classification: "Classification",
            categories: "Categories",
            tags: "Tags",
            dates: "Dates",
            created: "Created on",
            updated: "Updated on",
            description: "Description",
            noDescription: "No description",
            details: "Service details",
            basicInfo: "Basic information",
            basePrice: "Base price",
            deliveryTime: "Delivery time",
            revisionsIncluded: "Revisions included",
            visibility: "Visibility",
            configuration: "Configuration",
            serviceType: "Service type",
            maxRevisions: "Max revisions",
            unlimited: "Unlimited",
            displayCurrency: "Display currency",
            extras: "Extra options",
            faq: "Frequently Asked Questions",
            noFaq: "No FAQ defined",
            requirements: "Client requirements"
        },
        labels: {
            remote: "Remote",
            onsite: "On-site",
            mandatory: "Mandatory",
            days: "days"
        },
        modals: {
            status: {
                published: {
                    title: "Publish service",
                    message: "Are you sure you want to publish"
                },
                draft: {
                    title: "Move to draft",
                    message: "Are you sure you want to move"
                },
                archived: {
                    title: "Archive service",
                    message: "Are you sure you want to archive"
                }
            }
        }
    }
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
        t: getT(defaultTranslations),
        getText: (obj: any) => {
            if (typeof obj === 'string') return obj;
            return obj?.fr || obj?.en || obj?.es || '';
        },
    };
}
