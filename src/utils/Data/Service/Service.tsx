import { useMemo, useState } from "react";

export const experienceLevels: string[] = [
  "Débutant (< 1 an)",
  "Intermédiaire (1-3 ans)",
  "Confirmé (3-5 ans)",
  "Expert (5+ ans)",
];

// ============================================
// OCCUPATIONS (utilisées lors de l'inscription)
// ============================================
export const occupationCategories: { [key: string]: string[] } = {
  "Digital Marketing": [
    "Affiliate Marketing",
    "Email Marketing",
    "SEO",
    "Social Media Marketing",
    "Content Marketing",
    "PPC Advertising",
    "Marketing Strategy",
  ],
  "Graphic Design": [
    "Logo Design",
    "Brand Identity",
    "Web Design",
    "UI/UX Design",
    "Illustration",
    "Packaging Design",
    "Motion Graphics",
  ],
  "Web Development": [
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "WordPress",
    "E-commerce Development",
    "Mobile App Development",
  ],
  Writing: [
    "Content Writing",
    "Copywriting",
    "Technical Writing",
    "Translation",
    "Blog Writing",
    "SEO Writing",
    "Ghostwriting",
  ],
  Audiovisuel: [
    "Video Editing",
    "Audio Production",
    "Animation",
    "Photography",
    "Voice Over",
    "Music Production",
    "Sound Design",
  ],
  Consultation: [
    "Business Consulting",
    "HR Consulting",
    "Financial Consulting",
    "IT Consulting",
    "Marketing Consulting",
    "Strategy Consulting",
  ],
};

