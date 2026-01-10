// Service Creation Guidance Content
// All tooltips, examples, and best practices for the service creation form

export const SERVICE_GUIDANCE = {
  title: {
    label: "Comment créer un bon titre ?",
    content: "Un bon titre doit être clair, spécifique et inclure ce que vous allez livrer. Commencez par 'Je vais' suivi de l'action précise. Évitez les titres trop courts ou vagues.",
    examples: [
      "✅ Je vais créer votre logo professionnel en 24h",
      "✅ Je vais développer votre site web WordPress sur mesure",
      "✅ Je vais rédiger 10 articles SEO optimisés pour votre blog",
      "❌ Logo design (trop court et vague)",
      "❌ Je fais des trucs de design graphique (pas professionnel)",
    ],
  },

  shortDescription: {
    label: "Description qui attire l'attention",
    content: "Mettez en avant vos points forts et ce qui est inclus dans votre offre de base. Utilisez des mots-clés pertinents que vos clients recherchent.",
    examples: [
      "✅ Logo unique + fichiers sources (AI, PSD, PNG) + révisions illimitées",
      "✅ Site responsive, rapide et optimisé SEO avec formation gratuite",
      "✅ Rédaction professionnelle avec recherche de mots-clés incluse",
      "❌ Je fais des logos (pas assez détaillé)",
    ],
  },

  description: {
    label: "Structure recommandée pour la description",
    content: (
      <div className="space-y-2">
        <p><strong>1. Introduction</strong> - Présentez-vous brièvement (qui êtes-vous, votre expertise)</p>
        <p><strong>2. Ce que vous offrez</strong> - Détails précis du service</p>
        <p><strong>3. Votre processus</strong> - Comment vous travaillez, les étapes</p>
        <p><strong>4. Pourquoi vous choisir</strong> - Votre expérience, vos résultats</p>
        <p><strong>5. Ce qui est inclus</strong> - Liste précise des livrables</p>
      </div>
    ),
    examples: [
      "✅ Utilisez des bullet points • pour la lisibilité",
      "✅ Ajoutez des émojis pertinents 🎨 pour structurer",
      "✅ Mentionnez vos années d'expérience et réalisations",
      "✅ Soyez concret : '5+ ans', '100+ projets livrés'",
    ],
  },

  basePrice: {
    label: "Comment fixer votre prix ?",
    content: "Le prix de base doit couvrir votre service minimum avec la qualité promise. Les clients veulent du value for money. Regardez la concurrence mais ne vous sous-évaluez pas.",
    examples: [
      "💡 Débutant (< 1 an): 25-50€",
      "💡 Intermédiaire (1-3 ans): 50-150€",
      "💡 Expert (3-5 ans): 150-300€",
      "💡 Pro reconnu (5+ ans): 300-1000€+",
    ],
  },

  deliveryTime: {
    label: "Choisir le bon délai",
    content: "Soyez réaliste ! Mieux vaut livrer en avance qu'en retard. Ajoutez toujours une marge pour les imprévus. Un délai trop court peut stresser et diminuer la qualité.",
    examples: [
      "✅ Logo simple: 1-3 jours",
      "✅ Identité visuelle complète: 5-7 jours",
      "✅ Site web vitrine: 7-14 jours",
      "✅ Site e-commerce: 14-30 jours",
      "✅ Application mobile: 30-60 jours",
    ],
  },

  revisions: {
    label: "Combien de révisions inclure ?",
    content: "Les révisions permettent au client d'ajuster le travail. 2-3 révisions est un bon équilibre. NE proposez PAS 'illimité' sauf si vous êtes vraiment sûr - ça peut devenir cauchemardesque !",
    examples: [
      "📝 Logo/Design graphique: 2-3 révisions",
      "📝 Texte/Rédaction: 1-2 révisions",
      "📝 Développement web: 1 révision majeure",
      "📝 Vidéo/Animation: 2 révisions",
      "💡 Note: Les corrections de bugs sont toujours gratuites et illimitées",
    ],
  },

  categories: {
    label: "Bien catégoriser votre service",
    content: "Choisissez les catégories les plus pertinentes et spécifiques. Maximum 3 catégories recommandé pour un ciblage précis. Plus c'est spécifique, mieux c'est !",
    examples: [
      "✅ Design Graphique → Logo & Identité → Logo Design",
      "✅ Programmation → WordPress → Développement sur mesure",
      "✅ Marketing Digital → SEO → Optimisation on-page",
      "❌ Sélectionner 10 catégories différentes (trop large)",
    ],
  },

  tags: {
    label: "Tags pour être trouvé facilement",
    content: "Utilisez 5-10 mots-clés que vos clients potentiels pourraient rechercher. Pensez comme un client, pas comme un vendeur. Incluez des termes techniques ET des termes courants.",
    examples: [
      "💡 Pour logo: logo, design, branding, identité visuelle, création logo, logo professionnel",
      "💡 Pour site web: wordpress, site web, développement web, responsive, ecommerce, boutique en ligne",
      "💡 Pour SEO: référencement, google, seo, optimisation, trafic organique",
    ],
  },

  requirements: {
    label: "Que demander au client pour commencer ?",
    content: "Demandez UNIQUEMENT les informations essentielles pour démarrer le travail. Trop d'exigences peuvent décourager. Vous pourrez toujours demander plus tard si besoin.",
    examples: [
      "📋 Pour un logo: 'Nom de l'entreprise' (texte), 'Couleurs préférées' (texte), 'Logo existant ou inspiration' (fichier optionnel)",
      "📋 Pour un site web: 'Contenu des pages' (fichier), 'Images à utiliser' (fichier), 'Site exemple que vous aimez' (URL)",
      "📋 Pour rédaction: 'Sujet précis' (texte), 'Mots-clés cibles' (texte), 'Ton souhaité' (texte)",
    ],
  },

  extras: {
    label: "Créer des extras rentables",
    content: "Les extras sont des options payantes qui augmentent votre revenu moyen. Proposez des upgrades logiques et tentants. C'est ici que vous gagnez vraiment !",
    examples: [
      "💎 Livraison express (+50% du prix, -50% du délai)",
      "💎 Fichiers sources éditables (+20-30€)",
      "💎 Révisions supplémentaires (+10-15€ par révision)",
      "💎 Version imprimable haute résolution (+25€)",
      "💎 Logo animé/vidéo (+50-100€)",
      "💎 Charte graphique complète (+100€)",
    ],
  },

  faq: {
    label: "Questions fréquentes essentielles",
    content: "Répondez aux questions que TOUS les clients posent. Cela vous fait gagner du temps et rassure les acheteurs potentiels. 3-5 FAQ suffisent.",
    examples: [
      "❓ Que vais-je recevoir exactement ?",
      "❓ Combien de temps prennent les révisions ?",
      "❓ Puis-je annuler ma commande et être remboursé ?",
      "❓ Proposez-vous un support après livraison ?",
      "❓ Quels formats de fichiers sont livrés ?",
      "❓ Puis-je utiliser ceci commercialement ?",
    ],
  },

  images: {
    label: "Montrez votre meilleur travail",
    content: "Les images sont CRUCIALES - elles sont la première chose que voient les clients. Utilisez vos meilleures réalisations. Qualité > Quantité.",
    examples: [
      "📸 Image de couverture: Votre meilleure et plus représentative réalisation",
      "📸 Galerie: 3-5 exemples variés de travaux terminés",
      "🎥 Vidéo de présentation: 30s-1min montrant vos services (très efficace !)",
      "💡 Astuce: Before/After est très impactant !",
      "💡 Évitez les images floues ou de mauvaise qualité",
    ],
  },

  location: {
    label: "Type de service proposé",
    content: "Indiquez clairement où et comment vous fournissez votre service. Vous pouvez proposer les deux options si applicable.",
    examples: [
      "💡 À distance: Parfait pour design, développement, rédaction, consulting",
      "💡 Sur place: Nécessaire pour photographie, événements, installations, formations en personne",
      "💡 Les deux: Ex. coaching (en ligne OU en personne), réparations, etc.",
    ],
  },
};
