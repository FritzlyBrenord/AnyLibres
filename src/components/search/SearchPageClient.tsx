"use client";

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
import { useLanguageContext } from "@/contexts/LanguageContext";
import { AdvancedSearchBar } from "@/components/search/AdvancedSearchBar";
import {
  SearchResults,
  SearchResultsCompact,
} from "@/components/search/SearchResults";
import { Button } from "@/components/ui/Button";

interface SearchPageClientProps {
  results: {
    services: any[];
    total: number;
    query: string;
    currentPage: number;
    totalPages: number;
    resultCategories: any;
    filters: any;
    error?: string;
  };
  params: {
    q?: string;
    page?: string;
    letter?: string;
    startsWith?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}

export function SearchPageClient({ results, params }: SearchPageClientProps) {
  const { t } = useLanguageContext();

  const query = params.q || "";
  const letter = params.letter || "";
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
                    {t?.searchPage?.badge || "Recherche Intelligente"}
                  </span>
                </div>
                <h1 className="font-heading font-bold text-3xl lg:text-5xl mb-4">
                  {t?.searchPage?.title ? (
                    <>
                      {t.searchPage.title.split("exactement")[0]}
                      <span className="text-yellow-400">exactement</span>
                      {t.searchPage.title.split("exactement")[1]}
                    </>
                  ) : (
                    <>
                      Trouvez{" "}
                      <span className="text-yellow-400">exactement</span> ce que
                      vous cherchez
                    </>
                  )}
                </h1>
                <p className="text-slate-200 text-lg mb-8 max-w-2xl mx-auto">
                  {t?.searchPage?.subtitle ||
                    "Recherche ultra-puissante par titre, description, prix, provider, lettre et bien plus..."}
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
                      {results.total.toLocaleString()}{" "}
                      {results.total > 1
                        ? t?.searchPage?.results || "résultats"
                        : t?.searchPage?.result || "résultat"}
                    </span>
                  </div>
                  {results.resultCategories?.exact &&
                    results.resultCategories.exact.length > 0 && (
                      <div className="flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-400/30">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {results.resultCategories.exact.length}{" "}
                          {results.resultCategories.exact.length > 1
                            ? t?.searchPage?.matches || "matchs"
                            : t?.searchPage?.match || "match"}{" "}
                          {results.resultCategories.exact.length > 1
                            ? t?.searchPage?.perfectMany || "parfaits"
                            : t?.searchPage?.perfect || "parfait"}
                        </span>
                      </div>
                    )}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <Shield className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {t?.searchPage?.verifiedProviders ||
                        "Professionnels vérifiés"}
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
                      {query &&
                        `${t?.searchPage?.resultsFor || "Résultats pour"} "${query}"`}
                      {letter &&
                        `${
                          t?.searchPage?.[
                            params.startsWith === "true"
                              ? "servicesStarting"
                              : "servicesContaining"
                          ] ||
                          (params.startsWith === "true"
                            ? "Services commençant"
                            : "Services contenant")
                        } ${t?.searchPage?.letterLabel || "la lettre"} "${letter}"`}
                      {params.minPrice &&
                        params.maxPrice &&
                        `${t?.searchPage?.servicesBetween || "Services entre"} ${params.minPrice}€ ${t?.searchPage?.and || "et"} ${params.maxPrice}€`}
                      {!query &&
                        !letter &&
                        !params.minPrice &&
                        (t?.searchPage?.searchResults ||
                          "Résultats de recherche")}
                    </h2>
                    <p className="text-slate-600">
                      {results.total > 0
                        ? `${results.total.toLocaleString()} ${
                            t?.searchPage?.[
                              results.total > 1 ? "foundMany" : "found"
                            ] ||
                            (results.total > 1
                              ? "services trouvés"
                              : "service trouvé")
                          }`
                        : t?.searchPage?.noResults || "Aucun résultat"}
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
                          {t?.searchPage?.page || "Page"}{" "}
                          <strong>{results.currentPage}</strong>{" "}
                          {t?.searchPage?.on || "sur"} {results.totalPages}
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
                              {t?.searchPage?.previous || "Précédent"}
                            </button>
                          </Link>
                        ) : (
                          <button
                            className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed flex items-center gap-2"
                            disabled
                          >
                            <ChevronLeft className="w-4 h-4" />
                            {t?.searchPage?.previous || "Précédent"}
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
                            },
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
                              {t?.searchPage?.next || "Suivant"}
                              <ChevronRight className="w-4 h-4 group-hover:text-yellow-600 transition-colors" />
                            </button>
                          </Link>
                        ) : (
                          <button
                            className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed flex items-center gap-2"
                            disabled
                          >
                            {t?.searchPage?.next || "Suivant"}
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
                    {t?.searchPage?.emptyTitle || "Aucun service trouvé"}
                  </h2>

                  <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                    {t?.searchPage?.emptyDesc ||
                      "Nous n'avons trouvé aucun service correspondant à vos critères. Essayez de modifier votre recherche ou vos filtres."}
                  </p>

                  <div className="bg-gradient-to-br from-blue-50 to-yellow-50 border border-blue-200/60 rounded-2xl p-8 mb-8 text-left shadow-sm">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      {t?.searchPage?.suggestions ||
                        "Suggestions pour améliorer votre recherche :"}
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-700">
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {t?.searchPage?.suggestionSpelling ||
                          "Vérifiez l'orthographe de vos mots-clés"}
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {t?.searchPage?.suggestionGeneral ||
                          "Essayez des termes plus généraux ou différents"}
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {t?.searchPage?.suggestionFilters ||
                          "Utilisez moins de filtres pour élargir la recherche"}
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {t?.searchPage?.suggestionLetter ||
                          "Essayez la recherche par lettre (A-Z) en haut"}
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/explorer">
                      <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 border-0 shadow-lg shadow-yellow-500/25 transition-all duration-200">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {t?.searchPage?.exploreCat || "Explorer par catégories"}
                      </Button>
                    </Link>
                    <Link href="/search">
                      <Button
                        variant="outline"
                        className="border-2 border-slate-300 text-slate-700 hover:border-yellow-500 hover:text-yellow-700 transition-all duration-200"
                      >
                        {t?.searchPage?.newSearch || "Nouvelle recherche"}
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
                {t?.searchPage?.badge || "Recherche Intelligente"}
              </h2>

              <p className="text-slate-600 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                {t?.searchPage?.fastSearch ||
                  "Utilisez la barre de recherche avancée ci-dessus pour trouver exactement ce que vous cherchez. Recherchez par titre, description, prix, provider, ou même par lettre !"}
              </p>

              {/* Fonctionnalités */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-2">
                    {t?.searchPage?.fastSearch || "Recherche Ultra-Rapide"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t?.searchPage?.fastSearchDesc ||
                      "Suggestions en temps réel pendant que vous tapez"}
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-2">
                    {t?.searchPage?.smartFilters || "Filtres Intelligents"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t?.searchPage?.smartFiltersDesc ||
                      "Recherchez par titre, prix, provider, lettre et plus"}
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-2">
                    {t?.searchPage?.hierarchical || "Résultats Hiérarchisés"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t?.searchPage?.hierarchicalDesc ||
                      "Matchs parfaits, similaires et suggestions pertinentes"}
                  </p>
                </div>
              </div>

              <Link href="/explorer">
                <Button className="bg-gradient-to-r from-slate-900 to-blue-900 text-white hover:from-slate-800 hover:to-blue-800 border-0 shadow-lg transition-all duration-200 text-base px-8 py-3">
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t?.searchPage?.exploreCatalog || "Explorer notre catalogue"}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
