// ============================================================================
// Page: Service Detail - Design Classique & Impressionnant
// Route: /service/[id]
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Service, Review, ReviewStats } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import { userTracker } from "@/lib/tracking/userTracker";
import { useSmartTranslate } from "@/hooks/useSmartTranslate";

// Components
import ServiceImages from "@/components/service/ServiceImages";
import ServiceDescription from "@/components/service/ServiceDescription";
import ServicePricing from "@/components/service/ServicePricing";
import { ProviderCard } from "@/components/service/ProviderCard";
import ReviewsSection from "@/components/service/ReviewsSection";
import SimilarServices from "@/components/service/SimilarServices";
import FavoriteButton from "@/components/service/FavoriteButton";
import OrderMessagingModal from "@/components/message/OrderMessagingModal";
import ShareModal from "@/components/common/ShareModal";

// Icons
import {
  ArrowLeft,
  Star,
  Shield,
  Clock,
  CheckCircle,
  Sparkles,
  Award,
  Zap,
  Heart,
  Share2,
  Eye,
} from "lucide-react";
import ServiceMedia from "@/components/service/ServiceMedia";
import { SmartBackButton } from "@/components/common/SmartBackButton";

interface ServiceDetailData {
  service: Service;
  reviews: Review[];
  reviewStats: ReviewStats;
}

