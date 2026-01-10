"use client";
import React, { useState } from "react";
import {
  Search,
  Star,
  CheckCircle,
  Users,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Play,
  Menu,
  X,
  DollarSign,
  Award,
  Globe,
  Headphones,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard,
  MessageCircle,
  Camera,
  BarChart3,
  Target,
  Briefcase,
  Heart,
} from "lucide-react";

const BecomeFrelancePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const trustStats = [
    { number: "2M+", label: "Freelances actifs" },
    { number: "€50M+", label: "Versés chaque mois" },
    { number: "4.9/5", label: "Satisfaction client" },
    { number: "190+", label: "Pays représentés" },
  ];

  const successStories = [
    {
      name: "Laura Benoit",
      specialty: "Développeuse Full-Stack",
      earnings: "€4,500/mois",
      comment: "Anylibre m'a permis de doubler mes revenus en 6 mois !",
      avatar: "👩‍💻",
      rating: 5,
    },
    {
      name: "Marco Silva",
      specialty: "Designer UI/UX",
      earnings: "€3,200/mois",
      comment: "Clients de qualité et paiements toujours à l'heure.",
      avatar: "👨‍🎨",
      rating: 5,
    },
    {
      name: "Sarah Ahmed",
      specialty: "Consultante Marketing",
      earnings: "€5,800/mois",
      comment: "La plateforme parfaite pour développer mon business.",
      avatar: "👩‍💼",
      rating: 5,
    },
  ];

  const workingSteps = [
    {
      step: "1",
      title: "Créez votre profil",
      description:
        "Présentez vos compétences, ajoutez votre portfolio et définissez vos tarifs",
      icon: <FileText className="text-blue-500" size={32} />,
      color: "blue",
    },
    {
      step: "2",
      title: "Publiez vos services",
      description:
        "Créez des offres attrayantes avec des descriptions claires et des prix compétitifs",
      icon: <Target className="text-yellow-500" size={32} />,
      color: "yellow",
    },
    {
      step: "3",
      title: "Recevez des commandes",
      description:
        "Les clients découvrent vos services et vous contactent pour leurs projets",
      icon: <MessageCircle className="text-green-500" size={32} />,
      color: "green",
    },
    {
      step: "4",
      title: "Travaillez et facturez",
      description:
        "Livrez vos projets et recevez vos paiements de manière sécurisée",
      icon: <CreditCard className="text-red-500" size={32} />,
      color: "red",
    },
  ];

  const features = [
    {
      icon: <Shield className="text-green-500" size={24} />,
      title: "Paiements sécurisés",
      description:
        "Vos revenus sont protégés avec notre système de paiement escrow",
    },
    {
      icon: <BarChart3 className="text-blue-500" size={24} />,
      title: "Outils d'analyse",
      description: "Suivez vos performances et optimisez vos offres",
    },
    {
      icon: <Headphones className="text-yellow-500" size={24} />,
      title: "Support dédié",
      description: "Équipe support disponible 24/7 pour vous accompagner",
    },
    {
      icon: <Award className="text-red-500" size={24} />,
      title: "Programme de fidélité",
      description: "Plus vous vendez, moins vous payez de commissions",
    },
    {
      icon: <Globe className="text-purple-500" size={24} />,
      title: "Clients internationaux",
      description: "Accédez à un marché mondial de clients qualifiés",
    },
    {
      icon: <Camera className="text-orange-500" size={24} />,
      title: "Portfolio intégré",
      description: "Mettez en valeur vos réalisations avec notre galerie",
    },
  ];

  const faqs = [
    {
      question: "Comment puis-je commencer à vendre sur Anylibre ?",
      answer:
        "Il suffit de créer un compte gratuit, compléter votre profil professionnel, ajouter vos compétences et créer votre première offre de service. Notre équipe vérifie votre profil sous 24h.",
    },
    {
      question: "Quelles sont les commissions d'Anylibre ?",
      answer:
        "Nous prenons 20% sur vos premières ventes, puis ce taux diminue à 15% après 100€ de ventes, et 10% après 1000€ de ventes. Les Top Freelances ne paient que 5% de commission.",
    },
    {
      question: "Quand et comment suis-je payé ?",
      answer:
        "Les paiements sont libérés 14 jours après la livraison confirmée. Vous pouvez retirer vos gains via PayPal, virement bancaire ou carte Payoneer sans frais supplémentaires.",
    },
    {
      question: "Puis-je proposer des services dans ma langue locale ?",
      answer:
        "Absolument ! Anylibre supporte plus de 25 langues. Vous pouvez créer des offres en français, anglais, espagnol, allemand, etc. et cibler les clients de votre région.",
    },
    {
      question: "Comment puis-je me démarquer de la concurrence ?",
      answer:
        "Créez un profil complet avec portfolio, obtenez vos premières évaluations 5 étoiles, répondez rapidement aux messages, et proposez des services uniques avec une valeur ajoutée claire.",
    },
    {
      question: "Y a-t-il des frais cachés ou des coûts d'inscription ?",
      answer:
        "L'inscription est 100% gratuite. Nous ne prenons une commission que lorsque vous réalisez une vente. Aucun frais mensuel, aucun frais de listing, aucun coût caché.",
    },
    {
      question: "Que se passe-t-il si un client n'est pas satisfait ?",
      answer:
        "Nous avons un système de résolution de litiges équitable. En cas de problème, notre équipe médiation intervient pour trouver une solution. Vous êtes protégé contre les abus.",
    },
    {
      question: "Puis-je travailler avec des clients récurrents ?",
      answer:
        "Oui ! Une fois qu'un client vous fait confiance, vous pouvez établir une relation long-terme. Beaucoup de freelances ont des clients récurrents qui représentent 70% de leurs revenus.",
    },
  ];

  const toggleFaq = (index: any) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}

      {/* Hero Banner */}
      <section className="bg-linear-to-br from-yellow-50 via-white to-blue-50 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-yellow-100/30 to-blue-100/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap size={16} className="mr-2" />
                #1 Plateforme Freelance en France
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transformez vos{" "}
                <span className="text-yellow-500">compétences</span>
                <br />
                en <span className="text-blue-600">revenus</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Rejoignez plus de 2 millions de freelances qui gagnent en
                moyenne <strong className="text-gray-900">€3,500/mois</strong>
                en vendant leurs services sur Anylibre. Inscription gratuite,
                premiers gains sous 48h.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="/FreelanceRegistrationForm"
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
                >
                  <Play size={20} className="mr-2" />
                  Commencer maintenant
                </a>
                <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                  Voir comment ça marche
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  Inscription gratuite
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  Paiements sécurisés
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  Support 24/7
                </div>
              </div>
            </div>

            {/* Right Content - Visual */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="bg-linear-to-r from-green-400 to-blue-500 rounded-lg p-6 text-white mb-6">
                  <h3 className="text-2xl font-bold mb-2">€4,850</h3>
                  <p className="text-green-100">Revenus ce mois</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Commandes actives</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Note moyenne</span>
                    <div className="flex items-center">
                      <Star
                        className="text-yellow-400 fill-current"
                        size={16}
                      />
                      <span className="font-semibold ml-1">4.9</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Taux de réussite</span>
                    <span className="font-semibold text-green-600">98%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gray-900" id="confiance">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ils nous font <span className="text-yellow-400">confiance</span>
            </h2>
            <p className="text-xl text-gray-300">
              Des milliers de freelances réussissent chaque jour sur Anylibre
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {trustStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Success Stories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-4">{story.avatar}</div>
                  <div>
                    <h4 className="font-semibold text-white">{story.name}</h4>
                    <p className="text-gray-400 text-sm">{story.specialty}</p>
                    <p className="text-yellow-400 text-sm font-semibold">
                      {story.earnings}
                    </p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(story.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="text-yellow-400 fill-current"
                      size={16}
                    />
                  ))}
                </div>
                <p className="text-gray-300 italic">"{story.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Work on Anylibre */}
      <section className="py-20 bg-white" id="comment-ca-marche">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment travailler sur{" "}
              <span className="text-yellow-500">Anylibre</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un processus simple et efficace pour commencer à gagner de
              l'argent avec vos compétences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workingSteps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="bg-white border-4 border-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  {index < workingSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-20 w-24 h-0.5 bg-gray-200"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              Créer mon profil maintenant
            </button>
          </div>
        </div>
      </section>

      {/* Features & Advantages */}
      <section
        className="py-20 bg-linear-to-br from-blue-50 to-yellow-50"
        id="avantages"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir <span className="text-blue-600">Anylibre</span> ?
            </h2>
            <p className="text-xl text-gray-600">
              Tous les outils pour réussir en tant que freelance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white" id="tarifs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tarification <span className="text-green-500">transparente</span>
            </h2>
            <p className="text-xl text-gray-600">
              Plus vous vendez, moins vous payez
            </p>
          </div>

          <div className="bg-linear-to-r from-gray-50 to-blue-50 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-red-500 text-white rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold">Débutant</h3>
                  <div className="text-3xl font-bold mt-2">20%</div>
                </div>
                <p className="text-gray-600">0€ - 100€ de ventes</p>
              </div>
              <div className="text-center">
                <div className="bg-yellow-500 text-white rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold">Confirmé</h3>
                  <div className="text-3xl font-bold mt-2">15%</div>
                </div>
                <p className="text-gray-600">100€ - 1,000€ de ventes</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-500 text-white rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold">Expert</h3>
                  <div className="text-3xl font-bold mt-2">10%</div>
                </div>
                <p className="text-gray-600">1,000€ - 10,000€ de ventes</p>
              </div>
              <div className="text-center">
                <div className="bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold">Top Seller</h3>
                  <div className="text-3xl font-bold mt-2">5%</div>
                </div>
                <p className="text-gray-600">10,000€+ de ventes</p>
              </div>
            </div>

            <div className="text-center mt-8 p-6 bg-white rounded-lg">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="text-green-500 mr-2" size={24} />
                <span className="text-lg font-semibold text-gray-900">
                  Aucun frais caché
                </span>
              </div>
              <p className="text-gray-600">
                Inscription gratuite • Pas de frais mensuels • Commission
                uniquement sur les ventes réussies
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50" id="faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Questions <span className="text-yellow-500">fréquentes</span>
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir pour commencer
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  {openFaq === index ? (
                    <ChevronUp className="text-gray-500 shrink-0" size={24} />
                  ) : (
                    <ChevronDown className="text-gray-500 shrink-0" size={24} />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Vous avez d'autres questions ?</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Contacter le support
            </button>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 bg-linear-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Rejoignez une communauté de{" "}
            <span className="text-yellow-300">créateurs</span>
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Accédez à des formations exclusives, des webinaires, et
            connectez-vous avec d'autres freelances dans notre communauté privée
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center">
              <Users size={20} className="mr-2" />
              Rejoindre la communauté
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 rounded-lg font-semibold transition-colors">
              Voir les formations
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-linear-to-r from-yellow-400 to-yellow-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Prêt à transformer vos compétences en revenus ?
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            Rejoignez Anylibre aujourd'hui et commencez à gagner de l'argent dès
            demain
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg">
              Créer mon compte gratuit
            </button>
            <button className="bg-white text-gray-800 hover:bg-gray-100 px-10 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg">
              Parler à un conseiller
            </button>
          </div>
          <p className="text-gray-700 mt-6 text-sm">
            ✓ Inscription en 2 minutes • ✓ Premiers gains sous 48h • ✓ Support
            personnalisé inclus
          </p>
        </div>
      </section>
    </div>
  );
};

export default BecomeFrelancePage;