// ============================================
// CATÉGORIES COMPLÈTES avec métadonnées
// ============================================
export const categoriesData = {
  // ==================== PROGRAMMATION ET TECHNOLOGIE ====================
  "programmation-tech": {
    label: "Programmation et Technologie",
    subcategories: {
      "dev-web-frontend": {
        label: "Développement Frontend",
        metadata: [
          {
            id: "framework",
            label: "Framework/Librairie",
            type: "multiselect",
            required: true,
            options: [
              { value: "react", label: "React" },
              { value: "vue", label: "Vue.js" },
              { value: "angular", label: "Angular" },
              { value: "nextjs", label: "Next.js" },
              { value: "nuxt", label: "Nuxt.js" },
              { value: "svelte", label: "Svelte" },
              { value: "vanilla", label: "JavaScript Vanilla" },
            ],
          },
          {
            id: "frontend_features",
            label: "Fonctionnalités",
            type: "multiselect",
            required: false,
            options: [
              { value: "responsive", label: "Design responsive" },
              { value: "animations", label: "Animations CSS/JS" },
              { value: "seo", label: "Optimisation SEO" },
              { value: "pwa", label: "Progressive Web App" },
              { value: "accessibility", label: "Accessibilité (WCAG)" },
              { value: "i18n", label: "Internationalisation" },
            ],
          },
          {
            id: "complexity",
            label: "Complexité du projet",
            type: "select",
            required: true,
            options: [
              { value: "simple", label: "Simple (1-5 pages)" },
              { value: "medium", label: "Moyen (6-15 pages)" },
              { value: "complex", label: "Complexe (15+ pages)" },
              {
                value: "enterprise",
                label: "Entreprise (Application complète)",
              },
            ],
          },
        ],
      },
      "dev-web-backend": {
        label: "Développement Backend",
        metadata: [
          {
            id: "backend_language",
            label: "Langage de programmation",
            type: "select",
            required: true,
            options: [
              { value: "nodejs", label: "Node.js" },
              { value: "python", label: "Python" },
              { value: "php", label: "PHP" },
              { value: "java", label: "Java" },
              { value: "csharp", label: "C#/.NET" },
              { value: "ruby", label: "Ruby" },
              { value: "go", label: "Go" },
            ],
          },
          {
            id: "backend_framework",
            label: "Framework",
            type: "select",
            required: false,
            options: [
              { value: "express", label: "Express.js" },
              { value: "django", label: "Django" },
              { value: "flask", label: "Flask" },
              { value: "laravel", label: "Laravel" },
              { value: "spring", label: "Spring Boot" },
              { value: "rails", label: "Ruby on Rails" },
            ],
          },
          {
            id: "database",
            label: "Base de données",
            type: "multiselect",
            required: true,
            options: [
              { value: "mysql", label: "MySQL" },
              { value: "postgresql", label: "PostgreSQL" },
              { value: "mongodb", label: "MongoDB" },
              { value: "redis", label: "Redis" },
              { value: "firebase", label: "Firebase" },
              { value: "sqlite", label: "SQLite" },
            ],
          },
          {
            id: "api_type",
            label: "Type d'API",
            type: "select",
            required: true,
            options: [
              { value: "rest", label: "REST API" },
              { value: "graphql", label: "GraphQL" },
              { value: "websocket", label: "WebSocket" },
              { value: "grpc", label: "gRPC" },
            ],
          },
        ],
      },
      "dev-web-fullstack": {
        label: "Développement Full Stack",
        metadata: [
          {
            id: "stack",
            label: "Stack technologique",
            type: "select",
            required: true,
            options: [
              { value: "mern", label: "MERN (MongoDB, Express, React, Node)" },
              {
                value: "mean",
                label: "MEAN (MongoDB, Express, Angular, Node)",
              },
              { value: "lamp", label: "LAMP (Linux, Apache, MySQL, PHP)" },
              { value: "django-react", label: "Django + React" },
              { value: "laravel-vue", label: "Laravel + Vue.js" },
              { value: "nextjs-full", label: "Next.js Full Stack" },
            ],
          },
          {
            id: "project_type",
            label: "Type de projet",
            type: "select",
            required: true,
            options: [
              { value: "saas", label: "SaaS Application" },
              { value: "marketplace", label: "Marketplace" },
              { value: "crm", label: "CRM" },
              { value: "dashboard", label: "Dashboard/Admin" },
              { value: "social", label: "Réseau social" },
              { value: "custom", label: "Application personnalisée" },
            ],
          },
          {
            id: "features",
            label: "Fonctionnalités",
            type: "multiselect",
            required: false,
            options: [
              { value: "auth", label: "Authentification/Autorisation" },
              { value: "payment", label: "Système de paiement" },
              { value: "realtime", label: "Temps réel (WebSocket)" },
              { value: "email", label: "Système d'emails" },
              { value: "notifications", label: "Notifications" },
              { value: "api", label: "API REST/GraphQL" },
            ],
          },
        ],
      },
      "dev-wordpress": {
        label: "Développement WordPress",
        metadata: [
          {
            id: "wordpress_type",
            label: "Type de site WordPress",
            type: "select",
            required: true,
            options: [
              { value: "blog", label: "Blog" },
              { value: "business", label: "Site d'entreprise" },
              { value: "ecommerce", label: "E-commerce (WooCommerce)" },
              { value: "portfolio", label: "Portfolio" },
              { value: "custom", label: "Site personnalisé" },
            ],
          },
          {
            id: "customization",
            label: "Niveau de personnalisation",
            type: "select",
            required: true,
            options: [
              { value: "theme", label: "Configuration de thème existant" },
              { value: "child", label: "Thème enfant personnalisé" },
              { value: "custom", label: "Thème sur mesure" },
              { value: "plugin", label: "Développement de plugin" },
            ],
          },
          {
            id: "wordpress_features",
            label: "Fonctionnalités",
            type: "multiselect",
            required: false,
            options: [
              { value: "gutenberg", label: "Gutenberg personnalisé" },
              { value: "acf", label: "Advanced Custom Fields" },
              { value: "multilingual", label: "Multilingue (WPML/Polylang)" },
              { value: "seo", label: "Optimisation SEO" },
              { value: "membership", label: "Système d'adhésion" },
              { value: "booking", label: "Système de réservation" },
            ],
          },
        ],
      },
      "dev-ecommerce": {
        label: "Développement E-commerce",
        metadata: [
          {
            id: "ecommerce_platform",
            label: "Plateforme",
            type: "select",
            required: true,
            options: [
              { value: "shopify", label: "Shopify" },
              { value: "woocommerce", label: "WooCommerce" },
              { value: "magento", label: "Magento" },
              { value: "prestashop", label: "PrestaShop" },
              { value: "custom", label: "Solution personnalisée" },
            ],
          },
          {
            id: "products_count",
            label: "Nombre de produits",
            type: "select",
            required: true,
            options: [
              { value: "small", label: "1-50 produits" },
              { value: "medium", label: "51-500 produits" },
              { value: "large", label: "501-5000 produits" },
              { value: "enterprise", label: "5000+ produits" },
            ],
          },
          {
            id: "ecommerce_features",
            label: "Fonctionnalités",
            type: "multiselect",
            required: false,
            options: [
              { value: "payment", label: "Paiements multiples" },
              { value: "shipping", label: "Calcul d'expédition" },
              { value: "inventory", label: "Gestion d'inventaire" },
              { value: "reviews", label: "Système d'avis" },
              { value: "coupons", label: "Coupons/Promotions" },
              { value: "subscription", label: "Abonnements" },
            ],
          },
        ],
      },
      "dev-mobile": {
        label: "Développement d'Applications Mobiles",
        metadata: [
          {
            id: "mobile_platform",
            label: "Plateforme",
            type: "multiselect",
            required: true,
            options: [
              { value: "ios", label: "iOS (Swift/SwiftUI)" },
              { value: "android", label: "Android (Kotlin/Java)" },
              { value: "react-native", label: "React Native" },
              { value: "flutter", label: "Flutter" },
              { value: "ionic", label: "Ionic" },
            ],
          },
          {
            id: "app_category",
            label: "Catégorie d'application",
            type: "select",
            required: true,
            options: [
              { value: "social", label: "Réseau social" },
              { value: "ecommerce", label: "E-commerce" },
              { value: "productivity", label: "Productivité" },
              { value: "health", label: "Santé & Fitness" },
              { value: "education", label: "Éducation" },
              { value: "entertainment", label: "Divertissement" },
              { value: "business", label: "Business" },
            ],
          },
          {
            id: "mobile_features",
            label: "Fonctionnalités",
            type: "multiselect",
            required: false,
            options: [
              { value: "auth", label: "Authentification" },
              { value: "push", label: "Notifications push" },
              { value: "geolocation", label: "Géolocalisation" },
              { value: "camera", label: "Caméra/Photos" },
              { value: "payment", label: "Paiement in-app" },
              { value: "offline", label: "Mode hors ligne" },
              { value: "chat", label: "Chat/Messagerie" },
            ],
          },
        ],
      },
    },
  },

  // ==================== GRAPHISME ET DESIGN ====================
  "design-graphique": {
    label: "Graphisme et Design",
    subcategories: {
      "logo-design": {
        label: "Design de Logo",
        metadata: [
          {
            id: "logo_style",
            label: "Style de logo",
            type: "multiselect",
            required: true,
            options: [
              { value: "modern", label: "Moderne" },
              { value: "minimalist", label: "Minimaliste" },
              { value: "vintage", label: "Vintage/Rétro" },
              { value: "elegant", label: "Élégant" },
              { value: "playful", label: "Ludique" },
              { value: "professional", label: "Professionnel/Corporate" },
              { value: "abstract", label: "Abstrait" },
              { value: "geometric", label: "Géométrique" },
            ],
          },
          {
            id: "logo_type",
            label: "Type de logo",
            type: "select",
            required: true,
            options: [
              { value: "text", label: "Logo textuel (Wordmark)" },
              { value: "symbol", label: "Symbole/Icône" },
              { value: "combination", label: "Combiné (Texte + Symbole)" },
              { value: "emblem", label: "Emblème" },
              { value: "mascot", label: "Mascotte" },
            ],
          },
          {
            id: "revisions",
            label: "Nombre de révisions",
            type: "select",
            required: true,
            options: [
              { value: "2", label: "2 révisions" },
              { value: "5", label: "5 révisions" },
              { value: "unlimited", label: "Révisions illimitées" },
            ],
          },
          {
            id: "deliverables",
            label: "Fichiers livrés",
            type: "multiselect",
            required: true,
            options: [
              { value: "vector", label: "Fichiers vectoriels (AI, EPS, SVG)" },
              { value: "png", label: "PNG haute résolution" },
              { value: "jpg", label: "JPG" },
              { value: "pdf", label: "PDF" },
              { value: "source", label: "Fichiers sources" },
            ],
          },
        ],
      },
      "brand-identity": {
        label: "Identité de Marque",
        metadata: [
          {
            id: "brand_package",
            label: "Package d'identité",
            type: "select",
            required: true,
            options: [
              { value: "basic", label: "Basique (Logo + Palette)" },
              { value: "standard", label: "Standard (Logo + Guidelines)" },
              { value: "premium", label: "Premium (Package complet)" },
              { value: "rebrand", label: "Refonte de marque" },
            ],
          },
          {
            id: "brand_elements",
            label: "Éléments inclus",
            type: "multiselect",
            required: true,
            options: [
              { value: "logo", label: "Logo principal + variantes" },
              { value: "colors", label: "Palette de couleurs" },
              { value: "typography", label: "Typographie" },
              { value: "patterns", label: "Motifs/Patterns" },
              { value: "icons", label: "Iconographie" },
              { value: "guidelines", label: "Guide de marque complet" },
              { value: "stationery", label: "Papeterie (Cartes, Lettres)" },
              { value: "social", label: "Templates réseaux sociaux" },
            ],
          },
          {
            id: "industry",
            label: "Industrie",
            type: "select",
            required: true,
            options: [
              { value: "tech", label: "Technologie" },
              { value: "fashion", label: "Mode/Beauté" },
              { value: "food", label: "Alimentation/Restaurant" },
              { value: "health", label: "Santé/Bien-être" },
              { value: "finance", label: "Finance/Assurance" },
              { value: "education", label: "Éducation" },
              { value: "realestate", label: "Immobilier" },
              { value: "sports", label: "Sports/Fitness" },
              { value: "other", label: "Autre" },
            ],
          },
        ],
      },
      "web-design": {
        label: "Design de Site Web (UI/UX)",
        metadata: [
          {
            id: "design_scope",
            label: "Portée du design",
            type: "select",
            required: true,
            options: [
              { value: "landing", label: "Landing page unique" },
              { value: "website", label: "Site web multi-pages" },
              { value: "webapp", label: "Application web" },
              { value: "dashboard", label: "Dashboard/Admin" },
              { value: "mobile", label: "Design mobile app" },
            ],
          },
          {
            id: "pages_count",
            label: "Nombre de pages/écrans",
            type: "select",
            required: true,
            options: [
              { value: "1-3", label: "1-3 pages" },
              { value: "4-7", label: "4-7 pages" },
              { value: "8-15", label: "8-15 pages" },
              { value: "15+", label: "Plus de 15 pages" },
            ],
          },
          {
            id: "design_tool",
            label: "Outil de design",
            type: "select",
            required: false,
            options: [
              { value: "figma", label: "Figma" },
              { value: "sketch", label: "Sketch" },
              { value: "xd", label: "Adobe XD" },
              { value: "photoshop", label: "Photoshop" },
            ],
          },
          {
            id: "design_features",
            label: "Fonctionnalités incluses",
            type: "multiselect",
            required: false,
            options: [
              { value: "wireframes", label: "Wireframes" },
              { value: "prototype", label: "Prototype interactif" },
              {
                value: "responsive",
                label: "Design responsive (Mobile/Tablet)",
              },
              { value: "styleguide", label: "Guide de style" },
              { value: "components", label: "Bibliothèque de composants" },
              { value: "animations", label: "Animations/Microinteractions" },
            ],
          },
        ],
      },
      "uiux-design": {
        label: "Design UI/UX",
        metadata: [
          {
            id: "uiux_service",
            label: "Service UI/UX",
            type: "select",
            required: true,
            options: [
              { value: "research", label: "Recherche utilisateur" },
              { value: "wireframes", label: "Wireframing" },
              { value: "prototyping", label: "Prototypage" },
              { value: "testing", label: "Tests utilisateurs" },
              { value: "complete", label: "Service complet UI/UX" },
            ],
          },
          {
            id: "project_phase",
            label: "Phase du projet",
            type: "select",
            required: true,
            options: [
              { value: "new", label: "Nouveau projet" },
              { value: "redesign", label: "Refonte" },
              { value: "audit", label: "Audit UX" },
              { value: "optimization", label: "Optimisation" },
            ],
          },
          {
            id: "deliverables",
            label: "Livrables",
            type: "multiselect",
            required: true,
            options: [
              { value: "personas", label: "Personas utilisateurs" },
              { value: "userflows", label: "User flows" },
              { value: "wireframes", label: "Wireframes" },
              { value: "mockups", label: "Mockups haute-fidélité" },
              { value: "prototype", label: "Prototype interactif" },
              { value: "testing", label: "Rapport de tests" },
            ],
          },
        ],
      },
      illustration: {
        label: "Illustration",
        metadata: [
          {
            id: "illustration_style",
            label: "Style d'illustration",
            type: "select",
            required: true,
            options: [
              { value: "flat", label: "Flat design" },
              { value: "3d", label: "3D/Isométrique" },
              { value: "hand-drawn", label: "Dessiné à la main" },
              { value: "vector", label: "Vectoriel" },
              { value: "realistic", label: "Réaliste" },
              { value: "cartoon", label: "Cartoon/BD" },
              { value: "watercolor", label: "Aquarelle" },
            ],
          },
          {
            id: "illustration_use",
            label: "Utilisation",
            type: "select",
            required: true,
            options: [
              { value: "web", label: "Illustration web" },
              { value: "print", label: "Impression" },
              { value: "book", label: "Livre/Magazine" },
              { value: "children", label: "Livre pour enfants" },
              { value: "editorial", label: "Éditorial" },
              { value: "product", label: "Packaging produit" },
            ],
          },
          {
            id: "complexity",
            label: "Complexité",
            type: "select",
            required: true,
            options: [
              { value: "simple", label: "Simple (1-2 éléments)" },
              { value: "medium", label: "Moyen (3-5 éléments)" },
              { value: "complex", label: "Complexe (Scène détaillée)" },
            ],
          },
        ],
      },
      "packaging-design": {
        label: "Design de Packaging",
        metadata: [
          {
            id: "packaging_type",
            label: "Type de packaging",
            type: "select",
            required: true,
            options: [
              { value: "box", label: "Boîte" },
              { value: "bottle", label: "Bouteille/Flacon" },
              { value: "bag", label: "Sac/Sachet" },
              { value: "can", label: "Canette/Boîte métallique" },
              { value: "label", label: "Étiquette" },
              { value: "other", label: "Autre" },
            ],
          },
          {
            id: "product_category",
            label: "Catégorie de produit",
            type: "select",
            required: true,
            options: [
              { value: "food", label: "Alimentation" },
              { value: "beverage", label: "Boissons" },
              { value: "cosmetics", label: "Cosmétiques/Beauté" },
              { value: "electronics", label: "Électronique" },
              { value: "fashion", label: "Mode/Accessoires" },
              { value: "health", label: "Santé/Supplément" },
            ],
          },
          {
            id: "deliverables",
            label: "Livrables",
            type: "multiselect",
            required: true,
            options: [
              { value: "3d", label: "Mockup 3D" },
              { value: "dieline", label: "Gabarit de découpe (Dieline)" },
              { value: "print", label: "Fichiers prêts à imprimer" },
              { value: "source", label: "Fichiers sources" },
            ],
          },
        ],
      },
      "motion-graphics": {
        label: "Motion Graphics",
        metadata: [
          {
            id: "motion_type",
            label: "Type de motion graphics",
            type: "select",
            required: true,
            options: [
              { value: "logo", label: "Animation de logo" },
              { value: "explainer", label: "Vidéo explicative" },
              { value: "intro", label: "Intro/Outro vidéo" },
              { value: "social", label: "Animation réseaux sociaux" },
              { value: "infographic", label: "Infographie animée" },
              { value: "promo", label: "Vidéo promotionnelle" },
            ],
          },
          {
            id: "duration",
            label: "Durée",
            type: "select",
            required: true,
            options: [
              { value: "short", label: "Court (5-15 secondes)" },
              { value: "medium", label: "Moyen (15-30 secondes)" },
              { value: "long", label: "Long (30-60 secondes)" },
              { value: "extended", label: "Étendu (1-3 minutes)" },
            ],
          },
          {
            id: "style",
            label: "Style",
            type: "select",
            required: true,
            options: [
              { value: "2d", label: "2D" },
              { value: "3d", label: "3D" },
              { value: "kinetic", label: "Typographie cinétique" },
              { value: "whiteboard", label: "Whiteboard animation" },
            ],
          },
        ],
      },
    },
  },

  // ==================== RÉDACTION ET TRADUCTION ====================
  "redaction-traduction": {
    label: "Rédaction et Traduction",
    subcategories: {
      "content-writing": {
        label: "Rédaction de Contenu",
        metadata: [
          {
            id: "content_type",
            label: "Type de contenu",
            type: "select",
            required: true,
            options: [
              { value: "blog", label: "Article de blog" },
              { value: "website", label: "Contenu de site web" },
              { value: "product", label: "Description de produit" },
              { value: "ebook", label: "E-book/Guide" },
              { value: "whitepaper", label: "White paper" },
              { value: "newsletter", label: "Newsletter" },
            ],
          },
          {
            id: "word_count",
            label: "Nombre de mots",
            type: "select",
            required: true,
            options: [
              { value: "300-500", label: "300-500 mots" },
              { value: "500-800", label: "500-800 mots" },
              { value: "800-1200", label: "800-1200 mots" },
              { value: "1200-2000", label: "1200-2000 mots" },
              { value: "2000+", label: "Plus de 2000 mots" },
            ],
          },
          {
            id: "niche",
            label: "Niche/Domaine",
            type: "select",
            required: true,
            options: [
              { value: "tech", label: "Technologie" },
              { value: "health", label: "Santé/Bien-être" },
              { value: "finance", label: "Finance/Business" },
              { value: "travel", label: "Voyage/Tourisme" },
              { value: "lifestyle", label: "Lifestyle" },
              { value: "food", label: "Alimentation" },
              { value: "fashion", label: "Mode/Beauté" },
              { value: "education", label: "Éducation" },
              { value: "other", label: "Autre" },
            ],
          },
        ],
      },
      copywriting: {
        label: "Copywriting",
        metadata: [
          {
            id: "copy_type",
            label: "Type de copywriting",
            type: "select",
            required: true,
            options: [
              { value: "sales", label: "Page de vente" },
              { value: "landing", label: "Landing page" },
              { value: "email", label: "Email marketing" },
              { value: "ads", label: "Publicités (Google/Facebook Ads)" },
              { value: "social", label: "Réseaux sociaux" },
              { value: "video", label: "Script vidéo" },
              { value: "tagline", label: "Slogan/Tagline" },
            ],
          },
          {
            id: "tone",
            label: "Ton",
            type: "select",
            required: true,
            options: [
              { value: "professional", label: "Professionnel" },
              { value: "casual", label: "Décontracté" },
              { value: "friendly", label: "Amical" },
              { value: "persuasive", label: "Persuasif" },
              { value: "authoritative", label: "Autoritaire" },
              { value: "humorous", label: "Humoristique" },
            ],
          },
          {
            id: "length",
            label: "Longueur",
            type: "select",
            required: true,
            options: [
              { value: "short", label: "Court (100-300 mots)" },
              { value: "medium", label: "Moyen (300-800 mots)" },
              { value: "long", label: "Long (800+ mots)" },
            ],
          },
        ],
      },
      "technical-writing": {
        label: "Rédaction Technique",
        metadata: [
          {
            id: "document_type",
            label: "Type de document",
            type: "select",
            required: true,
            options: [
              { value: "manual", label: "Manuel utilisateur" },
              { value: "documentation", label: "Documentation technique" },
              { value: "api", label: "Documentation API" },
              { value: "tutorial", label: "Tutoriel/Guide" },
              { value: "knowledgebase", label: "Base de connaissances" },
              { value: "specs", label: "Spécifications techniques" },
            ],
          },
          {
            id: "technical_level",
            label: "Niveau technique",
            type: "select",
            required: true,
            options: [
              { value: "beginner", label: "Débutant" },
              { value: "intermediate", label: "Intermédiaire" },
              { value: "advanced", label: "Avancé" },
              { value: "expert", label: "Expert" },
            ],
          },
          {
            id: "domain",
            label: "Domaine",
            type: "select",
            required: true,
            options: [
              { value: "software", label: "Logiciel/IT" },
              { value: "engineering", label: "Ingénierie" },
              { value: "medical", label: "Médical" },
              { value: "scientific", label: "Scientifique" },
              { value: "other", label: "Autre" },
            ],
          },
        ],
      },
      translation: {
        label: "Traduction",
        metadata: [
          {
            id: "source_language",
            label: "Langue source",
            type: "select",
            required: true,
            options: [
              { value: "fr", label: "Français" },
              { value: "en", label: "Anglais" },
              { value: "es", label: "Espagnol" },
              { value: "de", label: "Allemand" },
              { value: "it", label: "Italien" },
              { value: "pt", label: "Portugais" },
              { value: "zh", label: "Chinois" },
              { value: "ar", label: "Arabe" },
              { value: "ru", label: "Russe" },
            ],
          },
          {
            id: "target_language",
            label: "Langue cible",
            type: "select",
            required: true,
            options: [
              { value: "fr", label: "Français" },
              { value: "en", label: "Anglais" },
              { value: "es", label: "Espagnol" },
              { value: "de", label: "Allemand" },
              { value: "it", label: "Italien" },
              { value: "pt", label: "Portugais" },
              { value: "zh", label: "Chinois" },
              { value: "ar", label: "Arabe" },
              { value: "ru", label: "Russe" },
            ],
          },
          {
            id: "translation_type",
            label: "Type de traduction",
            type: "select",
            required: true,
            options: [
              { value: "general", label: "Générale" },
              { value: "technical", label: "Technique" },
              { value: "legal", label: "Juridique" },
              { value: "medical", label: "Médicale" },
              { value: "marketing", label: "Marketing/Publicitaire" },
              { value: "literary", label: "Littéraire" },
            ],
          },
          {
            id: "word_count",
            label: "Nombre de mots",
            type: "select",
            required: true,
            options: [
              { value: "0-500", label: "0-500 mots" },
              { value: "500-1000", label: "500-1000 mots" },
              { value: "1000-2500", label: "1000-2500 mots" },
              { value: "2500-5000", label: "2500-5000 mots" },
              { value: "5000+", label: "Plus de 5000 mots" },
            ],
          },
        ],
      },
      "blog-writing": {
        label: "Rédaction de Blog",
        metadata: [
          {
            id: "frequency",
            label: "Fréquence de publication",
            type: "select",
            required: true,
            options: [
              { value: "once", label: "Article unique" },
              { value: "weekly", label: "Hebdomadaire" },
              { value: "biweekly", label: "Bi-hebdomadaire" },
              { value: "monthly", label: "Mensuel" },
            ],
          },
          {
            id: "seo_optimized",
            label: "Optimisé SEO",
            type: "select",
            required: true,
            options: [
              { value: "yes", label: "Oui, avec recherche de mots-clés" },
              { value: "no", label: "Non, contenu standard" },
            ],
          },
          {
            id: "research",
            label: "Niveau de recherche",
            type: "select",
            required: true,
            options: [
              { value: "basic", label: "Basique" },
              { value: "intermediate", label: "Intermédiaire" },
              { value: "deep", label: "Approfondi avec sources" },
            ],
          },
        ],
      },
      "seo-writing": {
        label: "Rédaction SEO",
        metadata: [
          {
            id: "seo_focus",
            label: "Focus SEO",
            type: "select",
            required: true,
            options: [
              { value: "keywords", label: "Optimisation mots-clés" },
              { value: "linkbuilding", label: "Link building" },
              { value: "onpage", label: "SEO on-page complet" },
              { value: "local", label: "SEO local" },
            ],
          },
          {
            id: "content_goal",
            label: "Objectif du contenu",
            type: "select",
            required: true,
            options: [
              { value: "ranking", label: "Améliorer le ranking" },
              { value: "traffic", label: "Augmenter le trafic" },
              { value: "conversion", label: "Conversion" },
              { value: "authority", label: "Autorité/Expertise" },
            ],
          },
        ],
      },
      ghostwriting: {
        label: "Ghostwriting",
        metadata: [
          {
            id: "project_type",
            label: "Type de projet",
            type: "select",
            required: true,
            options: [
              { value: "book", label: "Livre complet" },
              { value: "ebook", label: "E-book" },
              { value: "memoir", label: "Mémoires/Biographie" },
              { value: "articles", label: "Articles/Blog posts" },
              { value: "speech", label: "Discours" },
            ],
          },
          {
            id: "genre",
            label: "Genre",
            type: "select",
            required: true,
            options: [
              { value: "fiction", label: "Fiction" },
              { value: "nonfiction", label: "Non-fiction" },
              { value: "business", label: "Business" },
              { value: "selfhelp", label: "Développement personnel" },
              { value: "biography", label: "Biographie" },
            ],
          },
          {
            id: "length",
            label: "Longueur",
            type: "select",
            required: true,
            options: [
              { value: "short", label: "Court (5,000-15,000 mots)" },
              { value: "medium", label: "Moyen (15,000-40,000 mots)" },
              { value: "long", label: "Long (40,000-80,000 mots)" },
              { value: "full", label: "Livre complet (80,000+ mots)" },
            ],
          },
        ],
      },
    },
  },

  // ==================== AUDIOVISUEL ====================
  audiovisuel: {
    label: "Audiovisuel",
    subcategories: {
      "video-editing": {
        label: "Montage Vidéo",
        metadata: [
          {
            id: "video_type",
            label: "Type de vidéo",
            type: "select",
            required: true,
            options: [
              { value: "youtube", label: "Vidéo YouTube" },
              { value: "social", label: "Vidéo réseaux sociaux" },
              { value: "promo", label: "Vidéo promotionnelle" },
              { value: "corporate", label: "Vidéo corporate" },
              { value: "tutorial", label: "Tutoriel/Formation" },
              { value: "wedding", label: "Mariage/Événement" },
              { value: "documentary", label: "Documentaire" },
              { value: "music", label: "Clip musical" },
            ],
          },
          {
            id: "video_length",
            label: "Durée de la vidéo",
            type: "select",
            required: true,
            options: [
              { value: "0-1", label: "0-1 minute" },
              { value: "1-3", label: "1-3 minutes" },
              { value: "3-5", label: "3-5 minutes" },
              { value: "5-10", label: "5-10 minutes" },
              { value: "10-30", label: "10-30 minutes" },
              { value: "30+", label: "Plus de 30 minutes" },
            ],
          },
          {
            id: "editing_features",
            label: "Fonctionnalités de montage",
            type: "multiselect",
            required: false,
            options: [
              { value: "color", label: "Correction colorimétrique" },
              { value: "audio", label: "Mixage audio professionnel" },
              { value: "subtitles", label: "Sous-titres" },
              { value: "effects", label: "Effets visuels/VFX" },
              { value: "music", label: "Musique de fond" },
              { value: "transitions", label: "Transitions créatives" },
              { value: "graphics", label: "Graphiques/Textes animés" },
              { value: "greenscreen", label: "Green screen/Keying" },
            ],
          },
          {
            id: "software",
            label: "Logiciel préféré",
            type: "select",
            required: false,
            options: [
              { value: "premiere", label: "Adobe Premiere Pro" },
              { value: "finalcut", label: "Final Cut Pro" },
              { value: "davinci", label: "DaVinci Resolve" },
              { value: "aftereffects", label: "After Effects" },
              { value: "any", label: "Peu importe" },
            ],
          },
        ],
      },
      "audio-production": {
        label: "Production Audio",
        metadata: [
          {
            id: "audio_type",
            label: "Type de production audio",
            type: "select",
            required: true,
            options: [
              { value: "podcast", label: "Podcast" },
              { value: "audiobook", label: "Livre audio" },
              { value: "commercial", label: "Publicité/Commercial" },
              { value: "jingle", label: "Jingle" },
              { value: "voiceover", label: "Voice-over" },
              { value: "mixing", label: "Mixage audio" },
              { value: "mastering", label: "Mastering" },
            ],
          },
          {
            id: "duration",
            label: "Durée",
            type: "select",
            required: true,
            options: [
              { value: "short", label: "Court (0-5 minutes)" },
              { value: "medium", label: "Moyen (5-15 minutes)" },
              { value: "long", label: "Long (15-30 minutes)" },
              { value: "extended", label: "Étendu (30+ minutes)" },
            ],
          },
          {
            id: "services",
            label: "Services inclus",
            type: "multiselect",
            required: false,
            options: [
              { value: "editing", label: "Édition/Nettoyage" },
              { value: "mixing", label: "Mixage" },
              { value: "mastering", label: "Mastering" },
              { value: "effects", label: "Effets sonores" },
              { value: "music", label: "Musique de fond" },
            ],
          },
        ],
      },
      animation: {
        label: "Animation",
        metadata: [
          {
            id: "animation_type",
            label: "Type d'animation",
            type: "select",
            required: true,
            options: [
              { value: "2d", label: "Animation 2D" },
              { value: "3d", label: "Animation 3D" },
              { value: "motion", label: "Motion graphics" },
              { value: "whiteboard", label: "Whiteboard animation" },
              { value: "character", label: "Animation de personnages" },
              { value: "explainer", label: "Vidéo explicative animée" },
            ],
          },
          {
            id: "duration",
            label: "Durée",
            type: "select",
            required: true,
            options: [
              { value: "short", label: "Court (5-15 secondes)" },
              { value: "medium", label: "Moyen (15-30 secondes)" },
              { value: "long", label: "Long (30-60 secondes)" },
              { value: "extended", label: "Étendu (1-3 minutes)" },
            ],
          },
          {
            id: "style",
            label: "Style",
            type: "select",
            required: true,
            options: [
              { value: "flat", label: "Flat design" },
              { value: "realistic", label: "Réaliste" },
              { value: "cartoon", label: "Cartoon" },
              { value: "minimalist", label: "Minimaliste" },
              { value: "isometric", label: "Isométrique" },
            ],
          },
        ],
      },
      photography: {
        label: "Photographie",
        metadata: [
          {
            id: "photography_type",
            label: "Type de photographie",
            type: "select",
            required: true,
            options: [
              { value: "product", label: "Produit" },
              { value: "portrait", label: "Portrait" },
              { value: "event", label: "Événement" },
              { value: "food", label: "Culinaire" },
              { value: "real-estate", label: "Immobilier" },
              { value: "fashion", label: "Mode" },
              { value: "landscape", label: "Paysage" },
              { value: "corporate", label: "Corporate" },
            ],
          },
          {
            id: "photo_count",
            label: "Nombre de photos",
            type: "select",
            required: true,
            options: [
              { value: "1-10", label: "1-10 photos" },
              { value: "11-25", label: "11-25 photos" },
              { value: "26-50", label: "26-50 photos" },
              { value: "51-100", label: "51-100 photos" },
              { value: "100+", label: "Plus de 100 photos" },
            ],
          },
          {
            id: "retouching",
            label: "Retouche",
            type: "select",
            required: true,
            options: [
              { value: "basic", label: "Retouche basique" },
              { value: "advanced", label: "Retouche avancée" },
              { value: "professional", label: "Retouche professionnelle" },
              { value: "none", label: "Pas de retouche" },
            ],
          },
        ],
      },
      "voice-over": {
        label: "Voice Over",
        metadata: [
          {
            id: "voiceover_type",
            label: "Type de voice-over",
            type: "select",
            required: true,
            options: [
              { value: "commercial", label: "Commercial/Publicité" },
              { value: "narration", label: "Narration" },
              { value: "explainer", label: "Vidéo explicative" },
              { value: "audiobook", label: "Livre audio" },
              { value: "elearning", label: "E-learning" },
              { value: "ivr", label: "IVR/Téléphonie" },
              { value: "character", label: "Personnage/Animation" },
            ],
          },
          {
            id: "duration",
            label: "Durée",
            type: "select",
            required: true,
            options: [
              { value: "0-1", label: "0-1 minute" },
              { value: "1-3", label: "1-3 minutes" },
              { value: "3-5", label: "3-5 minutes" },
              { value: "5-10", label: "5-10 minutes" },
              { value: "10+", label: "Plus de 10 minutes" },
            ],
          },
          {
            id: "tone",
            label: "Ton de voix",
            type: "select",
            required: true,
            options: [
              { value: "professional", label: "Professionnel" },
              { value: "friendly", label: "Amical" },
              { value: "energetic", label: "Énergique" },
              { value: "calm", label: "Calme/Doux" },
              { value: "authoritative", label: "Autoritaire" },
            ],
          },
        ],
      },
      "music-production": {
        label: "Production Musicale",
        metadata: [
          {
            id: "music_type",
            label: "Type de production",
            type: "select",
            required: true,
            options: [
              { value: "original", label: "Musique originale" },
              { value: "beat", label: "Beat/Instrumental" },
              { value: "jingle", label: "Jingle publicitaire" },
              { value: "soundtrack", label: "Bande sonore" },
              { value: "mixing", label: "Mixage" },
              { value: "mastering", label: "Mastering" },
            ],
          },
          {
            id: "genre",
            label: "Genre musical",
            type: "select",
            required: true,
            options: [
              { value: "pop", label: "Pop" },
              { value: "rock", label: "Rock" },
              { value: "hiphop", label: "Hip-Hop/Rap" },
              { value: "electronic", label: "Électronique/EDM" },
              { value: "jazz", label: "Jazz" },
              { value: "classical", label: "Classique" },
              { value: "ambient", label: "Ambient" },
              { value: "any", label: "Autre/Flexible" },
            ],
          },
          {
            id: "duration",
            label: "Durée",
            type: "select",
            required: true,
            options: [
              { value: "short", label: "Court (0-1 minute)" },
              { value: "medium", label: "Moyen (1-3 minutes)" },
              { value: "long", label: "Long (3-5 minutes)" },
              { value: "extended", label: "Étendu (5+ minutes)" },
            ],
          },
        ],
      },
      "sound-design": {
        label: "Design Sonore",
        metadata: [
          {
            id: "sound_type",
            label: "Type de design sonore",
            type: "select",
            required: true,
            options: [
              { value: "game", label: "Jeu vidéo" },
              { value: "film", label: "Film/Vidéo" },
              { value: "app", label: "Application" },
              { value: "podcast", label: "Podcast" },
              { value: "sfx", label: "Effets sonores" },
              { value: "ambient", label: "Ambiance sonore" },
            ],
          },
          {
            id: "complexity",
            label: "Complexité",
            type: "select",
            required: true,
            options: [
              { value: "basic", label: "Basique" },
              { value: "intermediate", label: "Intermédiaire" },
              { value: "advanced", label: "Avancé" },
              { value: "cinematic", label: "Cinématique" },
            ],
          },
        ],
      },
    },
  },

  // ==================== MARKETING DIGITAL ====================
  "marketing-digital": {
    label: "Marketing Digital",
    subcategories: {
      "affiliate-marketing": {
        label: "Affiliate Marketing",
        metadata: [
          {
            id: "service_type",
            label: "Type de service",
            type: "select",
            required: true,
            options: [
              {
                value: "setup",
                label: "Configuration programme d'affiliation",
              },
              { value: "management", label: "Gestion de campagne" },
              { value: "strategy", label: "Stratégie d'affiliation" },
              { value: "recruitment", label: "Recrutement d'affiliés" },
            ],
          },
          {
            id: "platform",
            label: "Plateforme",
            type: "multiselect",
            required: false,
            options: [
              { value: "amazon", label: "Amazon Associates" },
              { value: "clickbank", label: "ClickBank" },
              { value: "cj", label: "CJ Affiliate" },
              { value: "sharedasale", label: "ShareASale" },
              { value: "custom", label: "Programme personnalisé" },
            ],
          },
        ],
      },
      "email-marketing": {
        label: "Email Marketing",
        metadata: [
          {
            id: "email_service",
            label: "Service",
            type: "select",
            required: true,
            options: [
              { value: "campaign", label: "Campagne email unique" },
              { value: "sequence", label: "Séquence automatisée" },
              { value: "newsletter", label: "Newsletter régulière" },
              { value: "strategy", label: "Stratégie email complète" },
            ],
          },
          {
            id: "email_count",
            label: "Nombre d'emails",
            type: "select",
            required: true,
            options: [
              { value: "1", label: "1 email" },
              { value: "3-5", label: "3-5 emails" },
              { value: "6-10", label: "6-10 emails" },
              { value: "10+", label: "Plus de 10 emails" },
            ],
          },
          {
            id: "platform",
            label: "Plateforme",
            type: "select",
            required: false,
            options: [
              { value: "mailchimp", label: "Mailchimp" },
              { value: "convertkit", label: "ConvertKit" },
              { value: "activecampaign", label: "ActiveCampaign" },
              { value: "sendinblue", label: "Sendinblue" },
              { value: "any", label: "Peu importe" },
            ],
          },
        ],
      },
      seo: {
        label: "SEO (Référencement)",
        metadata: [
          {
            id: "seo_type",
            label: "Type de SEO",
            type: "select",
            required: true,
            options: [
              { value: "onpage", label: "SEO On-Page" },
              { value: "offpage", label: "SEO Off-Page" },
              { value: "technical", label: "SEO Technique" },
              { value: "local", label: "SEO Local" },
              { value: "audit", label: "Audit SEO" },
              { value: "complete", label: "Service SEO complet" },
            ],
          },
          {
            id: "website_size",
            label: "Taille du site",
            type: "select",
            required: true,
            options: [
              { value: "small", label: "Petit (1-10 pages)" },
              { value: "medium", label: "Moyen (11-50 pages)" },
              { value: "large", label: "Grand (51-200 pages)" },
              { value: "enterprise", label: "Entreprise (200+ pages)" },
            ],
          },
          {
            id: "duration",
            label: "Durée du service",
            type: "select",
            required: true,
            options: [
              { value: "once", label: "Service ponctuel" },
              { value: "monthly", label: "Mensuel (3 mois min.)" },
              { value: "quarterly", label: "Trimestriel" },
              { value: "yearly", label: "Annuel" },
            ],
          },
        ],
      },
      "social-media-marketing": {
        label: "Marketing Réseaux Sociaux",
        metadata: [
          {
            id: "platforms",
            label: "Plateformes",
            type: "multiselect",
            required: true,
            options: [
              { value: "facebook", label: "Facebook" },
              { value: "instagram", label: "Instagram" },
              { value: "twitter", label: "Twitter/X" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "tiktok", label: "TikTok" },
              { value: "pinterest", label: "Pinterest" },
              { value: "youtube", label: "YouTube" },
            ],
          },
          {
            id: "service_type",
            label: "Type de service",
            type: "select",
            required: true,
            options: [
              { value: "management", label: "Gestion complète" },
              { value: "content", label: "Création de contenu" },
              { value: "ads", label: "Publicités payantes" },
              { value: "strategy", label: "Stratégie uniquement" },
            ],
          },
          {
            id: "posts_per_week",
            label: "Publications par semaine",
            type: "select",
            required: true,
            options: [
              { value: "3", label: "3 publications" },
              { value: "5", label: "5 publications" },
              { value: "7", label: "7 publications (quotidien)" },
              { value: "10+", label: "10+ publications" },
            ],
          },
        ],
      },
      "content-marketing": {
        label: "Content Marketing",
        metadata: [
          {
            id: "content_types",
            label: "Types de contenu",
            type: "multiselect",
            required: true,
            options: [
              { value: "blog", label: "Articles de blog" },
              { value: "social", label: "Contenu réseaux sociaux" },
              { value: "video", label: "Vidéos" },
              { value: "infographic", label: "Infographies" },
              { value: "ebook", label: "E-books/Guides" },
              { value: "newsletter", label: "Newsletters" },
            ],
          },
          {
            id: "frequency",
            label: "Fréquence",
            type: "select",
            required: true,
            options: [
              { value: "weekly", label: "Hebdomadaire" },
              { value: "biweekly", label: "Bi-hebdomadaire" },
              { value: "monthly", label: "Mensuel" },
            ],
          },
          {
            id: "strategy",
            label: "Stratégie incluse",
            type: "select",
            required: true,
            options: [
              { value: "yes", label: "Oui, avec calendrier éditorial" },
              { value: "no", label: "Non, exécution uniquement" },
            ],
          },
        ],
      },
      "ppc-advertising": {
        label: "Publicité PPC",
        metadata: [
          {
            id: "platform",
            label: "Plateforme publicitaire",
            type: "multiselect",
            required: true,
            options: [
              { value: "google", label: "Google Ads" },
              { value: "facebook", label: "Facebook Ads" },
              { value: "instagram", label: "Instagram Ads" },
              { value: "linkedin", label: "LinkedIn Ads" },
              { value: "tiktok", label: "TikTok Ads" },
              { value: "youtube", label: "YouTube Ads" },
            ],
          },
          {
            id: "budget_range",
            label: "Budget publicitaire mensuel",
            type: "select",
            required: true,
            options: [
              { value: "small", label: "Petit ($500-$2,000)" },
              { value: "medium", label: "Moyen ($2,000-$10,000)" },
              { value: "large", label: "Grand ($10,000-$50,000)" },
              { value: "enterprise", label: "Entreprise ($50,000+)" },
            ],
          },
          {
            id: "service",
            label: "Service",
            type: "select",
            required: true,
            options: [
              { value: "setup", label: "Configuration de campagne" },
              { value: "management", label: "Gestion continue" },
              { value: "optimization", label: "Optimisation" },
              { value: "complete", label: "Service complet" },
            ],
          },
        ],
      },
      "marketing-strategy": {
        label: "Stratégie Marketing",
        metadata: [
          {
            id: "strategy_type",
            label: "Type de stratégie",
            type: "select",
            required: true,
            options: [
              { value: "digital", label: "Stratégie digitale complète" },
              { value: "social", label: "Stratégie réseaux sociaux" },
              { value: "content", label: "Stratégie de contenu" },
              { value: "launch", label: "Stratégie de lancement produit" },
              { value: "growth", label: "Stratégie de croissance" },
            ],
          },
          {
            id: "deliverables",
            label: "Livrables",
            type: "multiselect",
            required: true,
            options: [
              { value: "audit", label: "Audit marketing" },
              { value: "personas", label: "Personas cibles" },
              { value: "roadmap", label: "Roadmap/Plan d'action" },
              { value: "calendar", label: "Calendrier éditorial" },
              { value: "kpi", label: "Définition des KPIs" },
              { value: "presentation", label: "Présentation stratégique" },
            ],
          },
        ],
      },
    },
  },

  // ==================== CONSULTATION ====================
  consultation: {
    label: "Consultation et Conseil",
    subcategories: {
      "business-consulting": {
        label: "Conseil en Business",
        metadata: [
          {
            id: "consulting_focus",
            label: "Focus de la consultation",
            type: "select",
            required: true,
            options: [
              { value: "strategy", label: "Stratégie d'entreprise" },
              { value: "growth", label: "Croissance/Développement" },
              { value: "operations", label: "Opérations" },
              { value: "startup", label: "Conseil startup" },
              { value: "restructuring", label: "Restructuration" },
              { value: "innovation", label: "Innovation" },
            ],
          },
          {
            id: "business_stage",
            label: "Stade de l'entreprise",
            type: "select",
            required: true,
            options: [
              { value: "idea", label: "Idée/Concept" },
              { value: "startup", label: "Startup (0-2 ans)" },
              { value: "growth", label: "Croissance (2-5 ans)" },
              { value: "mature", label: "Mature (5+ ans)" },
            ],
          },
          {
            id: "duration",
            label: "Durée",
            type: "select",
            required: true,
            options: [
              { value: "session", label: "Session unique (1-2h)" },
              { value: "short", label: "Court terme (1 mois)" },
              { value: "medium", label: "Moyen terme (3-6 mois)" },
              { value: "long", label: "Long terme (6+ mois)" },
            ],
          },
        ],
      },
      "hr-consulting": {
        label: "Conseil en Ressources Humaines",
        metadata: [
          {
            id: "hr_service",
            label: "Service RH",
            type: "select",
            required: true,
            options: [
              { value: "recruitment", label: "Recrutement" },
              { value: "policy", label: "Politiques RH" },
              { value: "training", label: "Formation/Développement" },
              { value: "performance", label: "Gestion de performance" },
              { value: "compensation", label: "Rémunération/Avantages" },
              { value: "culture", label: "Culture d'entreprise" },
            ],
          },
          {
            id: "company_size",
            label: "Taille de l'entreprise",
            type: "select",
            required: true,
            options: [
              { value: "small", label: "Petite (1-50 employés)" },
              { value: "medium", label: "Moyenne (51-250 employés)" },
              { value: "large", label: "Grande (250+ employés)" },
            ],
          },
        ],
      },
      "financial-consulting": {
        label: "Conseil Financier",
        metadata: [
          {
            id: "financial_service",
            label: "Service financier",
            type: "select",
            required: true,
            options: [
              { value: "planning", label: "Planification financière" },
              { value: "analysis", label: "Analyse financière" },
              { value: "budgeting", label: "Budgétisation" },
              { value: "forecasting", label: "Prévisions financières" },
              { value: "fundraising", label: "Levée de fonds" },
              { value: "valuation", label: "Évaluation d'entreprise" },
            ],
          },
          {
            id: "deliverable",
            label: "Livrable principal",
            type: "select",
            required: true,
            options: [
              { value: "report", label: "Rapport financier" },
              { value: "model", label: "Modèle financier" },
              { value: "strategy", label: "Stratégie financière" },
              { value: "presentation", label: "Présentation investisseurs" },
            ],
          },
        ],
      },
      "it-consulting": {
        label: "Conseil IT",
        metadata: [
          {
            id: "it_service",
            label: "Service IT",
            type: "select",
            required: true,
            options: [
              { value: "infrastructure", label: "Infrastructure IT" },
              { value: "security", label: "Sécurité informatique" },
              { value: "cloud", label: "Migration cloud" },
              { value: "architecture", label: "Architecture système" },
              { value: "digital", label: "Transformation digitale" },
              { value: "audit", label: "Audit IT" },
            ],
          },
          {
            id: "complexity",
            label: "Complexité",
            type: "select",
            required: true,
            options: [
              { value: "basic", label: "Basique" },
              { value: "intermediate", label: "Intermédiaire" },
              { value: "advanced", label: "Avancé" },
              { value: "enterprise", label: "Entreprise" },
            ],
          },
        ],
      },
      "marketing-consulting": {
        label: "Conseil en Marketing",
        metadata: [
          {
            id: "consulting_type",
            label: "Type de conseil",
            type: "select",
            required: true,
            options: [
              { value: "strategy", label: "Stratégie marketing" },
              { value: "digital", label: "Marketing digital" },
              { value: "branding", label: "Branding/Positionnement" },
              { value: "content", label: "Stratégie de contenu" },
              { value: "growth", label: "Growth marketing" },
              { value: "audit", label: "Audit marketing" },
            ],
          },
          {
            id: "scope",
            label: "Portée",
            type: "select",
            required: true,
            options: [
              { value: "specific", label: "Canal spécifique" },
              { value: "multiChannel", label: "Multi-canal" },
              { value: "complete", label: "Stratégie complète" },
            ],
          },
        ],
      },
      "strategy-consulting": {
        label: "Conseil en Stratégie",
        metadata: [
          {
            id: "strategy_area",
            label: "Domaine stratégique",
            type: "select",
            required: true,
            options: [
              { value: "corporate", label: "Stratégie corporate" },
              { value: "market", label: "Stratégie de marché" },
              { value: "competitive", label: "Stratégie concurrentielle" },
              { value: "expansion", label: "Expansion/Croissance" },
              { value: "digital", label: "Transformation digitale" },
              { value: "innovation", label: "Innovation" },
            ],
          },
          {
            id: "deliverables",
            label: "Livrables",
            type: "multiselect",
            required: true,
            options: [
              { value: "analysis", label: "Analyse stratégique" },
              { value: "roadmap", label: "Roadmap stratégique" },
              { value: "framework", label: "Framework de décision" },
              { value: "presentation", label: "Présentation executive" },
              { value: "implementation", label: "Plan d'implémentation" },
            ],
          },
        ],
      },
    },
  },
};

