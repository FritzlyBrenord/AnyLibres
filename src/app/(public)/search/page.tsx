// ============================================================================
// PAGE: Search - Recherche Ultra-Puissante avec Filtres Intelligents
// Fonctionnalités avancées:
// - Recherche en temps réel avec suggestions
// - Analyse par lettre/chiffre
// - Filtres multicritères (titre, description, prix, provider)
// - Résultats hiérarchisés (exact, similaire, autres)
// ============================================================================

import Link from "next/link";
import {
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Filter,
  Zap,
  Shield,
} from "lucide-react";
import { AdvancedSearchBar } from "@/components/search/AdvancedSearchBar";
import { SearchResults, SearchResultsCompact } from "@/components/search/SearchResults";
import { Button } from "@/components/ui/Button";

// Fetch résultats avec les nouveaux paramètres
async function getSearchResults(params: {
  q?: string;
  page?: string;
  letter?: string;
  startsWith?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const limit = 20;

  console.log("🔍 Search params:", params);

  // Construire les paramètres de recherche
  const searchQuery = new URLSearchParams();
  if (query) searchQuery.set("q", query);
  if (params.letter) searchQuery.set("letter", params.letter);
  if (params.startsWith) searchQuery.set("startsWith", params.startsWith);
  if (params.minPrice) searchQuery.set("minPrice", params.minPrice);
  if (params.maxPrice) searchQuery.set("maxPrice", params.maxPrice);
  if (params.sort) searchQuery.set("sort", params.sort);
  searchQuery.set("page", page.toString());
  searchQuery.set("limit", limit.toString());

  try {
    const apiUrl = `${baseUrl}/api/services/search?${searchQuery.toString()}`;
    console.log("📡 Calling API:", apiUrl);

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("❌ API response not OK:", response.status);
      return {
        services: [],
        total: 0,
        query,
        currentPage: page,
        totalPages: 0,
        resultCategories: null,
      };
    }

    const data = await response.json();
    console.log("📦 API Data received:", data);

    if (!data.success) {
      console.error("❌ API returned error:", data.error);
      return {
        services: [],
        total: 0,
        query,
        currentPage: page,
        totalPages: 0,
        resultCategories: null,
      };
    }

    return {
      services: data.data || [],
      total: data.total || 0,
      query,
      currentPage: data.currentPage || page,
      totalPages: data.totalPages || 0,
      resultCategories: data.resultCategories || null,
      filters: data.filters || {},
    };
  } catch (error) {
    console.error("💥 Error fetching search results:", error);
    return {
      services: [],
      total: 0,
      query,
      currentPage: page,
      totalPages: 0,
      resultCategories: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    letter?: string;
    startsWith?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const letter = params.letter || "";

  const results = await getSearchResults(params);

  const hasSearch = query || letter || params.minPrice || params.maxPrice;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <main className="flex-1">
        {/* HERO SECTION AVEC BARRE DE RECHERCHE AVANCÉE */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white py-16">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">
                    Recherche Intelligente
                  </span>
                </div>
                <h1 className="font-heading font-bold text-3xl lg:text-5xl mb-4">
                  Trouvez{" "}
                  <span className="text-yellow-400">
                    exactement
                  </span>{" "}
                  ce que vous cherchez
                </h1>
                <p className="text-slate-200 text-lg mb-8 max-w-2xl mx-auto">
                  Recherche ultra-puissante par titre, description, prix, provider, lettre et bien plus...
                </p>
              </div>

              {/* Barre de recherche avancée */}
              <AdvancedSearchBar />

              {/* Statistiques rapides */}
              {hasSearch && results.total > 0 && (
                <div className="flex flex-wrap justify-center gap-6 mt-8">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {results.total.toLocaleString()} résultat{results.total > 1 ? "s" : ""}
                    </span>
                  </div>
                  {results.resultCategories?.exact && results.resultCategories.exact.length > 0 && (
                    <div className="flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-400/30">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {results.resultCategories.exact.length} match{results.resultCategories.exact.length > 1 ? "s" : ""} parfait{results.resultCategories.exact.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <Shield className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">
                      Professionnels vérifiés
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="container mx-auto px-4 py-8">
          {hasSearch ? (
            <>
              {/* Informations sur la recherche */}
              <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-heading font-bold text-2xl text-slate-900 mb-2">
                      {query && `Résultats pour "${query}"`}
                      {letter && `Services ${params.startsWith === 'true' ? 'commençant' : 'contenant'} la lettre "${letter}"`}
                      {params.minPrice && params.maxPrice && `Services entre ${params.minPrice}€ et ${params.maxPrice}€`}
                      {!query && !letter && !params.minPrice && "Résultats de recherche"}
                    </h2>
                    <p className="text-slate-600">
                      {results.total > 0
                        ? `${results.total.toLocaleString()} service${results.total > 1 ? "s" : ""} trouvé${results.total > 1 ? "s" : ""}`
                        : "Aucun résultat"}
                    </p>
                  </div>

                  {/* Aperçu compact des catégories */}
                  {results.resultCategories && query && (
                    <div className="lg:max-w-md">
                      <SearchResultsCompact
                        exactMatches={results.resultCategories.exact || []}
                        similarMatches={results.resultCategories.similar || []}
                        otherMatches={results.resultCategories.other || []}
                      />
                    </div>
                  )}
                </div>
              </div>

              {results.services.length > 0 ? (
                <>
                  {/* Résultats hiérarchisés */}
                  <SearchResults
                    query={query}
                    exactMatches={results.resultCategories?.exact}
                    similarMatches={results.resultCategories?.similar}
                    otherMatches={results.resultCategories?.other}
                    allResults={results.services}
                    showHierarchy={!!query && !!results.resultCategories}
                  />

                  {/* PAGINATION */}
                  {results.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-12 mt-12 border-t border-slate-200/60">
                      {/* Info page actuelle */}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <TrendingUp className="w-4 h-4 text-yellow-600" />
                        <span>
                          Page <strong>{results.currentPage}</strong> sur{" "}
                          {results.totalPages}
                        </span>
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center gap-2">
                        {/* Bouton Précédent */}
                        {results.currentPage > 1 ? (
                          <Link
                            href={`/search?${new URLSearchParams({
                              ...params,
                              page: (results.currentPage - 1).toString(),
                            }).toString()}`}
                          >
                            <button className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:border-yellow-500 hover:text-yellow-700 transition-all duration-200 flex items-center gap-2 group">
                              <ChevronLeft className="w-4 h-4 group-hover:text-yellow-600 transition-colors" />
                              Précédent
                            </button>
                          </Link>
                        ) : (
                          <button
                            className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed flex items-center gap-2"
                            disabled
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Précédent
                          </button>
                        )}

                        {/* Numéros de pages */}
                        <div className="hidden sm:flex items-center gap-1">
                          {Array.from(
                            { length: Math.min(results.totalPages, 7) },
                            (_, i) => {
                              let pageNum;

                              if (results.totalPages <= 7) {
                                pageNum = i + 1;
                              } else if (results.currentPage <= 4) {
                                pageNum = i + 1;
                              } else if (
                                results.currentPage >=
                                results.totalPages - 3
                              ) {
                                pageNum = results.totalPages - 6 + i;
                              } else {
                                pageNum = results.currentPage - 3 + i;
                              }

                              return (
                                <Link
                                  key={pageNum}
                                  href={`/search?${new URLSearchParams({
                                    ...params,
                                    page: pageNum.toString(),
                                  }).toString()}`}
                                >
                                  <button
                                    className={`min-w-[44px] h-11 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                      pageNum === results.currentPage
                                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25"
                                        : "bg-white text-slate-700 hover:bg-yellow-50 hover:text-yellow-700 border border-slate-200 hover:border-yellow-300"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                </Link>
                              );
                            }
                          )}
                        </div>

                        {/* Bouton Suivant */}
                        {results.currentPage < results.totalPages ? (
                          <Link
                            href={`/search?${new URLSearchParams({
                              ...params,
                              page: (results.currentPage + 1).toString(),
                            }).toString()}`}
                          >
                            <button className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:border-yellow-500 hover:text-yellow-700 transition-all duration-200 flex items-center gap-2 group">
                              Suivant
                              <ChevronRight className="w-4 h-4 group-hover:text-yellow-600 transition-colors" />
                            </button>
                          </Link>
                        ) : (
                          <button
                            className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed flex items-center gap-2"
                            disabled
                          >
                            Suivant
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* AUCUN RÉSULTAT */
                <div className="max-w-2xl mx-auto text-center py-20">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <AlertCircle className="w-12 h-12 text-yellow-600" />
                    </div>
                  </div>

                  <h2 className="font-heading font-bold text-3xl text-slate-900 mb-4">
                    Aucun service trouvé
                  </h2>

                  <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                    Nous n&apos;avons trouvé aucun service correspondant à vos critères.
                    Essayez de modifier votre recherche ou vos filtres.
                  </p>

                  <div className="bg-gradient-to-br from-blue-50 to-yellow-50 border border-blue-200/60 rounded-2xl p-8 mb-8 text-left shadow-sm">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      Suggestions pour améliorer votre recherche :
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-700">
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Vérifiez l&apos;orthographe de vos mots-clés
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Essayez des termes plus généraux ou différents
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Utilisez moins de filtres pour élargir la recherche
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Essayez la recherche par lettre (A-Z) en haut
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/explorer">
                      <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 border-0 shadow-lg shadow-yellow-500/25 transition-all duration-200">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Explorer par catégories
                      </Button>
                    </Link>
                    <Link href="/search">
                      <Button
                        variant="outline"
                        className="border-2 border-slate-300 text-slate-700 hover:border-yellow-500 hover:text-yellow-700 transition-all duration-200"
                      >
                        Nouvelle recherche
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* PAS DE RECHERCHE - Écran d'accueil */
            <div className="max-w-4xl mx-auto text-center py-20">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Search className="w-16 h-16 text-slate-600" />
                </div>
                <div className="absolute top-4 right-1/4">
                  <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                </div>
              </div>

              <h2 className="font-heading font-bold text-4xl text-slate-900 mb-6">
                Recherche Intelligente
              </h2>

              <p className="text-slate-600 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                Utilisez la barre de recherche avancée ci-dessus pour trouver
                exactement ce que vous cherchez. Recherchez par titre, description,
                prix, provider, ou même par lettre !
              </p>

              {/* Fonctionnalités */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-2">
                    Recherche Ultra-Rapide
                  </h3>
                  <p className="text-sm text-slate-600">
                    Suggestions en temps réel pendant que vous tapez
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-2">
                    Filtres Intelligents
                  </h3>
                  <p className="text-sm text-slate-600">
                    Recherchez par titre, prix, provider, lettre et plus
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-2">
                    Résultats Hiérarchisés
                  </h3>
                  <p className="text-sm text-slate-600">
                    Matchs parfaits, similaires et suggestions pertinentes
                  </p>
                </div>
              </div>

              <Link href="/explorer">
                <Button className="bg-gradient-to-r from-slate-900 to-blue-900 text-white hover:from-slate-800 hover:to-blue-800 border-0 shadow-lg transition-all duration-200 text-base px-8 py-3">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Explorer notre catalogue
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
