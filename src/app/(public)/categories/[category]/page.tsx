// app/(public)/categories/[category]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Grid3x3,
  List,
  Star,
  Clock,
  DollarSign,
  Users,
  Award,
  ChevronDown,
  X,
  Zap,
  Folder,
  ArrowRight,
  Filter,
  Home,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ServiceCard } from "@/components/service/ServiceCard";
import { Button } from "@/components/ui/Button";
import type { Service, Category } from "@/types";

interface CategoryData {
  services: Service[];
  category: Category | null;
  total: number;
  currentPage: number;
  totalPages: number;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryKey = params.category as string;

  const [data, setData] = useState<CategoryData>({
    services: [],
    category: null,
    total: 0,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sort, setSort] = useState("popular");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.set("category", categoryKey);
        queryParams.set("page", "1");
        queryParams.set("limit", "12");
        queryParams.set("sort", sort);

        const response = await fetch(
          `/api/services/category?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch category data");
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (categoryKey) {
      fetchData();
    }
  }, [categoryKey, sort]);

  // Fonction pour changer de page
  const goToPage = (page: number) => {
    const queryParams = new URLSearchParams();
    queryParams.set("page", page.toString());
    queryParams.set("sort", sort);
    // Re-fetch les données avec la nouvelle page
    // Pour l'instant, on recharge simplement
    window.location.href = `/categories/${categoryKey}?${queryParams.toString()}`;
  };

  // Fonction pour appliquer un tri
  const applySort = (newSort: string) => {
    setSort(newSort);
  };

  const category = data.category;
  const categoryName =
    category?.name?.fr || category?.name?.en || category?.name || categoryKey;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header variant="solid" />

      <main className="flex-1">
        {/* FIL D'ARIANE */}
        <section className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900 transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link
                href="/explorer"
                className="hover:text-slate-900 transition-colors"
              >
                Explorer
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900 font-medium">{categoryName}</span>
            </nav>
          </div>
        </section>

        {/* HERO SECTION CATÉGORIE */}
        <section className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 py-12 lg:py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>
          <div className="absolute top-10 right-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 rounded-full text-amber-300 text-sm font-semibold mb-4">
                <Folder className="w-4 h-4" />
                Catégorie
              </div>

              <h1 className="font-heading font-bold text-3xl lg:text-5xl text-white mb-4">
                Services de{" "}
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  {categoryName}
                </span>
              </h1>

              <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
                Découvrez tous nos services spécialisés dans {categoryName}
              </p>

              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    {data.total}+
                  </div>
                  <div className="text-slate-300 text-sm">Services</div>
                </div>
                <div className="text-center border-x border-white/20">
                  <div className="text-2xl font-bold text-amber-400">4.8+</div>
                  <div className="text-slate-300 text-sm">Note moyenne</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">50+</div>
                  <div className="text-slate-300 text-sm">Experts</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENU PRINCIPAL */}
        <div className="container mx-auto px-4 py-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* SIDEBAR FILTRES */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-32 space-y-6">
                {/* Card Filtres */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                      Filtres
                    </h3>
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      Réinitialiser
                    </button>
                  </div>

                  {/* Prix */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-600" />
                      Budget
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: "Moins de $50", value: "0-50" },
                        { label: "$50 - $200", value: "50-200" },
                        { label: "$200 - $500", value: "200-500" },
                        { label: "$500+", value: "500-plus" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <input
                            type="radio"
                            name="budget"
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700 group-hover:text-slate-900">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Délai de livraison */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-600" />
                      Délai de livraison
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: "24 heures", value: "24h" },
                        { label: "3 jours", value: "3d" },
                        { label: "7 jours", value: "7d" },
                        { label: "Anytime", value: "any" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700 group-hover:text-slate-900">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Note minimum */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-slate-600" />
                      Note minimum
                    </h4>
                    <div className="space-y-2">
                      {[5, 4, 3].map((rating) => (
                        <label
                          key={rating}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <input
                            type="radio"
                            name="rating"
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex items-center gap-1">
                            {[...Array(rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 fill-amber-400 text-amber-400"
                              />
                            ))}
                            <span className="text-sm text-slate-700 ml-1 group-hover:text-slate-900">
                              & plus
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Catégories associées */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">
                    Catégories associées
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: "Design Graphique", count: 45 },
                      { name: "Web Design", count: 32 },
                      { name: "UI/UX Design", count: 28 },
                      { name: "Illustration", count: 19 },
                    ].map((cat) => (
                      <Link
                        key={cat.name}
                        href={`/categories/${cat.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <span className="text-sm text-slate-700 group-hover:text-slate-900">
                          {cat.name}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                          {cat.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* ZONE PRINCIPALE */}
            <div className="lg:col-span-9">
              {/* Barre de tri et affichage */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="font-heading font-bold text-2xl text-slate-900">
                    Tous les services {categoryName}
                  </h2>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                    {data.total} résultats
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Bouton filtres mobile */}
                  <Button
                    variant="outline"
                    className="lg:hidden border-slate-300 text-slate-700"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                  </Button>

                  {/* Tri */}
                  <select
                    value={sort}
                    onChange={(e) => applySort(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="popular">Les plus populaires</option>
                    <option value="recent">Les plus récents</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="rating">Meilleure note</option>
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
                          viewMode === "grid"
                            ? "text-slate-700"
                            : "text-slate-400"
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
                          viewMode === "list"
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Services Tendance */}
              {!loading && !error && data.services.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">
                        🔥 Services populaires en {categoryName}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Les services les plus demandés dans cette catégorie
                      </p>
                    </div>
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

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-semibold">
                    Erreur de chargement
                  </p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Réessayer
                  </button>
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
                      <ServiceCard service={service} variant={viewMode} />
                    </div>
                  ))}
                </div>
              )}

              {/* Message si aucun résultat */}
              {!loading && !error && data.services.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Folder className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 mb-2">
                    Aucun service trouvé
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Aucun service n'est disponible dans la catégorie "
                    {categoryName}" pour le moment
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/explorer">
                      <Button className="bg-indigo-600 text-white hover:bg-indigo-700 border-0">
                        Explorer toutes les catégories
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="border-2 border-slate-300 text-slate-700"
                      onClick={() => window.history.back()}
                    >
                      Retour
                    </Button>
                  </div>
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
                      Précédent
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
                      }
                    )}

                    <Button
                      variant="outline"
                      className="border-slate-300 text-slate-700"
                      disabled={data.currentPage === data.totalPages}
                      onClick={() => goToPage(data.currentPage + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 rounded-full text-amber-300 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Vous proposez des services de {categoryName} ?
            </div>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-4">
              Rejoignez Notre Plateforme
            </h2>
            <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
              Proposez vos services et touchez des milliers de clients
              potentiels
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold shadow-2xl border-0"
            >
              Devenir Prestataire
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