// ============================================
// MAPPING : Occupation → categoriesData
// ============================================
const occupationMapping: {
  [key: string]: { category: string; subcategory: string };
} = {
  // Digital Marketing
  "Affiliate Marketing": {
    category: "marketing-digital",
    subcategory: "affiliate-marketing",
  },
  "Email Marketing": {
    category: "marketing-digital",
    subcategory: "email-marketing",
  },
  SEO: { category: "marketing-digital", subcategory: "seo" },
  "Social Media Marketing": {
    category: "marketing-digital",
    subcategory: "social-media-marketing",
  },
  "Content Marketing": {
    category: "marketing-digital",
    subcategory: "content-marketing",
  },
  "PPC Advertising": {
    category: "marketing-digital",
    subcategory: "ppc-advertising",
  },
  "Marketing Strategy": {
    category: "marketing-digital",
    subcategory: "marketing-strategy",
  },

  // Graphic Design
  "Logo Design": { category: "design-graphique", subcategory: "logo-design" },
  "Brand Identity": {
    category: "design-graphique",
    subcategory: "brand-identity",
  },
  "Web Design": { category: "design-graphique", subcategory: "web-design" },
  "UI/UX Design": { category: "design-graphique", subcategory: "uiux-design" },
  Illustration: { category: "design-graphique", subcategory: "illustration" },
  "Packaging Design": {
    category: "design-graphique",
    subcategory: "packaging-design",
  },
  "Motion Graphics": {
    category: "design-graphique",
    subcategory: "motion-graphics",
  },

  // Web Development
  "Frontend Development": {
    category: "programmation-tech",
    subcategory: "dev-web-frontend",
  },
  "Backend Development": {
    category: "programmation-tech",
    subcategory: "dev-web-backend",
  },
  "Full Stack Development": {
    category: "programmation-tech",
    subcategory: "dev-web-fullstack",
  },
  WordPress: { category: "programmation-tech", subcategory: "dev-wordpress" },
  "E-commerce Development": {
    category: "programmation-tech",
    subcategory: "dev-ecommerce",
  },
  "Mobile App Development": {
    category: "programmation-tech",
    subcategory: "dev-mobile",
  },

  // Writing
  "Content Writing": {
    category: "redaction-traduction",
    subcategory: "content-writing",
  },
  Copywriting: { category: "redaction-traduction", subcategory: "copywriting" },
  "Technical Writing": {
    category: "redaction-traduction",
    subcategory: "technical-writing",
  },
  Translation: { category: "redaction-traduction", subcategory: "translation" },
  "Blog Writing": {
    category: "redaction-traduction",
    subcategory: "blog-writing",
  },
  "SEO Writing": {
    category: "redaction-traduction",
    subcategory: "seo-writing",
  },
  Ghostwriting: {
    category: "redaction-traduction",
    subcategory: "ghostwriting",
  },

  // Audiovisuel
  "Video Editing": { category: "audiovisuel", subcategory: "video-editing" },
  "Audio Production": {
    category: "audiovisuel",
    subcategory: "audio-production",
  },
  Animation: { category: "audiovisuel", subcategory: "animation" },
  Photography: { category: "audiovisuel", subcategory: "photography" },
  "Voice Over": { category: "audiovisuel", subcategory: "voice-over" },
  "Music Production": {
    category: "audiovisuel",
    subcategory: "music-production",
  },
  "Sound Design": { category: "audiovisuel", subcategory: "sound-design" },

  // Consultation
  "Business Consulting": {
    category: "consultation",
    subcategory: "business-consulting",
  },
  "HR Consulting": { category: "consultation", subcategory: "hr-consulting" },
  "Financial Consulting": {
    category: "consultation",
    subcategory: "financial-consulting",
  },
  "IT Consulting": { category: "consultation", subcategory: "it-consulting" },
  "Marketing Consulting": {
    category: "consultation",
    subcategory: "marketing-consulting",
  },
  "Strategy Consulting": {
    category: "consultation",
    subcategory: "strategy-consulting",
  },
};