// Composant pour traduire une catégorie (nécessaire car map)
function TranslatedCategory({ text }: { text: string }) {
  const { translatedText } = useSmartTranslate(text, "fr");
  return <>{translatedText}</>;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getText, t } = useLanguage();
  const serviceId = params.id as string;

  const [data, setData] = useState<ServiceDetailData | null>(null);
  const [similarServices, setSimilarServices] = useState<Service[]>([]);
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [realReviewStats, setRealReviewStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<number[]>([]);

  const handleToggleExtra = (index: number) => {
    setSelectedExtras((prev) => {
      const newSelection = prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index];
      return newSelection;
    });
  };

  const calculateTotalDeliveryTime = () => {
    if (!data?.service) return 0;
    let total = data.service.delivery_time_days || 0;

    if (data.service.extras && selectedExtras.length > 0) {
      selectedExtras.forEach((index) => {
        const extra = data.service.extras?.[index] as any;
        // Check for delivery_additional_days first, then fallback to boolean/other logic if needed
        // Based on user request: "delivery_additional_days": 1
        const additionalDays =
          extra?.delivery_additional_days ?? extra?.delivery_time_days ?? 0;
        total += additionalDays;
      });
    }
    return total;
  };

  // Traduction automatique du titre et de la description
  // On utilise des valeurs vides tant que data n'est pas chargé pour respecter les hooks
  const serviceTitle = data?.service?.title || "";
  const serviceDescription = data?.service?.description || "";

  const { translatedText: translatedTitle } = useSmartTranslate(
    serviceTitle,
    "fr"
  );
  const { translatedText: translatedDescription } = useSmartTranslate(
    serviceDescription,
    "fr"
  );

  const { translatedText: translatedShortDescription } = useSmartTranslate(
    data?.service?.short_description || "",
    "fr"
  );

  // Charger les données du service
  useEffect(() => {
    if (!serviceId) return;

    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(`/api/favorites?serviceId=${serviceId}`);
        const data = await response.json();

        if (data.success) {
          setIsFavorite(data.data.isFavorite);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };

    const fetchServiceData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/services/serv/${serviceId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load service");
        }

        setData(result.data);

        // Track service view
        userTracker.trackServiceView(serviceId, {
          title: result.data.service.title,
          category: result.data.service.categories?.[0] || null,
          price: result.data.service.base_price_cents,
          provider_id: result.data.service.provider_id,
        });

        // Charger les services similaires
        const similarResponse = await fetch(
          `/api/services/similar?serviceId=${serviceId}&limit=6`
        );
        const similarResult = await similarResponse.json();

        if (similarResult.success) {
          setSimilarServices(similarResult.data.services);
        }

        // Vérifier si le service est en favori
        checkFavoriteStatus();

        // Charger les vrais avis
        const reviewsResponse = await fetch(
          `/api/services/${serviceId}/reviews`
        );
        const reviewsData = await reviewsResponse.json();

        if (reviewsData.success) {
          setRealReviews(reviewsData.reviews || []);
          setRealReviewStats(reviewsData.stats || null);
        }
      } catch (err) {
        console.error("Error loading service:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [serviceId]);

  // Gérer l'ajout/suppression des favoris
  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // Retirer des favoris
        const response = await fetch(`/api/favorites?serviceId=${serviceId}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (data.success) {
          setIsFavorite(false);
        } else {
          alert("Erreur: " + data.error);
        }
      } else {
        // Ajouter aux favoris
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId }),
        });
        const data = await response.json();

        if (data.success) {
          setIsFavorite(true);
        } else {
          if (data.error === "Unauthorized") {
            // Rediriger vers la connexion si non connecté
            router.push(`/`);
          } else {
            alert("Erreur: " + data.error);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Erreur lors de la mise à jour des favoris");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Handler pour commander le service
  const handleOrder = async (extras?: string[]) => {
    if (!data?.service) return;

    // Construire l'URL avec les extras sélectionnés
    let checkoutUrl = `/checkout/${data.service.id}`;
    if (extras && extras.length > 0) {
      const searchParams = new URLSearchParams();
      searchParams.set("extras", extras.join(","));
      checkoutUrl += `?${searchParams.toString()}`;
    }

    // Rediriger vers la page de checkout avec le serviceId et les extras
    router.push(checkoutUrl);
  };

  // Handler pour contacter le prestataire
  const handleContact = async () => {
    if (!data?.service) return;

    // Vérifier si l'utilisateur a vérifié son email et téléphone
    try {
      const response = await fetch("/api/profile");
      const profileData = await response.json();

      if (profileData.success && profileData.data?.profile) {
        const { email_verified } = profileData.data.profile;

        if (!email_verified) {
          const missing = [];
          if (!email_verified) missing.push("email");

          alert(
            `Vous devez vérifier votre ${missing.join(
              " et "
            )} avant de continuer. Vous allez être redirigé vers votre profil.`
          );
          router.push(`/profile/${profileData.data.profile.user_id}`);
          return;
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }

    setShowContactModal(true);
  };

  // Handler for sharing
  const handleShare = async () => {
    if (!data?.service) return;

    const shareData = {
      title: translatedTitle || data.service.title,
      text: translatedDescription || data.service.description,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, fallback to modal if it wasn't just a cancellation
        if ((err as Error).name !== "AbortError") {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  // Loading state avec design amélioré
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium mt-4">
            {t?.serviceDetail?.loading?.title || "Chargement du service..."}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {t?.serviceDetail?.loading?.subtitle ||
              "Préparation de l'expérience premium"}
          </p>
        </div>
      </div>
    );
  }

  // Error state avec design amélioré
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t?.serviceDetail?.error?.title || "Service non disponible"}
          </h2>
          <p className="text-gray-600 mb-6">{error || t.common.error}</p>
          <div className="flex gap-4 justify-center">
            <SmartBackButton label="Retour" />

            <button
              onClick={() => router.push("/explorer")}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-200 font-medium"
            >
              {t?.serviceDetail?.error?.explore || "Explorer"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { service } = data;
  const safeService = {
    ...service,
    images: service.images || [],
    categories: service.categories || [],
    tags: service.tags || [],
    provider: service.provider || null,
    extras: service.extras || [],
    faq: service.faq || [],
    requirements: service.requirements || [],
  };

  // Création d'un objet service avec les textes traduits pour les composants enfants
  const displayService = {
    ...safeService,
    title: translatedTitle || service.title,
    description: translatedDescription || service.description,
    short_description: translatedShortDescription || service.short_description,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Header avec navigation premium */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SmartBackButton label="Retour" />
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="text-sm text-gray-500">
                {t?.serviceDetail?.header?.service || "Service"}{" "}
                <span className="font-medium text-gray-700">
                  #{service.id.slice(0, 8)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                title={t?.serviceDetail?.header?.share || "Partager"}
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 disabled:opacity-50"
                title={
                  isFavorite
                    ? t?.serviceDetail?.header?.removeFromFavorites ||
                      "Retirer des favoris"
                    : t?.serviceDetail?.header?.addToFavorites ||
                      "Ajouter aux favoris"
                }
              >
                <Heart
                  className={`w-5 h-5 transition-all ${
                    isFavorite ? "fill-red-500 text-red-500" : ""
                  } ${favoriteLoading ? "animate-pulse" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section avec informations principales */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white py-12">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>
        {/* Effets lumineux premium */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "3s" }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            {/* Badges et catégories */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {(service.category_names || service.categories)
                ?.slice(0, 2)
                .map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
                  >
                    {typeof category === "string" ? (
                      <TranslatedCategory text={category} />
                    ) : (
                      getText(category)
                    )}
                  </span>
                ))}
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">
                  {realReviewStats?.average_rating
                    ? Number(realReviewStats.average_rating).toFixed(1)
                    : "0.0"}{" "}
                  ({realReviewStats?.total_reviews || 0}
                  {""}
                  {t?.serviceDetail?.hero?.reviews || "avis"})
                </span>
              </div>
              {service.views_count > 50 && (
                <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm rounded-full px-3 py-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {t?.serviceDetail?.hero?.popular || "Populaire"}
                  </span>
                </div>
              )}
            </div>
            {/* Titre et description courte */}
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {translatedTitle || getText(service.title)}
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl">
              {translatedDescription?.substring(0, 160) ||
                getText(service.description)?.substring(0, 160) ||
                ""}
              {(translatedDescription?.length > 160 ||
                getText(service.description)?.length > 160) &&
                "..."}
            </p>

            {/* Stats rapides */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="font-medium">
                  {t?.serviceDetail?.hero?.delivery || "Livraison:"}{" "}
                  {calculateTotalDeliveryTime()}
                  {t?.serviceDetail?.hero?.days || "j"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium">
                  {service.revisions_included}{" "}
                  {t?.serviceDetail?.hero?.revisions || "révisions incluses"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />

                <span className="font-medium">
                  {service.views_count}+{" "}
                  {t?.serviceDetail?.hero?.views || "vues"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Contenu principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Images avec design amélioré */}
            <div className=" bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
              <ServiceImages
                images={service.images || []}
                coverImage={service.cover_image}
                title={translatedTitle || getText(service.title)}
              />
            </div>

            {/* Description avec design premium */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="p-2 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t?.serviceDetail?.sections?.description ||
                      "Description du Service"}
                  </h2>
                </div>
                <ServiceDescription service={displayService} />
              </div>
            </div>

            {/* Prestataire (mobile) */}
            <div className="lg:hidden">
              {service.provider && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                  <ProviderCard
                    provider={service.provider}
                    onContact={handleContact}
                  />
                </div>
              )}
            </div>

            {/* Avis avec design amélioré */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="p-8">
                <ReviewsSection
                  reviews={realReviews}
                  stats={
                    realReviewStats || {
                      total_reviews: 0,
                      average_rating: 0,
                      average_communication: 0,
                      average_quality: 0,
                      average_deadline: 0,
                      rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                    }
                  }
                />
              </div>
            </div>
          </div>

          {/* Colonne droite - Sidebar premium */}
          <div className="space-y-6">
            {/* Tarification avec design impressionnant */}
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
                <ServicePricing
                  service={displayService}
                  onOrder={handleOrder}
                  onContact={handleContact}
                  selectedExtras={selectedExtras}
                  onToggleExtra={handleToggleExtra}
                />
              </div>

              {/* Prestataire (desktop) */}
              <div className="hidden lg:block mt-6">
                {service.provider && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                    <ProviderCard
                      provider={service.provider}
                      onContact={handleContact}
                    />
                  </div>
                )}
              </div>
              {/* Garanties de confiance */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  {t?.serviceDetail?.sections?.guarantees ||
                    "Garanties incluses"}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>
                      {t?.serviceDetail?.guarantees?.verified ||
                        "Service professionnel vérifié"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>
                      {t?.serviceDetail?.guarantees?.secure ||
                        "Paiement sécurisé"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>
                      {t?.serviceDetail?.guarantees?.satisfaction ||
                        "Satisfaction garantie"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>
                      {t?.serviceDetail?.guarantees?.support ||
                        "Support client 24/7"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ServiceMedia
        images={safeService.images}
        title={translatedTitle || getText(safeService.title)}
      />
      {/* Services similaires avec design amélioré */}
      {similarServices.length > 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border-t border-gray-200/60 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t?.serviceDetail?.sections?.similarServices ||
                  "Services Similaires"}
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {t?.serviceDetail?.sections?.similarSubtitle ||
                  "Découvrez d'autres services exceptionnels qui pourraient vous intéresser"}
              </p>
            </div>
            <SimilarServices services={similarServices} />
          </div>
        </div>
      )}

      {/* Modal de contact */}
      {showContactModal && service.provider && (
        <OrderMessagingModal
          open={showContactModal}
          onClose={() => setShowContactModal(false)}
          providerId={service.provider.id}
          messageType="simple"
          onMessageSent={() => {
            console.log("Message sent successfully");
          }}
          serviceId={service.id}
          serviceTitle={translatedTitle || getText(service.title)}
        />
      )}

      {/* Modal de partage */}
      {data?.service && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={translatedTitle || data.service.title}
          url={typeof window !== "undefined" ? window.location.href : ""}
        />
      )}
    </div>
  );
}
