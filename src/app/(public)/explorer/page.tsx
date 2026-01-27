// app/explorer/page.tsx - Version avec nouvelle API category
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  TrendingUp,
  Sparkles,
  Grid3x3,
  List,
  ChevronDown,
  X,
  Folder,
} from "lucide-react";
import { ServiceCard } from "@/components/service/ServiceCard";
import { CategoryName } from "@/components/category/CategoryName";
import { Button } from "@/components/ui/Button";
import { AdvancedSearchBar } from "@/components/search/AdvancedSearchBar";
import type { Service, Category, ProviderProfile } from "@/types";
import { userTracker } from "@/lib/tracking/userTracker";
import { useLanguageContext } from "@/contexts/LanguageContext";

interface ExplorerData {
  services: Service[];
  categories: Category[];
  providers: ProviderProfile[];
  total: number;
  currentPage: number;
  totalPages: number;
  suggestions?: Service[];
  message?: string;
  fallback?: boolean;
}

export default function ExplorerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguageContext();

  const [data, setData] = useState<ExplorerData>({
    services: [],
    categories: [],
    providers: [],
    total: 0,
    currentPage: 1,
    totalPages: 1,
    suggestions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch data avec APIs séparées
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const category = searchParams.get("category");
        const search = searchParams.get("q");
        const page = searchParams.get("page");
        const sort = searchParams.get("sort") || "popular";

        let servicesUrl;
        let servicesData;

        // Si une catégorie est sélectionnée, utiliser l'API category
        if (category) {
          const categoryParams = new URLSearchParams();
          categoryParams.set("category", category);
          categoryParams.set("page", page || "1");
          categoryParams.set("limit", "12");
          categoryParams.set("sort", sort);

          servicesUrl = `/api/services/category?${categoryParams.toString()}`;
          console.log("🔍 Using category API:", servicesUrl);
        }
        // Si une recherche est effectuée, utiliser l'API search
        else if (search) {
          const searchParams = new URLSearchParams();
          searchParams.set("q", search);
          searchParams.set("page", page || "1");
          searchParams.set("limit", "12");
          searchParams.set("sort", sort);

          servicesUrl = `/api/services/search?${searchParams.toString()}`;
          console.log("🔍 Using search API:", servicesUrl);
        }
        // Sinon, utiliser l'API pour tous les services (popular ou all)
        else {
          servicesUrl = `/api/services/popular?limit=12&page=${
            page || "1"
          }&sort=${sort}`;
          console.log("🔍 Using popular services API:", servicesUrl);
        }

        const categoriesUrl = "/api/categories";
        const providersUrl = "/api/providers/popular";

        const [servicesRes, categoriesRes, providersRes] = await Promise.all([
          fetch(servicesUrl, { cache: "no-store" }),
          fetch(categoriesUrl, { cache: "no-store" }),
          fetch(providersUrl, { cache: "no-store" }),
        ]);

        // Vérifier les réponses
        if (!servicesRes.ok) {
          const errorText = await servicesRes.text();
          console.error("❌ Services API error:", {
            status: servicesRes.status,
            statusText: servicesRes.statusText,
            error: errorText,
          });
          throw new Error(
            `Services API error: ${servicesRes.status} - ${servicesRes.statusText}`,
          );
        }

        if (!categoriesRes.ok) {
          console.warn("Categories API error:", categoriesRes.status);
        }

        if (!providersRes.ok) {
          console.warn("Providers API failed, using empty array");
        }

        const [servicesResult, categoriesData, providersData] =
          await Promise.all([
            servicesRes.json(),
            categoriesRes.ok
              ? categoriesRes.json()
              : Promise.resolve({ data: [] }),
            providersRes.ok
              ? providersRes.json()
              : Promise.resolve({ data: [] }),
          ]);

        console.log("✅ API responses received:", {
          servicesCount:
            servicesResult.data?.services?.length ||
            servicesResult.data?.length ||
            servicesResult.services?.length ||
            0,
          categoriesCount:
            categoriesData.data?.length ||
            categoriesData.categories?.length ||
            0,
          providersCount:
            providersData.data?.length || providersData.providers?.length || 0,
        });

        // Formater les données selon la structure de l'API utilisée
        let services, total, currentPage, totalPages;

        if (category) {
          // Structure de l'API category
          services = servicesResult.data?.services || [];
          total = servicesResult.data?.total || services.length;
          currentPage =
            servicesResult.data?.currentPage || parseInt(page || "1");
          totalPages = servicesResult.data?.totalPages || Math.ceil(total / 12);
        } else {
          // Structure des autres APIs
          services = servicesResult.data || servicesResult.services || [];
          total =
            servicesResult.total ||
            servicesResult.data?.total ||
            services.length;
          currentPage =
            servicesResult.currentPage ||
            servicesResult.data?.currentPage ||
            parseInt(page || "1");
          totalPages =
            servicesResult.totalPages ||
            servicesResult.data?.totalPages ||
            Math.ceil(total / 12);
        }

        const categories =
          categoriesData.data || categoriesData.categories || [];
        const providers = providersData.data || providersData.providers || [];

        setData({
          services,
          categories,
          providers,
          total,
          currentPage,
          totalPages,
          suggestions: servicesResult.suggestions || [],
          message: servicesResult.message || "",
          fallback: servicesResult.fallback || false,
        });
      } catch (error) {
        console.error("❌ Error fetching explorer data:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred",
        );

        // Données de fallback
        setData({
          services: [],
          categories: [],
          providers: [],
          total: 0,
          currentPage: 1,
          totalPages: 1,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Fonction pour mettre à jour les paramètres de recherche
  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Réinitialiser la page à 1 quand on change les filtres
    if (!updates.page) {
      params.set("page", "1");
    }

    router.push(`/explorer?${params.toString()}`);
  };

  // Fonction pour appliquer un filtre
  const applyFilter = (key: string, value: string) => {
    console.log("🎯 Applying filter:", { key, value });
    updateSearchParams({ [key]: value });
  };

  // Fonction pour supprimer un filtre
  const removeFilter = (filterKey: string) => {
    updateSearchParams({ [filterKey]: null });
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    router.push("/explorer");
  };

  // Fonction pour changer de page
  const goToPage = (page: number) => {
    updateSearchParams({ page: page.toString() });
  };

  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort") || "popular";

  // Trouver la catégorie active
  const activeCategory = data.categories.find(
    (c: Category) => (c.key || c.id) === currentCategory,
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 py-12 lg:py-16 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 rounded-full text-amber-300 text-sm font-semibold mb-4">
                <Sparkles className="w-4 h-4" />
                {t?.explorer?.badge || "Explorer"}
              </div>

              <h1 className="font-heading font-bold text-3xl lg:text-5xl text-white mb-4">
                {t?.explorer?.hero?.title || "Découvrez des Services"}{" "}
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  {t?.explorer?.hero?.titleHighlight || "Professionnels"}
                </span>
              </h1>

              <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
                {t?.explorer?.hero?.subtitle ||
                  "Trouvez le service parfait pour votre projet parmi notre catalogue"}
              </p>

              {/* Barre de recherche avancée */}
              <div className="max-w-4xl mx-auto mb-8">
                <AdvancedSearchBar />
              </div>

              {/* Statistiques rapides */}
              <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    {data.total}+
                  </div>
                  <div className="text-slate-300 text-sm">
                    {t?.explorer?.stats?.services || "Services"}
                  </div>
                </div>
                <div className="text-center border-x border-white/20">
                  <div className="text-2xl font-bold text-amber-400">
                    {data.categories.length}+
                  </div>
                  <div className="text-slate-300 text-sm">
                    {t?.explorer?.stats?.categories || "Catégories"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    {data.providers.length}+
                  </div>
                  <div className="text-slate-300 text-sm">
                    {t?.explorer?.stats?.experts || "Experts"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FILTRES RAPIDES PAR CATÉGORIE */}
        <section className="bg-white border-b border-slate-200 sticky top-[64px] z-40 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 py-4 overflow-x-auto scrollbar-hide">
              {/* Bouton Tous */}
              <button
                onClick={() => applyFilter("category", "")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all flex-shrink-0 ${
                  !currentCategory
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                {t?.explorer?.filters?.all || "Tous"}
              </button>

              {/* Catégories */}
              {data.categories.slice(0, 8).map((category: Category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    console.log(
                      "🎯 Category clicked:",
                      category.key || category.id,
                    );
                    applyFilter("category", category.key || category.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all flex-shrink-0 ${
                    currentCategory === (category.key || category.id)
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  <CategoryName category={category} />
                </button>
              ))}

              {/* Bouton Plus de catégories */}
              <button
                onClick={() =>
                  document
                    .getElementById("categories")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all flex-shrink-0 border border-amber-200"
              >
                {t?.explorer?.filters?.more || "Plus"}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* CONTENU PRINCIPAL */}
        <div className="container mx-auto px-4 py-8">
          {/* Barre de tri et affichage */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-heading font-bold text-2xl text-slate-900">
                {currentCategory
                  ? activeCategory?.name?.fr ||
                    activeCategory?.name?.en ||
                    activeCategory?.name ||
                    currentCategory
                  : currentSearch
                    ? `${t?.explorer?.results?.resultsFor || "Résultats pour"} "${currentSearch}"`
                    : t?.explorer?.results?.allServices || "Tous les services"}
              </h2>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                {data.total}{" "}
                {data.total !== 1
                  ? t?.explorer?.results?.results || "résultats"
                  : t?.explorer?.results?.result || "résultat"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Tri */}
              <select
                value={currentSort}
                onChange={(e) => {
                  console.log("🎯 Sort changed:", e.target.value);
                  applyFilter("sort", e.target.value);
                }}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="popular">
                  {t?.explorer?.sort?.popular || "Les plus populaires"}
                </option>
                <option value="recent">
                  {t?.explorer?.sort?.recent || "Les plus récents"}
                </option>
                <option value="price_asc">
                  {t?.explorer?.sort?.priceAsc || "Prix croissant"}
                </option>
                <option value="price_desc">
                  {t?.explorer?.sort?.priceDesc || "Prix décroissant"}
                </option>
                <option value="rating">
                  {t?.explorer?.sort?.rating || "Meilleure note"}
                </option>
              </select>

              {/* Vue grille/liste */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm"
                      : "hover:bg-white"
                  }`}
                >
                  <Grid3x3
                    className={`w-4 h-4 ${
                      viewMode === "grid" ? "text-slate-700" : "text-slate-400"
                    }`}
                  />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-white shadow-sm"
                      : "hover:bg-white"
                  }`}
                >
                  <List
                    className={`w-4 h-4 ${
                      viewMode === "list" ? "text-slate-700" : "text-slate-400"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Filtres Actifs */}
          {(currentCategory || currentSearch) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {currentCategory && (
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                  {t?.explorer?.filters?.category || "Catégorie"}:{" "}
                  {activeCategory?.name?.fr ||
                    activeCategory?.name?.en ||
                    activeCategory?.name ||
                    currentCategory}
                  <button
                    onClick={() => removeFilter("category")}
                    className="hover:bg-indigo-200 rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {currentSearch && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                  {t?.explorer?.filters?.search || "Recherche"}: "
                  {currentSearch}"
                  <button
                    onClick={() => removeFilter("q")}
                    className="hover:bg-amber-200 rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {(currentCategory || currentSearch) && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200"
                >
                  <X className="w-3 h-3" />
                  {t?.explorer?.filters?.clearAll || "Tout effacer"}
                </button>
              )}
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-semibold">
                {t?.explorer?.errors?.loadingError || "Erreur de chargement"}
              </p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                {t?.explorer?.errors?.retry || "Réessayer"}
              </button>
            </div>
          )}

          {/* Services Tendance (si aucun filtre) */}
          {!currentCategory && !currentSearch && !loading && !error && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {t?.explorer?.trending?.title || "🔥 Tendances du moment"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t?.explorer?.trending?.subtitle ||
                      "Les services les plus recherchés cette semaine"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "Logo Design",
                  "Site Web WordPress",
                  "Montage Vidéo",
                  "SEO",
                  "Rédaction",
                ].map((trend) => (
                  <button
                    key={trend}
                    onClick={() => applyFilter("q", trend)}
                    className="px-4 py-2 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                  >
                    {trend}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chargement */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-slate-200 rounded-2xl h-80"></div>
                </div>
              ))}
            </div>
          )}

          {/* Services */}
          {!loading && !error && (
            <div
              className={`${
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-6"
              }`}
            >
              {data.services.map((service: Service, index: number) => (
                <div
                  key={service.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ServiceCard service={service} />
                </div>
              ))}
            </div>
          )}

          {/* Message si aucun résultat */}
          {!loading && !error && data.services.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">
                {t?.explorer?.noResults?.title || "Aucun service trouvé"}
              </h3>
              <p className="text-slate-600 mb-6">
                {currentCategory || currentSearch
                  ? t?.explorer?.noResults?.subtitle ||
                    "Essayez de modifier vos critères de recherche"
                  : t?.explorer?.noResults?.subtitleEmpty ||
                    "Aucun service disponible pour le moment"}
              </p>
              <Button
                onClick={resetFilters}
                variant="outline"
                className="border-2 border-slate-300"
              >
                {t?.explorer?.noResults?.resetFilters ||
                  "Réinitialiser les filtres"}
              </Button>
            </div>
          )}

          {/* Pagination */}
          {!loading &&
            !error &&
            data.services.length > 0 &&
            data.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700"
                  disabled={data.currentPage === 1}
                  onClick={() => goToPage(data.currentPage - 1)}
                >
                  {t?.explorer?.pagination?.previous || "Précédent"}
                </Button>

                {/* Pages */}
                {Array.from(
                  { length: Math.min(5, data.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (data.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (data.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (data.currentPage >= data.totalPages - 2) {
                      pageNum = data.totalPages - 4 + i;
                    } else {
                      pageNum = data.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          data.currentPage === pageNum
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}

                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700"
                  disabled={data.currentPage === data.totalPages}
                  onClick={() => goToPage(data.currentPage + 1)}
                >
                  {t?.explorer?.pagination?.next || "Suivant"}
                </Button>
              </div>
            )}
        </div>

        {/* SECTION TOUTES LES CATÉGORIES */}
        <section id="categories" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-3">
                <Folder className="w-4 h-4" />
                {t?.explorer?.categories?.badge || "Toutes les catégories"}
              </div>
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-4">
                {t?.explorer?.categories?.title || "Explorez par Catégorie"}
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                {t?.explorer?.categories?.subtitle ||
                  "Trouvez rapidement ce que vous cherchez"}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {data.categories.map((category: Category) => (
                <button
                  key={category.id}
                  onClick={() =>
                    applyFilter("category", category.key || category.id)
                  }
                  className="group p-6 bg-slate-50 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all duration-300 text-center hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-white group-hover:bg-gradient-to-br group-hover:from-indigo-100 group-hover:to-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 transition-all border border-slate-200 group-hover:border-indigo-300">
                    <Folder className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-1">
                    <CategoryName category={category} />
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {category.services_count || 0}{" "}
                    {t?.explorer?.categories?.servicesCount || "services"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