export function getCategoriesByOccupations(
  userOccupations: string[] | string
): typeof categoriesData {
  // Normaliser en array
  const occupations = Array.isArray(userOccupations)
    ? userOccupations
    : [userOccupations];

  // Map pour stocker les catégories filtrées
  const filteredCategories: any = {};

  // Pour chaque occupation de l'utilisateur
  occupations.forEach((occupation) => {
    const mapping = occupationMapping[occupation];

    if (!mapping) {
      console.warn(
        `⚠️ Occupation "${occupation}" n'a pas de correspondance dans categoriesData`
      );
      return;
    }

    const { category, subcategory } = mapping;

    // Si la catégorie n'existe pas encore, on l'ajoute
    if (!filteredCategories[category]) {
      filteredCategories[category] = {
        label: categoriesData[category as keyof typeof categoriesData].label,
        subcategories: {},
      };
    }

    // Ajouter la sous-catégorie
    if (
      category in categoriesData &&
      subcategory in
        categoriesData[category as keyof typeof categoriesData].subcategories
    ) {
      filteredCategories[category].subcategories[subcategory] =
        categoriesData[category as keyof typeof categoriesData].subcategories[
          subcategory as keyof (typeof categoriesData)[keyof typeof categoriesData]["subcategories"]
        ];
    }
  });

  return filteredCategories;
}
// FIN DU FICHIER - RIEN APRÈS

