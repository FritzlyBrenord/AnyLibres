// ============================================================================
// i18n: Translations for Service Detail Page
// ============================================================================

export type Language = 'fr' | 'en' | 'es';

export const translations = {
  fr: {
    // Navigation
    navigation: {
      explore: 'Explorer',
      about: 'À propos',
      login: 'Connexion',
      register: "S'inscrire",
    },
    // Home Page
    home: {
      // Hero Section
      hero: {
        badge: 'Plateforme #1 en Haïti',
        title: 'Trouvez le Prestataire',
        titleHighlight: 'Parfait pour Votre Projet',
        subtitle: 'Des milliers de professionnels qualifiés prêts à réaliser vos projets.',
        subtitleHighlight: 'Qualité garantie',
        subtitleEnd: ', paiement sécurisé.',
        searchPlaceholder: 'Logo, site web, marketing...',
        searchButton: 'Rechercher',
        popularLabel: 'Populaires:',
        popularTags: ['Logo Design', 'Site Web', 'SEO', 'Vidéo'],
      },
      // Statistics
      stats: {
        projects: 'Projets',
        experts: 'Experts',
        satisfied: 'Satisfaits',
      },
      // Categories Section
      categories: {
        badge: 'Nos Catégories',
        title: 'Explorez par Catégorie',
        subtitle: 'Des services pour tous vos besoins professionnels',
        servicesCount: 'services',
      },
      // Popular Services Section
      popularServices: {
        badge: 'Tendances',
        title: 'Services Populaires',
        subtitle: 'Les services les plus demandés par nos clients',
        viewAll: 'Voir tout',
        viewAllServices: 'Voir tous les services',
      },
      // Top Providers Section
      topProviders: {
        badge: 'Excellence',
        title: 'Prestataires',
        titleHighlight: "d'Excellence",
        subtitle: 'Collaborez avec nos professionnels les plus talentueux et expérimentés de la plateforme',
        viewAll: 'Découvrir Tous les Prestataires',
      },
      // Trust Section
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
      // FAQ Section
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
      // CTA Section
      cta: {
        badge: 'Commencez maintenant',
        title: 'Prêt à Démarrer Votre Projet ?',
        subtitle: 'Rejoignez des milliers de clients satisfaits et trouvez le prestataire parfait aujourd\'hui',
        createAccount: 'Créer un Compte Gratuit',
        exploreServices: 'Explorer les Services',
      },
    },
    // Service Header
    service: {
      addToFavorites: 'Ajouter aux favoris',
      removeFromFavorites: 'Retirer des favoris',
      share: 'Partager',
      report: 'Signaler',
    },
    // Service Detail Page
    serviceDetail: {
      loading: {
        title: 'Chargement du service...',
        subtitle: 'Préparation de l\'expérience premium',
      },
      error: {
        title: 'Service non disponible',
        back: 'Retour',
        explore: 'Explorer',
      },
      header: {
        back: 'Retour',
        service: 'Service',
        addToFavorites: 'Ajouter aux favoris',
        removeFromFavorites: 'Retirer des favoris',
      },
      hero: {
        reviews: 'avis',
        popular: 'Populaire',
        delivery: 'Livraison:',
        days: 'j',
        revisions: 'révisions incluses',
        views: 'vues',
      },
      sections: {
        description: 'Description du Service',
        guarantees: 'Garanties incluses',
        similarServices: 'Services Similaires',
        similarSubtitle: 'Découvrez d\'autres services exceptionnels qui pourraient vous intéresser',
      },
      guarantees: {
        verified: 'Service professionnel vérifié',
        secure: 'Paiement sécurisé',
        satisfaction: 'Satisfaction garantie',
        support: 'Support client 24/7',
      },
    },
    // Pricing
    pricing: {
      startingAt: 'À partir de',
      deliveryTime: 'Délai de livraison',
      days: 'jours',
      contactProvider: 'Contacter le prestataire',
      orderNow: 'Commander maintenant',
      extras: 'Options supplémentaires',
      totalPrice: 'Prix total',
    },
    // Provider
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
    // Reviews
    reviews: {
      title: 'Avis clients',
      noReviews: 'Aucun avis pour le moment',
      averageRating: 'Note moyenne',
      totalReviews: 'avis',
      writeReview: 'Écrire un avis',
      helpful: 'Utile',
    },
    // Similar Services
    similar: {
      title: 'Services similaires',
      viewAll: 'Voir tout',
    },
    // Common
    common: {
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      retry: 'Réessayer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
    },
    // Translation Indicator
    translation: {
      inProgress: 'Traduction en cours...',
      element: 'élément',
      elements: 'éléments',
      inProgressCount: 'en cours',
      completed: 'Traduction terminée',
      completedSuccess: 'Contenu traduit avec succès',
      error: 'Erreur de traduction',
      errorMessage: 'Vérifiez votre connexion',
    },
    // Service Card
    serviceCard: {
      popular: 'Populaire',
      provider: 'Prestataire',
      startingAt: 'À partir de',
      discover: 'Découvrir',
      days: 'j',
    },
    // Explorer Page
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
    // About Page
    about: {
      hero: {
        badge: 'Notre Histoire',
        title: 'Connecter les Talents avec les',
        titleHighlight: 'Opportunités',
        subtitle: 'AnyLibre est la première plateforme haïtienne dédiée à connecter les entreprises avec les meilleurs freelances et professionnels indépendants.',
        stats: {
          founded: 'Fondation',
          freelances: 'Freelances',
          projects: 'Projets réalisés',
        },
      },
      story: {
        badge: 'Notre Origine',
        title: 'Une Vision pour Transformer le Marché du Travail en Haïti',
        paragraph1: 'Fondée en 2023, AnyLibre est née d\'une vision simple mais puissante : démocratiser l\'accès aux opportunités professionnelles en Haïti et créer un écosystème où le talent rencontre l\'opportunité.',
        paragraph2: 'Dans un monde de plus en plus digitalisé, nous avons constaté que de nombreux professionnels talentueux haïtiens peinaient à trouver des clients, tandis que les entreprises cherchaient désespérément des experts qualifiés.',
        paragraph3: 'Aujourd\'hui, AnyLibre est devenue la plateforme de référence, connectant des milliers de freelances avec des entreprises locales et internationales, facilitant plus de 10 000 projets réussis.',
        highlights: {
          verified: {
            title: 'Vérifiés',
            desc: 'Tous nos freelances',
          },
          secure: {
            title: 'Sécurisé',
            desc: 'Paiements 100%',
          },
        },
        teamPhoto: 'Team Photo',
        satisfaction: 'Satisfaction',
      },
      mission: {
        badge: 'Notre Raison d\'Être',
        title: 'Mission & Vision',
        missionTitle: 'Notre Mission',
        missionText: 'Démocratiser l\'accès aux opportunités professionnelles en connectant les talents haïtiens avec des clients du monde entier. Nous créons un écosystème transparent, sécurisé et équitable où chacun peut réussir.',
        visionTitle: 'Notre Vision',
        visionText: 'Devenir la plateforme de référence en Haïti et dans la Caraïbe pour le travail indépendant, en permettant à chaque professionnel de vivre de sa passion et à chaque entreprise de trouver les meilleurs talents.',
      },
      values: {
        badge: 'Ce Qui Nous Guide',
        title: 'Nos Valeurs Fondamentales',
        subtitle: 'Des principes qui définissent notre culture et guident chacune de nos actions',
        items: [
          {
            title: 'Confiance',
            desc: 'Nous bâtissons des relations basées sur la transparence et l\'intégrité',
          },
          {
            title: 'Communauté',
            desc: 'Nous créons un environnement où chacun peut s\'épanouir et réussir',
          },
          {
            title: 'Innovation',
            desc: 'Nous repoussons constamment les limites pour offrir le meilleur',
          },
          {
            title: 'Excellence',
            desc: 'Nous visons l\'excellence dans tout ce que nous faisons',
          },
        ],
      },
      stats: {
        title: 'AnyLibre en Chiffres',
        subtitle: 'Des résultats qui parlent d\'eux-mêmes',
        items: [
          { label: 'Freelances Actifs' },
          { label: 'Entreprises Clientes' },
          { label: 'Projets Réalisés' },
          { label: 'Note Moyenne' },
        ],
      },
      team: {
        badge: 'Notre Équipe',
        title: 'Les Visages Derrière AnyLibre',
        subtitle: 'Une équipe passionnée et dévouée à votre succès',
        members: [
          {
            role: 'CEO & Co-Fondateur',
            desc: '15 ans d\'expérience en tech',
          },
          {
            role: 'CTO & Co-Fondatrice',
            desc: 'Experte en développement',
          },
          {
            role: 'Head of Community',
            desc: 'Passionné par les relations',
          },
        ],
      },
      testimonials: {
        badge: 'Témoignages',
        title: 'Ce Que Disent Nos Utilisateurs',
        items: [
          {
            role: 'Designer Graphique',
            text: 'AnyLibre a transformé ma carrière. J\'ai trouvé des clients incroyables et je peux enfin vivre de ma passion.',
          },
          {
            role: 'CEO, TechStart',
            text: 'La meilleure plateforme pour trouver des talents. J\'ai embauché 5 freelances et tous ont dépassé mes attentes.',
          },
          {
            role: 'Développeuse Web',
            text: 'Interface intuitive, paiements sécurisés, support réactif. AnyLibre est vraiment professionnel.',
          },
        ],
      },
      cta: {
        title: 'Prêt à Rejoindre Notre Communauté ?',
        subtitle: 'Que vous soyez freelance ou entreprise, AnyLibre vous accompagne vers le succès',
        startButton: 'Commencer Gratuitement',
        exploreButton: 'Explorer les Services',
      },
    },
    // Auth Pages (Login & Register)
    auth: {
      login: {
        tagline: 'La plateforme qui connecte les talents aux opportunités',
        stats: {
          freelances: 'Freelances actifs',
          projects: 'Projets réalisés',
          satisfaction: 'Satisfaction client',
          successRate: 'Taux de succès',
        },
        testimonial: {
          text: 'AnyLibre m\'a permis de trouver des missions en parfait accord avec mes compétences. Interface intuitive et clients sérieux !',
          author: 'Marie L. - Designer UI/UX',
        },
        form: {
          title: 'Bon retour !',
          subtitle: 'Connectez-vous pour accéder à votre espace',
          emailLabel: 'Adresse email',
          emailPlaceholder: 'jean.dupont@example.com',
          passwordLabel: 'Mot de passe',
          passwordPlaceholder: '••••••••',
          forgotPassword: 'Mot de passe oublié ?',
          submitButton: 'Se connecter',
          submitting: 'Connexion en cours...',
          divider: 'ou',
          noAccount: 'Vous n\'avez pas de compte ?',
          createAccount: 'Créer un compte',
          successMessage: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.',
          errorGeneric: 'Une erreur est survenue',
          errorLogin: 'Une erreur est survenue lors de la connexion',
          termsText: 'En vous connectant, vous acceptez nos',
          termsLink: 'Conditions d\'utilisation',
        },
      },
      register: {
        tagline: 'Rejoignez des milliers de freelances et clients qui font confiance à AnyLibre',
        benefits: [
          {
            title: 'Inscription gratuite',
            desc: 'Créez votre compte en quelques minutes et accédez à toutes les fonctionnalités',
          },
          {
            title: 'Paiements sécurisés',
            desc: 'Vos transactions sont protégées avec notre système de paiement sécurisé',
          },
          {
            title: 'Support 24/7',
            desc: 'Notre équipe est disponible pour vous accompagner à tout moment',
          },
          {
            title: 'Projets variés',
            desc: 'Accédez à des milliers de projets dans tous les domaines',
          },
        ],
        stats: {
          freelances: 'Freelances',
          projects: 'Projets',
          satisfaction: 'Satisfaction',
        },
        form: {
          title: 'Créer un compte',
          subtitle: 'Rejoignez AnyLibre dès aujourd\'hui',
          firstNameLabel: 'Prénom',
          firstNamePlaceholder: 'Jean',
          lastNameLabel: 'Nom',
          lastNamePlaceholder: 'Dupont',
          emailLabel: 'Adresse email',
          emailPlaceholder: 'jean.dupont@example.com',
          passwordLabel: 'Mot de passe',
          passwordPlaceholder: '••••••••',
          passwordHint: 'Minimum 8 caractères',
          confirmPasswordLabel: 'Confirmer le mot de passe',
          confirmPasswordPlaceholder: '••••••••',
          submitButton: 'S\'inscrire',
          submitting: 'Inscription en cours...',
          divider: 'ou',
          hasAccount: 'Vous avez déjà un compte ?',
          loginLink: 'Se connecter',
          errorGeneric: 'Une erreur est survenue',
          errorRegister: 'Une erreur est survenue lors de l\'inscription',
          termsText: 'En créant un compte, vous acceptez nos',
          termsLink: 'Conditions d\'utilisation',
          andText: 'et notre',
          privacyLink: 'Politique de confidentialité',
        },
      },
    },
    // Provider Card
    providerCard: {
      provider: 'Prestataire',
      orders: 'commandes',
    },
    // Footer
    footer: {
      tagline: 'La plateforme premium qui connecte clients et prestataires de qualité. Des milliers de professionnels talentueux pour réaliser vos projets.',
      services: {
        title: 'Services',
        allCategories: 'Toutes les catégories',
        searchService: 'Rechercher un service',
        findProvider: 'Trouver un prestataire',
        becomeProvider: 'Devenir prestataire',
      },
      support: {
        title: 'Support',
        about: 'À propos',
        faq: 'FAQ',
        contact: 'Contact',
        helpCenter: "Centre d'aide",
      },
      legal: {
        title: 'Légal',
        terms: "Conditions d'utilisation",
        privacy: 'Politique de confidentialité',
        cookies: 'Cookies',
        security: 'Sécurité',
      },
      newsletter: {
        title: 'Restez informé',
        subtitle: 'Recevez les dernières actualités et offres exclusives.',
        placeholder: 'Votre email',
        subscribe: "S'abonner",
      },
      bottom: {
        rights: 'Tous droits réservés.',
        madeWith: 'Fait avec',
        in: 'en Haïti',
        sitemap: 'Plan du site',
        accessibility: 'Accessibilité',
      },
    },
  },
  en: {
    // Navigation
    navigation: {
      explore: 'Explore',
      about: 'About',
      login: 'Login',
      register: 'Sign Up',
    },
    // Home Page
    home: {
      // Hero Section
      hero: {
        badge: '#1 Platform in Haiti',
        title: 'Find the Perfect',
        titleHighlight: 'Provider for Your Project',
        subtitle: 'Thousands of qualified professionals ready to bring your projects to life.',
        subtitleHighlight: 'Quality guaranteed',
        subtitleEnd: ', secure payment.',
        searchPlaceholder: 'Logo, website, marketing...',
        searchButton: 'Search',
        popularLabel: 'Popular:',
        popularTags: ['Logo Design', 'Website', 'SEO', 'Video'],
      },
      // Statistics
      stats: {
        projects: 'Projects',
        experts: 'Experts',
        satisfied: 'Satisfied',
      },
      // Categories Section
      categories: {
        badge: 'Our Categories',
        title: 'Explore by Category',
        subtitle: 'Services for all your professional needs',
        servicesCount: 'services',
      },
      // Popular Services Section
      popularServices: {
        badge: 'Trending',
        title: 'Popular Services',
        subtitle: 'The most requested services by our clients',
        viewAll: 'View all',
        viewAllServices: 'View all services',
      },
      // Top Providers Section
      topProviders: {
        badge: 'Excellence',
        title: 'Providers of',
        titleHighlight: 'Excellence',
        subtitle: 'Collaborate with our most talented and experienced professionals on the platform',
        viewAll: 'Discover All Providers',
      },
      // Trust Section
      trust: {
        badge: 'Our guarantees',
        title: 'Why Choose AnyLibre?',
        subtitle: 'A trusted platform for all your projects',
        securePayment: {
          title: 'Secure Payment',
          description: '100% secure transactions with buyer protection',
        },
        verifiedProviders: {
          title: 'Verified Providers',
          description: 'All our providers are verified and qualified',
        },
        support247: {
          title: '24/7 Support',
          description: 'Our team is available at any time to help you',
        },
        qualityGuarantee: {
          title: 'Quality Guarantee',
          description: 'Satisfaction guaranteed or full refund',
        },
      },
      // FAQ Section
      faq: {
        badge: 'FAQ',
        title: 'Frequently Asked Questions',
        viewAll: 'View all questions',
        questions: [
          {
            q: 'How does AnyLibre work?',
            a: 'AnyLibre connects clients and service providers. Browse services, choose the one that suits you, place an order and collaborate directly with the provider.',
          },
          {
            q: 'Are payments secure?',
            a: 'Yes, all payments are secured via Stripe. Your money is protected until you confirm the delivery of the service.',
          },
          {
            q: 'Can I cancel an order?',
            a: 'Yes, you can cancel an order before it is accepted by the provider. Once accepted, contact the provider to discuss.',
          },
          {
            q: 'How to become a provider?',
            a: 'Create an account, complete your profile, add your services and start receiving orders. It\'s simple and free.',
          },
        ],
      },
      // CTA Section
      cta: {
        badge: 'Start now',
        title: 'Ready to Start Your Project?',
        subtitle: 'Join thousands of satisfied clients and find the perfect provider today',
        createAccount: 'Create a Free Account',
        exploreServices: 'Explore Services',
      },
    },
    service: {
      addToFavorites: 'Add to favorites',
      removeFromFavorites: 'Remove from favorites',
      share: 'Share',
      report: 'Report',
    },
    // Service Detail Page
    serviceDetail: {
      loading: {
        title: 'Loading service...',
        subtitle: 'Preparing the premium experience',
      },
      error: {
        title: 'Service unavailable',
        back: 'Back',
        explore: 'Explore',
      },
      header: {
        back: 'Back',
        service: 'Service',
        addToFavorites: 'Add to favorites',
        removeFromFavorites: 'Remove from favorites',
      },
      hero: {
        reviews: 'reviews',
        popular: 'Popular',
        delivery: 'Delivery:',
        days: 'd',
        revisions: 'revisions included',
        views: 'views',
      },
      sections: {
        description: 'Service Description',
        guarantees: 'Included Guarantees',
        similarServices: 'Similar Services',
        similarSubtitle: 'Discover other exceptional services that might interest you',
      },
      guarantees: {
        verified: 'Verified professional service',
        secure: 'Secure payment',
        satisfaction: 'Satisfaction guaranteed',
        support: '24/7 customer support',
      },
    },
    pricing: {
      startingAt: 'Starting at',
      deliveryTime: 'Delivery time',
      days: 'days',
      contactProvider: 'Contact provider',
      orderNow: 'Order now',
      extras: 'Additional options',
      totalPrice: 'Total price',
    },
    provider: {
      about: 'About the provider',
      rating: 'Rating',
      completedOrders: 'Completed orders',
      responseTime: 'Response time',
      hours: 'hours',
      languages: 'Languages',
      verified: 'Verified',
      contactMe: 'Contact me',
    },
    reviews: {
      title: 'Customer reviews',
      noReviews: 'No reviews yet',
      averageRating: 'Average rating',
      totalReviews: 'reviews',
      writeReview: 'Write a review',
      helpful: 'Helpful',
    },
    similar: {
      title: 'Similar services',
      viewAll: 'View all',
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      cancel: 'Cancel',
      confirm: 'Confirm',
    },
    // Translation Indicator
    translation: {
      inProgress: 'Translation in progress...',
      element: 'item',
      elements: 'items',
      inProgressCount: 'in progress',
      completed: 'Translation completed',
      completedSuccess: 'Content translated successfully',
      error: 'Translation error',
      errorMessage: 'Check your connection',
    },
    // Service Card
    serviceCard: {
      popular: 'Popular',
      provider: 'Provider',
      startingAt: 'Starting at',
      discover: 'Discover',
      days: 'd',
    },
    // Explorer Page
    explorer: {
      badge: 'Explore',
      hero: {
        title: 'Discover Professional',
        titleHighlight: 'Services',
        subtitle: 'Find the perfect service for your project from our catalog',
        searchPlaceholder: 'Search for a service, skill...',
      },
      stats: {
        services: 'Services',
        categories: 'Categories',
        experts: 'Experts',
      },
      filters: {
        all: 'All',
        more: 'More',
        category: 'Category',
        search: 'Search',
        clearAll: 'Clear all',
      },
      sort: {
        popular: 'Most popular',
        recent: 'Most recent',
        priceAsc: 'Price ascending',
        priceDesc: 'Price descending',
        rating: 'Best rating',
      },
      results: {
        allServices: 'All services',
        resultsFor: 'Results for',
        result: 'result',
        results: 'results',
      },
      trending: {
        title: '🔥 Trending now',
        subtitle: 'The most searched services this week',
      },
      noResults: {
        title: 'No services found',
        subtitle: 'Try modifying your search criteria',
        subtitleEmpty: 'No services available at the moment',
        resetFilters: 'Reset filters',
      },
      pagination: {
        previous: 'Previous',
        next: 'Next',
      },
      categories: {
        badge: 'All categories',
        title: 'Explore by Category',
        subtitle: 'Quickly find what you are looking for',
        servicesCount: 'services',
      },
      errors: {
        loadingError: 'Loading error',
        retry: 'Retry',
      },
    },
    // About Page
    about: {
      hero: {
        badge: 'Our Story',
        title: 'Connecting Talents with',
        titleHighlight: 'Opportunities',
        subtitle: 'AnyLibre is the first Haitian platform dedicated to connecting businesses with the best freelancers and independent professionals.',
        stats: {
          founded: 'Founded',
          freelances: 'Freelancers',
          projects: 'Completed Projects',
        },
      },
      story: {
        badge: 'Our Origin',
        title: 'A Vision to Transform the Labor Market in Haiti',
        paragraph1: 'Founded in 2023, AnyLibre was born from a simple but powerful vision: to democratize access to professional opportunities in Haiti and create an ecosystem where talent meets opportunity.',
        paragraph2: 'In an increasingly digitalized world, we noticed that many talented Haitian professionals struggled to find clients, while businesses desperately sought qualified experts.',
        paragraph3: 'Today, AnyLibre has become the reference platform, connecting thousands of freelancers with local and international companies, facilitating over 10,000 successful projects.',
        highlights: {
          verified: {
            title: 'Verified',
            desc: 'All our freelancers',
          },
          secure: {
            title: 'Secure',
            desc: '100% Payments',
          },
        },
        teamPhoto: 'Team Photo',
        satisfaction: 'Satisfaction',
      },
      mission: {
        badge: 'Our Purpose',
        title: 'Mission & Vision',
        missionTitle: 'Our Mission',
        missionText: 'To democratize access to professional opportunities by connecting Haitian talents with clients worldwide. We create a transparent, secure, and fair ecosystem where everyone can succeed.',
        visionTitle: 'Our Vision',
        visionText: 'To become the reference platform in Haiti and the Caribbean for independent work, enabling every professional to live from their passion and every business to find the best talents.',
      },
      values: {
        badge: 'What Guides Us',
        title: 'Our Core Values',
        subtitle: 'Principles that define our culture and guide all our actions',
        items: [
          {
            title: 'Trust',
            desc: 'We build relationships based on transparency and integrity',
          },
          {
            title: 'Community',
            desc: 'We create an environment where everyone can thrive and succeed',
          },
          {
            title: 'Innovation',
            desc: 'We constantly push boundaries to offer the best',
          },
          {
            title: 'Excellence',
            desc: 'We aim for excellence in everything we do',
          },
        ],
      },
      stats: {
        title: 'AnyLibre in Numbers',
        subtitle: 'Results that speak for themselves',
        items: [
          { label: 'Active Freelancers' },
          { label: 'Client Companies' },
          { label: 'Completed Projects' },
          { label: 'Average Rating' },
        ],
      },
      team: {
        badge: 'Our Team',
        title: 'The Faces Behind AnyLibre',
        subtitle: 'A passionate team dedicated to your success',
        members: [
          {
            role: 'CEO & Co-Founder',
            desc: '15 years of tech experience',
          },
          {
            role: 'CTO & Co-Founder',
            desc: 'Development expert',
          },
          {
            role: 'Head of Community',
            desc: 'Passionate about relationships',
          },
        ],
      },
      testimonials: {
        badge: 'Testimonials',
        title: 'What Our Users Say',
        items: [
          {
            role: 'Graphic Designer',
            text: 'AnyLibre transformed my career. I found incredible clients and can finally live from my passion.',
          },
          {
            role: 'CEO, TechStart',
            text: 'The best platform to find talents. I hired 5 freelancers and all exceeded my expectations.',
          },
          {
            role: 'Web Developer',
            text: 'Intuitive interface, secure payments, responsive support. AnyLibre is truly professional.',
          },
        ],
      },
      cta: {
        title: 'Ready to Join Our Community?',
        subtitle: 'Whether you\'re a freelancer or a business, AnyLibre supports you towards success',
        startButton: 'Start Free',
        exploreButton: 'Explore Services',
      },
    },
    // Auth Pages (Login & Register)
    auth: {
      login: {
        tagline: 'The platform connecting talents with opportunities',
        stats: {
          freelances: 'Active Freelancers',
          projects: 'Completed Projects',
          satisfaction: 'Client Satisfaction',
          successRate: 'Success Rate',
        },
        testimonial: {
          text: 'AnyLibre helped me find missions perfectly matching my skills. Intuitive interface and serious clients!',
          author: 'Marie L. - UI/UX Designer',
        },
        form: {
          title: 'Welcome back!',
          subtitle: 'Sign in to access your space',
          emailLabel: 'Email address',
          emailPlaceholder: 'john.doe@example.com',
          passwordLabel: 'Password',
          passwordPlaceholder: '••••••••',
          forgotPassword: 'Forgot password?',
          submitButton: 'Sign in',
          submitting: 'Signing in...',
          divider: 'or',
          noAccount: 'Don\'t have an account?',
          createAccount: 'Create account',
          successMessage: 'Account created successfully! You can now sign in.',
          errorGeneric: 'An error occurred',
          errorLogin: 'An error occurred during login',
          termsText: 'By signing in, you accept our',
          termsLink: 'Terms of Service',
        },
      },
      register: {
        tagline: 'Join thousands of freelancers and clients who trust AnyLibre',
        benefits: [
          {
            title: 'Free registration',
            desc: 'Create your account in minutes and access all features',
          },
          {
            title: 'Secure payments',
            desc: 'Your transactions are protected with our secure payment system',
          },
          {
            title: '24/7 Support',
            desc: 'Our team is available to assist you at any time',
          },
          {
            title: 'Varied projects',
            desc: 'Access thousands of projects in all fields',
          },
        ],
        stats: {
          freelances: 'Freelancers',
          projects: 'Projects',
          satisfaction: 'Satisfaction',
        },
        form: {
          title: 'Create an account',
          subtitle: 'Join AnyLibre today',
          firstNameLabel: 'First name',
          firstNamePlaceholder: 'John',
          lastNameLabel: 'Last name',
          lastNamePlaceholder: 'Doe',
          emailLabel: 'Email address',
          emailPlaceholder: 'john.doe@example.com',
          passwordLabel: 'Password',
          passwordPlaceholder: '••••••••',
          passwordHint: 'Minimum 8 characters',
          confirmPasswordLabel: 'Confirm password',
          confirmPasswordPlaceholder: '••••••••',
          submitButton: 'Sign up',
          submitting: 'Signing up...',
          divider: 'or',
          hasAccount: 'Already have an account?',
          loginLink: 'Sign in',
          errorGeneric: 'An error occurred',
          errorRegister: 'An error occurred during registration',
          termsText: 'By creating an account, you accept our',
          termsLink: 'Terms of Service',
          andText: 'and our',
          privacyLink: 'Privacy Policy',
        },
      },
    },
    // Provider Card
    providerCard: {
      provider: 'Provider',
      orders: 'orders',
    },
    // Footer
    footer: {
      tagline: 'The premium platform connecting clients and quality service providers. Thousands of talented professionals to bring your projects to life.',
      services: {
        title: 'Services',
        allCategories: 'All categories',
        searchService: 'Search for a service',
        findProvider: 'Find a provider',
        becomeProvider: 'Become a provider',
      },
      support: {
        title: 'Support',
        about: 'About',
        faq: 'FAQ',
        contact: 'Contact',
        helpCenter: 'Help Center',
      },
      legal: {
        title: 'Legal',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy',
        cookies: 'Cookies',
        security: 'Security',
      },
      newsletter: {
        title: 'Stay informed',
        subtitle: 'Receive the latest news and exclusive offers.',
        placeholder: 'Your email',
        subscribe: 'Subscribe',
      },
      bottom: {
        rights: 'All rights reserved.',
        madeWith: 'Made with',
        in: 'in Haiti',
        sitemap: 'Sitemap',
        accessibility: 'Accessibility',
      },
    },
  },
  es: {
    // Navigation
    navigation: {
      explore: 'Explorar',
      about: 'Acerca de',
      login: 'Iniciar sesión',
      register: 'Registrarse',
    },
    // Home Page
    home: {
      // Hero Section
      hero: {
        badge: 'Plataforma #1 en Haití',
        title: 'Encuentra el Proveedor',
        titleHighlight: 'Perfecto para Tu Proyecto',
        subtitle: 'Miles de profesionales calificados listos para realizar tus proyectos.',
        subtitleHighlight: 'Calidad garantizada',
        subtitleEnd: ', pago seguro.',
        searchPlaceholder: 'Logo, sitio web, marketing...',
        searchButton: 'Buscar',
        popularLabel: 'Populares:',
        popularTags: ['Diseño de Logo', 'Sitio Web', 'SEO', 'Video'],
      },
      // Statistics
      stats: {
        projects: 'Proyectos',
        experts: 'Expertos',
        satisfied: 'Satisfechos',
      },
      // Categories Section
      categories: {
        badge: 'Nuestras Categorías',
        title: 'Explorar por Categoría',
        subtitle: 'Servicios para todas tus necesidades profesionales',
        servicesCount: 'servicios',
      },
      // Popular Services Section
      popularServices: {
        badge: 'Tendencias',
        title: 'Servicios Populares',
        subtitle: 'Los servicios más solicitados por nuestros clientes',
        viewAll: 'Ver todo',
        viewAllServices: 'Ver todos los servicios',
      },
      // Top Providers Section
      topProviders: {
        badge: 'Excelencia',
        title: 'Proveedores de',
        titleHighlight: 'Excelencia',
        subtitle: 'Colabora con nuestros profesionales más talentosos y experimentados de la plataforma',
        viewAll: 'Descubrir Todos los Proveedores',
      },
      // Trust Section
      trust: {
        badge: 'Nuestras garantías',
        title: '¿Por Qué Elegir AnyLibre?',
        subtitle: 'Una plataforma de confianza para todos tus proyectos',
        securePayment: {
          title: 'Pago Seguro',
          description: 'Transacciones 100% seguras con protección al comprador',
        },
        verifiedProviders: {
          title: 'Proveedores Verificados',
          description: 'Todos nuestros proveedores están verificados y calificados',
        },
        support247: {
          title: 'Soporte 24/7',
          description: 'Nuestro equipo está disponible en cualquier momento para ayudarte',
        },
        qualityGuarantee: {
          title: 'Garantía de Calidad',
          description: 'Satisfacción garantizada o reembolso completo',
        },
      },
      // FAQ Section
      faq: {
        badge: 'FAQ',
        title: 'Preguntas Frecuentes',
        viewAll: 'Ver todas las preguntas',
        questions: [
          {
            q: '¿Cómo funciona AnyLibre?',
            a: 'AnyLibre conecta clientes y proveedores de servicios. Navega por los servicios, elige el que te convenga, realiza un pedido y colabora directamente con el proveedor.',
          },
          {
            q: '¿Los pagos son seguros?',
            a: 'Sí, todos los pagos están asegurados a través de Stripe. Tu dinero está protegido hasta que confirmes la entrega del servicio.',
          },
          {
            q: '¿Puedo cancelar un pedido?',
            a: 'Sí, puedes cancelar un pedido antes de que sea aceptado por el proveedor. Una vez aceptado, contacta al proveedor para discutir.',
          },
          {
            q: '¿Cómo convertirse en proveedor?',
            a: 'Crea una cuenta, completa tu perfil, agrega tus servicios y comienza a recibir pedidos. Es simple y gratuito.',
          },
        ],
      },
      // CTA Section
      cta: {
        badge: 'Comienza ahora',
        title: '¿Listo para Comenzar Tu Proyecto?',
        subtitle: 'Únete a miles de clientes satisfechos y encuentra el proveedor perfecto hoy',
        createAccount: 'Crear una Cuenta Gratuita',
        exploreServices: 'Explorar Servicios',
      },
    },
    service: {
      addToFavorites: 'Añadir a favoritos',
      removeFromFavorites: 'Eliminar de favoritos',
      share: 'Compartir',
      report: 'Reportar',
    },
    // Service Detail Page
    serviceDetail: {
      loading: {
        title: 'Cargando servicio...',
        subtitle: 'Preparando la experiencia premium',
      },
      error: {
        title: 'Servicio no disponible',
        back: 'Volver',
        explore: 'Explorar',
      },
      header: {
        back: 'Volver',
        service: 'Servicio',
        addToFavorites: 'Añadir a favoritos',
        removeFromFavorites: 'Eliminar de favoritos',
      },
      hero: {
        reviews: 'opiniones',
        popular: 'Popular',
        delivery: 'Entrega:',
        days: 'd',
        revisions: 'revisiones incluidas',
        views: 'vistas',
      },
      sections: {
        description: 'Descripción del Servicio',
        guarantees: 'Garantías Incluidas',
        similarServices: 'Servicios Similares',
        similarSubtitle: 'Descubre otros servicios excepcionales que podrían interesarte',
      },
      guarantees: {
        verified: 'Servicio profesional verificado',
        secure: 'Pago seguro',
        satisfaction: 'Satisfacción garantizada',
        support: 'Soporte al cliente 24/7',
      },
    },
    pricing: {
      startingAt: 'Desde',
      deliveryTime: 'Tiempo de entrega',
      days: 'días',
      contactProvider: 'Contactar proveedor',
      orderNow: 'Ordenar ahora',
      extras: 'Opciones adicionales',
      totalPrice: 'Precio total',
    },
    provider: {
      about: 'Acerca del proveedor',
      rating: 'Calificación',
      completedOrders: 'Pedidos completados',
      responseTime: 'Tiempo de respuesta',
      hours: 'horas',
      languages: 'Idiomas',
      verified: 'Verificado',
      contactMe: 'Contáctame',
    },
    reviews: {
      title: 'Opiniones de clientes',
      noReviews: 'Sin opiniones aún',
      averageRating: 'Calificación promedio',
      totalReviews: 'opiniones',
      writeReview: 'Escribir una opinión',
      helpful: 'Útil',
    },
    similar: {
      title: 'Servicios similares',
      viewAll: 'Ver todo',
    },
    common: {
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
    },
    // Translation Indicator
    translation: {
      inProgress: 'Traducción en curso...',
      element: 'elemento',
      elements: 'elementos',
      inProgressCount: 'en curso',
      completed: 'Traducción completada',
      completedSuccess: 'Contenido traducido con éxito',
      error: 'Error de traducción',
      errorMessage: 'Verifica tu conexión',
    },
    // Service Card
    serviceCard: {
      popular: 'Popular',
      provider: 'Proveedor',
      startingAt: 'Desde',
      discover: 'Descubrir',
      days: 'd',
    },
    // Explorer Page
    explorer: {
      badge: 'Explorar',
      hero: {
        title: 'Descubre Servicios',
        titleHighlight: 'Profesionales',
        subtitle: 'Encuentra el servicio perfecto para tu proyecto en nuestro catálogo',
        searchPlaceholder: 'Buscar un servicio, habilidad...',
      },
      stats: {
        services: 'Servicios',
        categories: 'Categorías',
        experts: 'Expertos',
      },
      filters: {
        all: 'Todos',
        more: 'Más',
        category: 'Categoría',
        search: 'Búsqueda',
        clearAll: 'Borrar todo',
      },
      sort: {
        popular: 'Más populares',
        recent: 'Más recientes',
        priceAsc: 'Precio ascendente',
        priceDesc: 'Precio descendente',
        rating: 'Mejor calificación',
      },
      results: {
        allServices: 'Todos los servicios',
        resultsFor: 'Resultados para',
        result: 'resultado',
        results: 'resultados',
      },
      trending: {
        title: '🔥 Tendencias del momento',
        subtitle: 'Los servicios más buscados esta semana',
      },
      noResults: {
        title: 'No se encontraron servicios',
        subtitle: 'Intenta modificar tus criterios de búsqueda',
        subtitleEmpty: 'No hay servicios disponibles en este momento',
        resetFilters: 'Restablecer filtros',
      },
      pagination: {
        previous: 'Anterior',
        next: 'Siguiente',
      },
      categories: {
        badge: 'Todas las categorías',
        title: 'Explorar por Categoría',
        subtitle: 'Encuentra rápidamente lo que buscas',
        servicesCount: 'servicios',
      },
      errors: {
        loadingError: 'Error de carga',
        retry: 'Reintentar',
      },
    },
    // About Page
    about: {
      hero: {
        badge: 'Nuestra Historia',
        title: 'Conectando Talentos con',
        titleHighlight: 'Oportunidades',
        subtitle: 'AnyLibre es la primera plataforma haitiana dedicada a conectar empresas con los mejores freelancers y profesionales independientes.',
        stats: {
          founded: 'Fundación',
          freelances: 'Freelancers',
          projects: 'Proyectos Completados',
        },
      },
      story: {
        badge: 'Nuestro Origen',
        title: 'Una Visión para Transformar el Mercado Laboral en Haití',
        paragraph1: 'Fundada en 2023, AnyLibre nació de una visión simple pero poderosa: democratizar el acceso a oportunidades profesionales en Haití y crear un ecosistema donde el talento encuentra la oportunidad.',
        paragraph2: 'En un mundo cada vez más digitalizado, notamos que muchos profesionales talentosos haitianos luchaban por encontrar clientes, mientras que las empresas buscaban desesperadamente expertos calificados.',
        paragraph3: 'Hoy, AnyLibre se ha convertido en la plataforma de referencia, conectando miles de freelancers con empresas locales e internacionales, facilitando más de 10,000 proyectos exitosos.',
        highlights: {
          verified: {
            title: 'Verificados',
            desc: 'Todos nuestros freelancers',
          },
          secure: {
            title: 'Seguro',
            desc: 'Pagos 100%',
          },
        },
        teamPhoto: 'Foto del Equipo',
        satisfaction: 'Satisfacción',
      },
      mission: {
        badge: 'Nuestra Razón de Ser',
        title: 'Misión y Visión',
        missionTitle: 'Nuestra Misión',
        missionText: 'Democratizar el acceso a oportunidades profesionales conectando talentos haitianos con clientes de todo el mundo. Creamos un ecosistema transparente, seguro y equitativo donde todos pueden tener éxito.',
        visionTitle: 'Nuestra Visión',
        visionText: 'Convertirnos en la plataforma de referencia en Haití y el Caribe para el trabajo independiente, permitiendo que cada profesional viva de su pasión y cada empresa encuentre los mejores talentos.',
      },
      values: {
        badge: 'Lo Que Nos Guía',
        title: 'Nuestros Valores Fundamentales',
        subtitle: 'Principios que definen nuestra cultura y guían todas nuestras acciones',
        items: [
          {
            title: 'Confianza',
            desc: 'Construimos relaciones basadas en la transparencia y la integridad',
          },
          {
            title: 'Comunidad',
            desc: 'Creamos un entorno donde todos pueden prosperar y tener éxito',
          },
          {
            title: 'Innovación',
            desc: 'Constantemente empujamos los límites para ofrecer lo mejor',
          },
          {
            title: 'Excelencia',
            desc: 'Aspiramos a la excelencia en todo lo que hacemos',
          },
        ],
      },
      stats: {
        title: 'AnyLibre en Números',
        subtitle: 'Resultados que hablan por sí mismos',
        items: [
          { label: 'Freelancers Activos' },
          { label: 'Empresas Clientes' },
          { label: 'Proyectos Completados' },
          { label: 'Calificación Promedio' },
        ],
      },
      team: {
        badge: 'Nuestro Equipo',
        title: 'Los Rostros Detrás de AnyLibre',
        subtitle: 'Un equipo apasionado y dedicado a tu éxito',
        members: [
          {
            role: 'CEO y Co-Fundador',
            desc: '15 años de experiencia en tecnología',
          },
          {
            role: 'CTO y Co-Fundadora',
            desc: 'Experta en desarrollo',
          },
          {
            role: 'Jefe de Comunidad',
            desc: 'Apasionado por las relaciones',
          },
        ],
      },
      testimonials: {
        badge: 'Testimonios',
        title: 'Lo Que Dicen Nuestros Usuarios',
        items: [
          {
            role: 'Diseñadora Gráfica',
            text: 'AnyLibre transformó mi carrera. Encontré clientes increíbles y finalmente puedo vivir de mi pasión.',
          },
          {
            role: 'CEO, TechStart',
            text: 'La mejor plataforma para encontrar talentos. Contraté 5 freelancers y todos superaron mis expectativas.',
          },
          {
            role: 'Desarrolladora Web',
            text: 'Interfaz intuitiva, pagos seguros, soporte receptivo. AnyLibre es verdaderamente profesional.',
          },
        ],
      },
      cta: {
        title: '¿Listo para Unirte a Nuestra Comunidad?',
        subtitle: 'Ya seas freelancer o empresa, AnyLibre te acompaña hacia el éxito',
        startButton: 'Comenzar Gratis',
        exploreButton: 'Explorar Servicios',
      },
    },
    // Auth Pages (Login & Register)
    auth: {
      login: {
        tagline: 'La plataforma que conecta talentos con oportunidades',
        stats: {
          freelances: 'Freelancers Activos',
          projects: 'Proyectos Completados',
          satisfaction: 'Satisfacción del Cliente',
          successRate: 'Tasa de Éxito',
        },
        testimonial: {
          text: 'AnyLibre me ayudó a encontrar misiones que coinciden perfectamente con mis habilidades. ¡Interfaz intuitiva y clientes serios!',
          author: 'Marie L. - Diseñadora UI/UX',
        },
        form: {
          title: '¡Bienvenido de nuevo!',
          subtitle: 'Inicia sesión para acceder a tu espacio',
          emailLabel: 'Dirección de correo electrónico',
          emailPlaceholder: 'juan.perez@example.com',
          passwordLabel: 'Contraseña',
          passwordPlaceholder: '••••••••',
          forgotPassword: '¿Olvidaste tu contraseña?',
          submitButton: 'Iniciar sesión',
          submitting: 'Iniciando sesión...',
          divider: 'o',
          noAccount: '¿No tienes una cuenta?',
          createAccount: 'Crear cuenta',
          successMessage: '¡Cuenta creada con éxito! Ahora puedes iniciar sesión.',
          errorGeneric: 'Ocurrió un error',
          errorLogin: 'Ocurrió un error durante el inicio de sesión',
          termsText: 'Al iniciar sesión, aceptas nuestros',
          termsLink: 'Términos de Servicio',
        },
      },
      register: {
        tagline: 'Únete a miles de freelancers y clientes que confían en AnyLibre',
        benefits: [
          {
            title: 'Registro gratuito',
            desc: 'Crea tu cuenta en minutos y accede a todas las funcionalidades',
          },
          {
            title: 'Pagos seguros',
            desc: 'Tus transacciones están protegidas con nuestro sistema de pago seguro',
          },
          {
            title: 'Soporte 24/7',
            desc: 'Nuestro equipo está disponible para ayudarte en cualquier momento',
          },
          {
            title: 'Proyectos variados',
            desc: 'Accede a miles de proyectos en todos los campos',
          },
        ],
        stats: {
          freelancers: 'Freelancers',
          projects: 'Proyectos',
          satisfaction: 'Satisfacción',
        },
        form: {
          title: 'Crear una cuenta',
          subtitle: 'Únete a AnyLibre hoy',
          firstNameLabel: 'Nombre',
          firstNamePlaceholder: 'Juan',
          lastNameLabel: 'Apellido',
          lastNamePlaceholder: 'Pérez',
          emailLabel: 'Dirección de correo electrónico',
          emailPlaceholder: 'juan.perez@example.com',
          passwordLabel: 'Contraseña',
          passwordPlaceholder: '••••••••',
          passwordHint: 'Mínimo 8 caracteres',
          confirmPasswordLabel: 'Confirmar contraseña',
          confirmPasswordPlaceholder: '••••••••',
          submitButton: 'Registrarse',
          submitting: 'Registrándose...',
          divider: 'o',
          hasAccount: '¿Ya tienes una cuenta?',
          loginLink: 'Iniciar sesión',
          errorGeneric: 'Ocurrió un error',
          errorRegister: 'Ocurrió un error durante el registro',
          termsText: 'Al crear una cuenta, aceptas nuestros',
          termsLink: 'Términos de Servicio',
          andText: 'y nuestra',
          privacyLink: 'Política de Privacidad',
        },
      },
    },
    // Provider Card
    providerCard: {
      provider: 'Proveedor',
      orders: 'pedidos',
    },
    // Footer
    footer: {
      tagline: 'La plataforma premium que conecta clientes y proveedores de calidad. Miles de profesionales talentosos para realizar tus proyectos.',
      services: {
        title: 'Servicios',
        allCategories: 'Todas las categorías',
        searchService: 'Buscar un servicio',
        findProvider: 'Encontrar un proveedor',
        becomeProvider: 'Convertirse en proveedor',
      },
      support: {
        title: 'Soporte',
        about: 'Acerca de',
        faq: 'FAQ',
        contact: 'Contacto',
        helpCenter: 'Centro de ayuda',
      },
      legal: {
        title: 'Legal',
        terms: 'Términos de uso',
        privacy: 'Política de privacidad',
        cookies: 'Cookies',
        security: 'Seguridad',
      },
      newsletter: {
        title: 'Mantente informado',
        subtitle: 'Recibe las últimas noticias y ofertas exclusivas.',
        placeholder: 'Tu correo electrónico',
        subscribe: 'Suscribirse',
      },
      bottom: {
        rights: 'Todos los derechos reservados.',
        madeWith: 'Hecho con',
        in: 'en Haití',
        sitemap: 'Mapa del sitio',
        accessibility: 'Accesibilidad',
      },
    },
  },
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.fr;
}
