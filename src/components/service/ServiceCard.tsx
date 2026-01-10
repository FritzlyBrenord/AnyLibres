// ============================================================================
// SERVICE: ServiceCard Premium
// Version corrigée avec gestion des avis optimisée
// ============================================================================

"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Heart, Clock, Eye, Sparkles } from "lucide-react";
import { Service } from "@/types";
import { useSmartTranslate } from "@/hooks/useSmartTranslate";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { formatPrice } from "@/utils/currency";
import { cn } from "@/utils/utils";
import { convertFromUSD } from "@/utils/lib/currencyConversion";

interface ServiceCardProps {
  service: Service;
  className?: string;
}

export function ServiceCard({ service, className }: ServiceCardProps) {
  const router = useRouter();
  const { t, language } = useSafeLanguage();
  const [isLiked, setIsLiked] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [serviceImageError, setServiceImageError] = useState(false);
  const [ratingData, setRatingData] = useState<{
    average: number;
    count: number;
    stars: number;
    hasReviews: boolean;
  } | null>(null);
  const [loadingRating, setLoadingRating] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [convertedPrice, setConvertedPrice] = useState<number>(service.base_price_cents / 100);
  const [convertedOriginalPrice, setConvertedOriginalPrice] = useState<number | null>(
    service.original_price_cents ? service.original_price_cents / 100 : null
  );

  // Charger la devise sélectionnée et écouter les changements
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }

    const handleCurrencyChange = (event: CustomEvent) => {
      setSelectedCurrency(event.detail.code);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
    };
  }, []);

  // Convertir les prix quand la devise change
  useEffect(() => {
    const convertPrices = async () => {
      if (selectedCurrency === 'USD') {
        setConvertedPrice(service.base_price_cents / 100);
        setConvertedOriginalPrice(
          service.original_price_cents ? service.original_price_cents / 100 : null
        );
        return;
      }

      // Convertir base_price
      const convertedBase = await convertFromUSD(service.base_price_cents / 100, selectedCurrency);
      if (convertedBase !== null) {
        setConvertedPrice(convertedBase);
      }

      // Convertir original_price si existe
      if (service.original_price_cents) {
        const convertedOrig = await convertFromUSD(service.original_price_cents / 100, selectedCurrency);
        if (convertedOrig !== null) {
          setConvertedOriginalPrice(convertedOrig);
        }
      }
    };

    convertPrices();
  }, [service.base_price_cents, service.original_price_cents, selectedCurrency]);

  // Formater les prix convertis
  const formattedPrice = useMemo(() => {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedPrice);
    } catch {
      return `${convertedPrice.toFixed(2)} ${selectedCurrency}`;
    }
  }, [convertedPrice, selectedCurrency]);

  const formattedOriginalPrice = useMemo(() => {
    if (convertedOriginalPrice === null) return null;
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedOriginalPrice);
    } catch {
      return `${convertedOriginalPrice.toFixed(2)} ${selectedCurrency}`;
    }
  }, [convertedOriginalPrice, selectedCurrency]);

  // Traduction
  const titleTranslation = useSmartTranslate(service.title, "fr");
  const descTranslation = useSmartTranslate(service.short_description, "fr");
  const title = titleTranslation.translatedText;
  const shortDesc = descTranslation.translatedText;

  // Provider info
  const providerName = service.provider
    ? service.provider.company_name?.trim() ||
      `${service.provider.profile?.first_name || ""} ${
        service.provider.profile?.last_name || ""
      }`.trim() ||
      "Prestataire"
    : "Prestataire";

  const providerAvatar = service.provider?.profile?.avatar_url;

  // Service image - avec placeholder "Anylibre"
  const getServiceImage = () => {
    if (service.cover_image) return service.cover_image;
    if (service.images?.[0]) return service.images[0];
    return "/images/placeholders/anylibre-placeholder.jpg";
  };

  const serviceImage = getServiceImage();

  // Charger les données d'avis réelles
  useEffect(() => {
    const fetchReviews = async () => {
      // ... existing review fetching logic ...
      // Essayer d'abord avec les données existantes
      if (service.rating && service.reviews_count) {
        const hasReviews = service.rating > 0 && service.reviews_count > 0;
        setRatingData({
          average: Number(service.rating.toFixed(1)),
          count: service.reviews_count,
          stars: Math.round(service.rating),
          hasReviews,
        });
        return;
      }

      // Sinon, faire appel à l'API
      try {
        setLoadingRating(true);
        const response = await fetch(`/api/services/${service.id}/reviews`);
        const data = await response.json();

        if (data.success) {
          const stats = data.stats;
          const reviews = data.reviews || [];

          let average = stats?.average_rating || 0;
          let count = stats?.total_reviews || reviews.length;

          // Si pas de stats, calculer depuis les reviews
          if (!stats && reviews.length > 0) {
            const sum = reviews.reduce(
              (acc: number, r: any) =>
                acc + Number(r.rating || r.rating_overall || 0),
              0
            );
            average = sum / reviews.length;
            count = reviews.length;
          }

          const hasReviews = average > 0 && count > 0;

          setRatingData({
            average: Number(average.toFixed(1)),
            count,
            stars: Math.round(average),
            hasReviews,
          });
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        // En cas d'erreur, vérifier si le service a des données d'avis
        const hasReviews = service.rating && service.rating > 0;
        setRatingData({
          average: service.rating || 0,
          count: service.reviews_count || 0,
          stars: Math.round(service.rating || 0),
          hasReviews: hasReviews || false,
        });
      } finally {
        setLoadingRating(false);
      }
    };

    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(`/api/favorites?serviceId=${service.id}`);
        const data = await response.json();

        if (data.success) {
          setIsLiked(data.data.isFavorite);
        }
      } catch (error) {
        // console.error("Error checking favorite status:", error);
        // Silent error for unauthenticated or other issues in card view
      }
    };

    fetchReviews();
    checkFavoriteStatus();
  }, [service.id, service.rating, service.reviews_count]);

  // Gérer l'ajout/suppression des favoris
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to service page
    e.stopPropagation();

    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      if (isLiked) {
        // Retirer des favoris
        const response = await fetch(`/api/favorites?serviceId=${service.id}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (data.success) {
          setIsLiked(false);
        }
      } else {
        // Ajouter aux favoris
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId: service.id }),
        });
        const data = await response.json();

        if (data.success) {
          setIsLiked(true);
        } else {
          if (data.error === "Unauthorized") {
            // Rediriger vers la connexion si non connecté
            router.push(`/`);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Conditions d'affichage
  const hasDeliveryTime =
    service.delivery_time_days && service.delivery_time_days > 0;
  const isPopular = service.popularity && service.popularity > 500;
  const isAnylibrePlaceholder = serviceImage.includes("anylibre-placeholder");

  // Render stars only if reviews exist
  const renderStars = () => {
    if (!ratingData?.hasReviews || loadingRating) return null;

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-3 h-3 sm:w-4 sm:h-4",
              star <= ratingData.stars
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            )}
          />
        ))}
      </div>
    );
  };

  // Squelette de chargement pour les avis
  const renderRatingSkeleton = () => (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className="w-3 h-3 sm:w-4 sm:h-4 fill-gray-200 text-gray-200"
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold text-gray-900 text-sm bg-gray-200 animate-pulse h-4 w-8 rounded"></span>
        <span className="text-xs text-gray-400">(...)</span>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl border border-gray-200",
        "hover:shadow-xl transition-all duration-300 overflow-hidden",
        "flex flex-col h-full",
        className
      )}
      role="article"
      aria-label={`Service: ${title}`}
    >
      {/* Like button */}
      <button
        onClick={handleToggleFavorite}
        disabled={favoriteLoading}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110 disabled:opacity-70 disabled:cursor-not-allowed group/btn"
        aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Heart
          className={cn(
            "w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200",
            isLiked
              ? "fill-red-500 text-red-500"
              : "text-gray-400 group-hover/btn:text-red-400",
            favoriteLoading && "animate-pulse"
          )}
        />
      </button>

      {/* Badge Populaire */}
      {isPopular > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Populaire</span>
            <span className="sm:hidden">Pop</span>
          </div>
        </div>
      )}

      {/* Image Container */}
      <Link
        href={`/service/${service.id}`}
        className={cn(
          "block relative aspect-[4/3] overflow-hidden",
          isAnylibrePlaceholder && "bg-gradient-to-br from-purple-50 to-blue-50"
        )}
        aria-label={`Voir les détails de ${title}`}
      >
        {isAnylibrePlaceholder ? (
          // Placeholder Anylibre
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl font-bold">A</span>
              </div>
              <p className="text-purple-700 font-semibold text-lg">Anylibre</p>
              <p className="text-gray-500 text-sm mt-1">Service premium</p>
            </div>
          </div>
        ) : (
          // Image normale
          <>
            <Image
              src={serviceImage}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setServiceImageError(true)}
            />
            {serviceImageError && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl font-bold">A</span>
                  </div>
                  <p className="text-purple-700 font-medium">Anylibre</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
          </>
        )}
      </Link>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Provider */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            {providerAvatar && !profileImageError ? (
              <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                <Image
                  src={providerAvatar}
                  alt={`Avatar de ${providerName}`}
                  fill
                  sizes="40px"
                  className="rounded-full object-cover border border-gray-200"
                  onError={() => setProfileImageError(true)}
                />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                {providerName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {providerName}
            </h4>
          </div>
        </div>

        {/* Titre */}
        <Link
          href={`/service/${service.id}`}
          className="block mb-3 group/title"
        >
          <h3 className="font-semibold text-gray-900 group-hover/title:text-purple-600 transition-colors duration-200 line-clamp-2 leading-tight text-base sm:text-lg">
            {title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1 leading-relaxed">
          {shortDesc}
        </p>

        {/* Stats Section */}
        <div className="flex items-center gap-3 mb-4">
          {/* Rating - Only show if exists */}
          {loadingRating ? (
            renderRatingSkeleton()
          ) : ratingData?.hasReviews ? (
            <div className="flex items-center gap-1.5">
              {renderStars()}
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900 text-sm">
                  {ratingData.average}
                </span>
                <span className="text-xs text-gray-500">
                  ({ratingData.count})
                </span>
              </div>
            </div>
          ) : null}

          {/* Delivery - Only show if exists */}
          {hasDeliveryTime && (
            <div className="flex items-center gap-1.5 text-gray-700">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs sm:text-sm whitespace-nowrap">
                {service.delivery_time_days}j
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          {/* Price Section */}
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5 whitespace-nowrap">
              À partir de
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold text-purple-600 truncate">
                {formattedPrice}
              </span>
              {formattedOriginalPrice && (
                <span className="text-sm text-gray-400 line-through hidden sm:inline">
                  {formattedOriginalPrice}
                </span>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href={`/service/${service.id}`}
            className="ml-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium text-sm transition-all duration-200 hover:shadow-md whitespace-nowrap flex items-center gap-1.5"
          >
            <span className="hidden sm:inline">
              {t?.serviceCard?.discover || "Découvrir"}
            </span>
            <span className="sm:hidden">Voir</span>
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