// ============================================
// TAGS DE RECHERCHE (100+ tags)
// ============================================
export const searchTags = {
  // Technologies & Frameworks (20 tags)
  technologies: [
    "React",
    "Vue.js",
    "Angular",
    "Next.js",
    "Node.js",
    "Python",
    "PHP",
    "Laravel",
    "WordPress",
    "Shopify",
    "JavaScript",
    "TypeScript",
    "HTML",
    "CSS",
    "Tailwind",
    "Bootstrap",
    "MongoDB",
    "MySQL",
    "PostgreSQL",
    "Firebase",
  ],

  // Design & Creative (20 tags)
  design: [
    "Logo Design",
    "Graphic Design",
    "UI Design",
    "UX Design",
    "Web Design",
    "Mobile Design",
    "Brand Identity",
    "Illustration",
    "Icon Design",
    "Packaging Design",
    "Print Design",
    "Figma",
    "Photoshop",
    "Illustrator",
    "Sketch",
    "Adobe XD",
    "Canva",
    "3D Design",
    "Motion Design",
    "Animation",
  ],

  // Marketing & SEO (15 tags)
  marketing: [
    "SEO",
    "Digital Marketing",
    "Social Media",
    "Facebook Ads",
    "Google Ads",
    "Instagram Marketing",
    "Content Marketing",
    "Email Marketing",
    "Copywriting",
    "Marketing Strategy",
    "Growth Hacking",
    "PPC",
    "Lead Generation",
    "Conversion Optimization",
    "Analytics",
  ],

  // Writing & Content (15 tags)
  writing: [
    "Content Writing",
    "Blog Writing",
    "Article Writing",
    "Technical Writing",
    "Ghostwriting",
    "Translation",
    "Proofreading",
    "Editing",
    "SEO Writing",
    "Product Description",
    "Resume Writing",
    "Business Writing",
    "Creative Writing",
    "Script Writing",
    "Newsletter",
  ],

  // Video & Audio (15 tags)
  multimedia: [
    "Video Editing",
    "Motion Graphics",
    "Animation",
    "2D Animation",
    "3D Animation",
    "Whiteboard Animation",
    "Explainer Video",
    "YouTube Video",
    "Video Production",
    "Audio Editing",
    "Voice Over",
    "Podcast Editing",
    "Sound Design",
    "Music Production",
    "Video Ads",
  ],

  // Business & Consulting (15 tags)
  business: [
    "Business Consulting",
    "Strategy Consulting",
    "Financial Consulting",
    "HR Consulting",
    "IT Consulting",
    "Marketing Consulting",
    "Business Plan",
    "Market Research",
    "Financial Analysis",
    "Project Management",
    "Startup Consulting",
    "Business Development",
    "Operations",
    "Process Improvement",
    "Change Management",
  ],

  // Development Types (10 tags)
  developmentTypes: [
    "Website Development",
    "E-commerce",
    "Mobile App",
    "Web Application",
    "API Development",
    "Custom Software",
    "SaaS Development",
    "CMS Development",
    "Plugin Development",
    "Theme Development",
  ],

  // Platforms & Tools (10 tags)
  platforms: [
    "WooCommerce",
    "Magento",
    "PrestaShop",
    "Wix",
    "Squarespace",
    "Webflow",
    "Elementor",
    "Mailchimp",
    "HubSpot",
    "Salesforce",
  ],
};

