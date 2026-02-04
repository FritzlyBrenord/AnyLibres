// ============================================================================
// Page: Provider Profile - Design Premium & Impressionnant
// Route: /provider/[id]
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProviderProfile, Service, Review, ReviewStats } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import TranslatedText from "@/components/common/TranslatedText";

// Components
import ProviderAbout from "@/components/provider/ProviderAbout";
import ProviderServices from "@/components/provider/ProviderServices";
import ProviderReviews from "@/components/provider/ProviderReviews";

// Icons
import {
  Star,
  Award,
  Shield,
  Clock,
  CheckCircle,
  Users,
  MapPin,
  Globe,
  Calendar,
  TrendingUp,
  Heart,
  Share2,
  MessageCircle,
  Briefcase,
  Trophy,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

interface ProviderData {
  provider: ProviderProfile & {
    profile?: {
      id: string;
      display_name?: string;
      avatar_url?: string;
      bio?: string;
      location?: string;
      website?: string;
      joined_date?: string;
    };
  };
  services: Service[];
  reviews: (Review & {
    service?: {
      id: string;
      title: any;
    };
  })[];
  stats: {
    total_services: number;
    total_reviews: number;
    average_rating: number;
    rating_distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
      0: number; // Added 0 for completeness
    };
    completion_rate?: number;
    response_time?: string;
    repeat_clients?: number;
  };
}

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const providerId = params.id as string;

  const [data, setData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "about" | "reviews">(
    "services"
  );
  const [isFollowing, setIsFollowing] = useState(false);

  // Charger les données du provider
  useEffect(() => {
    if (!providerId) return;

    const fetchProviderData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/providers/${providerId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load provider");
        }

        setData(result.data);
      } catch (err) {
        console.error("Error loading provider:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [providerId]);

  // Loading state premium
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mt-4">
            {t.providerProfile?.loading || "Chargement du profil"}
          </h3>
          <p className="text-gray-500 mt-2">
            {t.providerProfile?.loadingSubtitle || "Préparation de l'expérience exclusive"}
          </p>
        </div>
      </div>
    );
  }

  // Error state élégant
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Users className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t.providerProfile?.error || "Profil non disponible"}
          </h2>
          <p className="text-gray-600 mb-6">{error || t.common.error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-xl hover:from-slate-800 hover:to-slate-600 transition-all duration-200 font-medium shadow-lg"
            >
              ← {t.providerProfile?.back || "Retour"}
            </button>
            <button
              onClick={() => router.push("/explorer")}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-200 font-medium"
            >
              {t.providerProfile?.explore || "Explorer"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { provider, services, reviews, stats } = data;

  const reviewStats: ReviewStats = {
    average_rating: stats.average_rating,
    total_reviews: stats.total_reviews,
    rating_distribution: stats.rating_distribution,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Navigation Sticky */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                {t.providerProfile?.back || "Retour"}
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="text-sm text-gray-500">
                {t.providerProfile?.provider || "Prestataire"}{" "}
                <span className="font-medium text-gray-700">
                  #{provider.id.slice(0, 8)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`p-2 transition-colors rounded-lg hover:bg-gray-100 ${
                  isFollowing
                    ? "text-red-500"
                    : "text-gray-400 hover:text-red-500"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isFollowing ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section Impressionnante */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 text-white py-16 lg:py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-transparent via-black/10 to-black/30"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Colonne principale */}
            <div className="lg:col-span-2">
              {/* Badges de statut */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">
                    {stats.average_rating.toFixed(1)} ({stats.total_reviews}{" "}
                    {t.providerProfile?.reviews || "avis"})
                  </span>
                </div>
                {stats.completion_rate && stats.completion_rate > 90 && (
                  <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium">
                      {stats.completion_rate}{t.providerProfile?.successRate || "% réussite"}
                    </span>
                  </div>
                )}
                {stats.response_time && (
                  <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">
                      {t.providerProfile?.response || "Réponse:"} <TranslatedText text={stats.response_time} />
                    </span>
                  </div>
                )}
              </div>

              {/* Titre et informations */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 leading-tight break-words">
                {provider.company_name || provider.profile?.display_name}
              </h1>
              
              
              <div className="text-lg sm:text-xl md:text-2xl text-amber-400 font-medium mb-4 sm:mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="break-words">
                  <TranslatedText text={provider.profession || "Expert Anylibre"} />
                </span>
              </div>

              <div className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 mb-6 sm:mb-8 leading-relaxed max-w-2xl break-words whitespace-pre-wrap">
                <TranslatedText 
                  text={provider.tagline || provider.profile?.bio ||
                  "Prestataire professionnel offrant des services de qualité exceptionnelle"} 
                />
              </div>

              {/* Informations de contact et détails */}
              <div className="flex flex-wrap gap-6 text-gray-200">
                {(provider.profile?.location || (provider.location?.city && `${provider.location.city}, ${provider.location.country}`)) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>
                      {provider.profile?.location || `${provider.location?.city || ''}, ${provider.location?.country || ''}`}
                    </span>
                  </div>
                )}
                
                {provider.experience_years ? (
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    <span>{provider.experience_years} {t.providerProfile?.experience || "ans d'expérience"}</span>
                  </div>
                ) : null}

                {provider.profile?.joined_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {t.providerProfile?.memberSince || "Membre depuis"}{" "}
                      {new Date(provider.profile.joined_date).getFullYear()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques latérales */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                {t.providerProfile?.performance || "Performance"}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-200">{t.providerProfile?.services || "Services"}</span>
                  <span className="font-semibold text-white">
                    {stats.total_services}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-200">{t.providerProfile?.satisfiedClients || "Clients satisfaits"}</span>
                  <span className="font-semibold text-white">
                    {stats.repeat_clients || stats.total_reviews}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-200">{t.providerProfile?.successRateLabel || "Taux de réussite"}</span>
                  <span className="font-semibold text-green-400">
                    {stats.completion_rate || 95}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-200">{t.providerProfile?.responseTime || "Délai réponse"}</span>
                  <span className="font-semibold text-blue-400">
                    <TranslatedText text={stats.response_time || "1h"} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets premium */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-16 lg:top-20 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("services")}
              className={`py-5 px-4 font-semibold border-b-2 transition-all duration-200 flex items-center gap-2 ${
                activeTab === "services"
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              {t.providerProfile?.tabs?.services || "Services"} ({stats.total_services})
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`py-5 px-4 font-semibold border-b-2 transition-all duration-200 flex items-center gap-2 ${
                activeTab === "about"
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
              }`}
            >
              <Users className="w-5 h-5" />{t.providerProfile?.tabs?.about || "À propos"}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-5 px-4 font-semibold border-b-2 transition-all duration-200 flex items-center gap-2 ${
                activeTab === "reviews"
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
              }`}
            >
              <Star className="w-5 h-5" />
              {t.providerProfile?.tabs?.reviews || "Avis"} ({stats.total_reviews})
            </button>
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="container mx-auto px-4 py-8">
        {/* Services */}
        {activeTab === "services" && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t.providerProfile?.sections?.services || "Mes Services Premium"}
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {t.providerProfile?.sections?.servicesSubtitle || "Découvrez une sélection de services professionnels conçus pour exceller"}
              </p>
            </div>
            <ProviderServices services={services} />
          </div>
        )}

        {/* À propos */}
        {activeTab === "about" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t.providerProfile?.sections?.expertise || "Mon Expertise"}
              </h2>
              <p className="text-gray-600 text-lg">
                {t.providerProfile?.sections?.expertiseSubtitle || "Plus qu'un prestataire, un partenaire de confiance pour vos projets"}
              </p>
            </div>
            <ProviderAbout provider={provider} />
          </div>
        )}

        {/* Avis */}
        {activeTab === "reviews" && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t.providerProfile?.sections?.reviews || "Témoignages Clients"}
              </h2>
              <p className="text-gray-600 text-lg">
                {t.providerProfile?.sections?.reviewsSubtitle || "Ce que disent les clients satisfaits de mon travail"}
              </p>
            </div>
            <ProviderReviews reviews={reviews} stats={reviewStats} />
          </div>
        )}
      </div>

      {/* Call-to-action flottant pour mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex gap-3">
          <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold text-center">
            {t.providerProfile?.mobile?.contact || "Contacter"}
          </button>
          <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold text-center">
            {t.providerProfile?.mobile?.viewServices || "Voir les services"}
          </button>
        </div>
      </div>
    </div>
  );
}
