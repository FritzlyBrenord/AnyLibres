// app/favorites/page.tsx - VERSION PREMIUM
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";

import {
  Heart,
  Star,
  Clock,
  Loader2,
  ShoppingBag,
  User,
  ChevronRight,
  Sparkles,
  X,
  Bookmark,
} from "lucide-react";

interface Profile {
  id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface Provider {
  id: string;
  business_name?: string;
  profiles: Profile;
}

interface Service {
  id: string;
  title: any;
  description: any;
  base_price_cents: number;
  currency: string;
  delivery_time_days: number;
  cover_image: string;
  rating_avg: number;
  review_count: number;
  provider_id: string;
  providers: Provider;
}

interface Favorite {
  id: string;
  created_at: string;
  service_id: string;
  client_id: string;
  service: Service;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/");
        return;
      }
      loadFavorites();
    }
  }, [authLoading, user]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/favorites/list");
      const data = await response.json();

      if (data.success) {
        setFavorites(data.data.favorites || []);
      } else {
        console.error("Error loading favorites:", data.error);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (serviceId: string) => {
    if (
      !confirm("Êtes-vous sûr de vouloir retirer ce service de vos favoris?")
    ) {
      return;
    }

    setRemoving(serviceId);
    try {
      const response = await fetch(`/api/favorites?serviceId=${serviceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setFavorites(favorites.filter((f) => f.service_id !== serviceId));
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setRemoving(null);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(cents / 100);
  };

  const getProviderName = (provider: Provider) => {
    if (provider.business_name) {
      return provider.business_name;
    }

    const profile = provider.profiles;
    if (profile.display_name) {
      return profile.display_name;
    }

    const fullName = `${profile.first_name || ""} ${
      profile.last_name || ""
    }`.trim();
    return fullName || "Prestataire";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl"></div>
          <Loader2 className="w-16 h-16 animate-spin text-white relative z-10" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <Header variant="solid" />

      {/* Hero Gradient Section */}
      <div className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-mosaic.png')] opacity-10"></div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium text-white/90">
                  Vos préférences
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                Mes{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                  Favoris
                </span>
              </h1>

              <p className="text-xl text-white/80 max-w-2xl mb-8 leading-relaxed">
                Retrouvez tous les services que vous avez aimés. Votre
                collection personnelle d'excellence.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-xl">
                  <Bookmark className="w-10 h-10 text-white" />
                </div>
                <div>
                  <div className="text-4xl font-bold text-white">
                    {favorites.length}
                  </div>
                  <div className="text-white/70">
                    service{favorites.length > 1 ? "s" : ""} sauvegardé
                    {favorites.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-16 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Empty State */}
          {favorites.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-2xl border border-slate-200/50">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-2xl opacity-30 rounded-full"></div>
                <div className="relative w-32 h-32 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <Heart className="w-16 h-16 text-white/90" />
                </div>
              </div>

              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Votre collection est vide
              </h3>
              <p className="text-slate-600 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                Commencez à collectionner les meilleurs services. Ajoutez vos
                favoris pour les retrouver facilement plus tard.
              </p>

              <Link
                href="/services"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 shadow-xl hover:scale-[1.02]"
              >
                <ShoppingBag className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                <span className="text-lg">Explorer les services premium</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          ) : (
            <>
              {/* Stats Bar */}
              <div className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          {favorites.reduce(
                            (acc, fav) => acc + (fav.service.rating_avg || 0),
                            0
                          ) / favorites.length || 0}
                        </div>
                        <div className="text-slate-600">Note moyenne</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          {(
                            favorites.reduce(
                              (acc, fav) =>
                                acc + fav.service.delivery_time_days,
                              0
                            ) / favorites.length
                          ).toFixed(2) || 0}
                          j
                        </div>
                        <div className="text-slate-600">Délai moyen</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          {favorites.length}
                        </div>
                        <div className="text-slate-600">Services favoris</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Favorites Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {favorites.map((favorite) => {
                  const service = favorite.service;
                  const provider = service.providers;
                  const providerName = getProviderName(provider);

                  return (
                    <div
                      key={favorite.id}
                      className="group bg-white rounded-3xl shadow-2xl border border-slate-200/50 hover:border-purple-300 hover:shadow-3xl transition-all duration-500 overflow-hidden hover:scale-[1.02]"
                    >
                      {/* Image Container */}
                      <div className="relative h-56 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-indigo-900/30 to-purple-900/50 z-10"></div>
                        <img
                          src={
                            service.cover_image || "/placeholder-service.jpg"
                          }
                          alt={
                            typeof service.title === "object"
                              ? service.title.fr
                              : service.title
                          }
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveFavorite(service.id)}
                          disabled={removing === service.id}
                          className="absolute top-4 right-4 z-20 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-red-50 hover:scale-110 transition-all duration-300 shadow-lg border border-slate-200"
                        >
                          {removing === service.id ? (
                            <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                          ) : (
                            <X className="w-5 h-5 text-red-600" />
                          )}
                        </button>

                        {/* Rating Badge */}
                        {service.rating_avg > 0 && (
                          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-xl border border-slate-200/50">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                              <Star className="w-4 h-4 text-white fill-white" />
                            </div>
                            <div>
                              <div className="font-bold text-lg text-slate-900">
                                {service.rating_avg.toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-600">
                                {service.review_count} avis
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-7">
                        {/* Provider */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative">
                            {provider?.profiles?.avatar_url ? (
                              <img
                                src={provider.profiles.avatar_url}
                                alt={providerName}
                                className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-lg"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <User className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {providerName}
                            </div>
                            <div className="text-sm text-slate-500">
                              Prestataire vérifié
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-purple-700 transition-colors duration-300">
                          {typeof service.title === "object"
                            ? service.title.fr
                            : service.title}
                        </h3>

                        {/* Description */}
                        {service.description && (
                          <p className="text-slate-600 mb-5 line-clamp-3 leading-relaxed">
                            {typeof service.description === "object"
                              ? service.description.fr
                              : service.description}
                          </p>
                        )}

                        {/* Info Row */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {service.delivery_time_days} jour
                                {service.delivery_time_days > 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                            <div className="text-sm font-medium text-slate-600">
                              En ligne
                            </div>
                          </div>

                          <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-purple-700 bg-clip-text text-transparent">
                            {formatPrice(
                              service.base_price_cents,
                              service.currency
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <Link
                          href={`/service/${service.id}`}
                          className="group/btn w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 shadow-lg hover:scale-[1.02]"
                        >
                          <span>Voir les détails</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm opacity-80">Explorer</span>
                            <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                          </div>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA Section */}
              <div className="mt-16 text-center">
                <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 rounded-3xl p-12 shadow-2xl">
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Besoin de plus d'inspiration ?
                  </h3>
                  <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                    Découvrez notre collection exclusive de services premium
                    sélectionnés spécialement pour vous.
                  </p>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-white/90 transition-all duration-300 shadow-xl hover:scale-[1.02]"
                  >
                    <Sparkles className="w-5 h-5" />
                    Explorer tous les services
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