// ============================================
// FONCTION : Obtenir tous les tags (liste plate)
// ============================================
export function getAllSearchTags(): string[] {
  return [
    ...searchTags.technologies,
    ...searchTags.design,
    ...searchTags.marketing,
    ...searchTags.writing,
    ...searchTags.multimedia,
    ...searchTags.business,
    ...searchTags.developmentTypes,
    ...searchTags.platforms,
  ];
}

// ============================================
// FONCTION : Obtenir tags par catégorie
// ============================================
export function getTagsByCategory(categoryKey: string): string[] {
  const categoryTagMapping: { [key: string]: string[] } = {
    "programmation-tech": [
      ...searchTags.technologies,
      ...searchTags.developmentTypes,
      ...searchTags.platforms,
      "Full Stack",
      "Frontend",
      "Backend",
      "API",
      "Database",
      "Cloud",
      "DevOps",
    ],
    "design-graphique": [
      ...searchTags.design,
      "Brand Design",
      "Visual Identity",
      "Corporate Design",
      "Creative Design",
      "Modern Design",
      "Minimalist Design",
      "Professional Design",
    ],
    "redaction-traduction": [
      ...searchTags.writing,
      "French Translation",
      "English Translation",
      "Spanish Translation",
      "Localization",
      "Transcription",
      "Subtitles",
    ],
    audiovisuel: [
      ...searchTags.multimedia,
      "Premiere Pro",
      "After Effects",
      "Final Cut Pro",
      "DaVinci Resolve",
      "Pro Tools",
      "Logic Pro",
      "Ableton Live",
    ],
    "marketing-digital": [
      ...searchTags.marketing,
      "Facebook Marketing",
      "LinkedIn Marketing",
      "TikTok Marketing",
      "Twitter Marketing",
      "Influencer Marketing",
      "Affiliate Marketing",
    ],
    consultation: [
      ...searchTags.business,
      "Executive Coaching",
      "Leadership",
      "Strategic Planning",
      "Risk Management",
      "Compliance",
      "Audit",
    ],
  };

  return categoryTagMapping[categoryKey] || [];
}

// ============================================
// FONCTION : Rechercher services par tags
// ============================================
export function searchServicesByTags(
  searchQuery: string,
  allTags: string[] = getAllSearchTags()
): string[] {
  const query = searchQuery.toLowerCase().trim();

  return allTags.filter(
    (tag) =>
      tag.toLowerCase().includes(query) || query.includes(tag.toLowerCase())
  );
}

// ============================================
// FONCTION : Tags suggérés (populaires)
// ============================================
export const popularTags: string[] = [
  "WordPress",
  "Logo Design",
  "SEO",
  "Video Editing",
  "React",
  "Content Writing",
  "Social Media",
  "UI/UX Design",
  "E-commerce",
  "Mobile App",
  "Translation",
  "Animation",
  "Copywriting",
  "Photoshop",
  "Digital Marketing",
];

// ============================================
// FONCTION : Tags par niveau de compétence
// ============================================
export const tagsBySkillLevel = {
  beginner: [
    "WordPress Setup",
    "Basic Logo",
    "Social Media Posts",
    "Simple Website",
    "Data Entry",
    "Basic Editing",
    "Content Formatting",
    "Image Resizing",
  ],
  intermediate: [
    "Custom WordPress",
    "Professional Logo",
    "Social Media Strategy",
    "Responsive Website",
    "SEO Optimization",
    "Video Editing",
    "Content Strategy",
    "Brand Identity",
  ],
  advanced: [
    "Custom Development",
    "Complete Branding",
    "Marketing Campaign",
    "Web Application",
    "Advanced SEO",
    "Motion Graphics",
    "Technical Documentation",
    "UX Research",
  ],
  expert: [
    "Enterprise Solution",
    "Brand Architecture",
    "Growth Strategy",
    "SaaS Platform",
    "International SEO",
    "3D Animation",
    "White Papers",
    "Service Design",
  ],
};

// ============================================
// FONCTION : Obtenir tags suggérés selon occupation
// ============================================
export function getSuggestedTags(occupation: string): string[] {
  const occupationTagsMap: { [key: string]: string[] } = {
    "Frontend Development": [
      "React",
      "Vue.js",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Responsive Design",
      "UI Development",
      "PWA",
    ],
    "Backend Development": [
      "Node.js",
      "Python",
      "API Development",
      "Database Design",
      "MongoDB",
      "PostgreSQL",
      "REST API",
      "GraphQL",
    ],
    "Logo Design": [
      "Brand Identity",
      "Visual Identity",
      "Corporate Logo",
      "Minimalist Logo",
      "Modern Logo",
      "Icon Design",
      "Vector Design",
    ],
    SEO: [
      "On-Page SEO",
      "Technical SEO",
      "Keyword Research",
      "Link Building",
      "Local SEO",
      "SEO Audit",
      "Google Analytics",
    ],
    "Video Editing": [
      "Premiere Pro",
      "Final Cut Pro",
      "Color Grading",
      "Motion Graphics",
      "YouTube Videos",
      "Social Media Videos",
      "Video Ads",
    ],
    "Content Writing": [
      "Blog Writing",
      "SEO Content",
      "Article Writing",
      "Website Content",
      "Product Descriptions",
      "Newsletter",
    ],
  };

  return occupationTagsMap[occupation] || [];
}

// ============================================
// FONCTION : Sélecteur de Tags Simple
// ============================================

export const useTagSelection = (
  initialTags: string[] = [],
  maxTags: number = 5
) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  const addTag = (tag: string) => {
    if (selectedTags.length < maxTags && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
      return true;
    }
    return false;
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  return {
    selectedTags,
    addTag,
    removeTag,
    clearTags,
    isFull: selectedTags.length >= maxTags,
  };
};

// ============================================
// FONCTION : Recherche et suggestions de tags
// ============================================

export const useTagSuggestions = (selectedTags: string[]) => {
  const [searchTerm, setSearchTerm] = useState("");

  const allTags = useMemo(() => getAllSearchTags(), []);
  const popularTagsList = useMemo(() => popularTags, []);

  const suggestedTags = useMemo(() => {
    if (searchTerm.trim()) {
      // Recherche
      return allTags
        .filter(
          (tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !selectedTags.includes(tag)
        )
        .slice(0, 10);
    } else {
      // Tags populaires
      return popularTagsList
        .filter((tag) => !selectedTags.includes(tag))
        .slice(0, 8);
    }
  }, [searchTerm, allTags, popularTagsList, selectedTags]);

  return {
    searchTerm,
    setSearchTerm,
    suggestedTags,
  };
};

// ============================================
// EXPORT COMBINÉ : Tous les tags + fonction
// ============================================
// ============================================
// EXPORT COMBINÉ : Tous les tags + fonctions
// ============================================
export const serviceTags = {
  all: getAllSearchTags(),
  popular: popularTags,
  byLevel: tagsBySkillLevel,
  byCategory: searchTags,
  search: searchServicesByTags,
  getSuggested: getSuggestedTags,
  getByCategory: getTagsByCategory,
  useTagSelection, // AJOUTER cette ligne
  useTagSuggestions, // AJOUTER cette ligne
};
