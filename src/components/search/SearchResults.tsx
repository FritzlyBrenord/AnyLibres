// ============================================================================
// Component: SearchResults - Affichage hiérarchisé des résultats de recherche
// Affiche les résultats en 3 catégories :
// 1. Correspondances exactes
// 2. Services similaires
// 3. Autres résultats pertinents
// ============================================================================

'use client';

import { useState } from 'react';
import { ServiceCard } from '@/components/service/ServiceCard';
import { Zap, Sparkles, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { Service } from '@/types';

interface SearchResultsProps {
  query: string;
  exactMatches?: Service[];
  similarMatches?: Service[];
  otherMatches?: Service[];
  allResults?: Service[];
  showHierarchy?: boolean;
}

export function SearchResults({
  query,
  exactMatches = [],
  similarMatches = [],
  otherMatches = [],
  allResults = [],
  showHierarchy = true,
}: SearchResultsProps) {
  const [showSimilar, setShowSimilar] = useState(true);
  const [showOther, setShowOther] = useState(true);

  // Si pas de hiérarchie, afficher tous les résultats normalement
  if (!showHierarchy || !query) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allResults.map((service: Service, index: number) => (
          <div
            key={service.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <ServiceCard service={service} />
          </div>
        ))}
      </div>
    );
  }

  const hasExact = exactMatches.length > 0;
  const hasSimilar = similarMatches.length > 0;
  const hasOther = otherMatches.length > 0;

  return (
    <div className="space-y-12">
      {/* Correspondances exactes */}
      {hasExact && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-slate-900">
                Correspondances exactes
              </h2>
              <p className="text-sm text-slate-600">
                {exactMatches.length} service{exactMatches.length > 1 ? 's' : ''} correspondant parfaitement à "{query}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exactMatches.map((service: Service, index: number) => (
              <div
                key={service.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative">
                  {/* Badge "Match parfait" */}
                  <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    ⚡ Match parfait
                  </div>
                  <ServiceCard service={service} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services similaires */}
      {hasSimilar && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-2xl text-slate-900">
                  Services similaires
                </h2>
                <p className="text-sm text-slate-600">
                  {similarMatches.length} service{similarMatches.length > 1 ? 's' : ''} en rapport avec votre recherche
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSimilar(!showSimilar)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-700 transition-all"
            >
              {showSimilar ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Masquer
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Afficher
                </>
              )}
            </button>
          </div>

          {showSimilar && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {similarMatches.map((service: Service, index: number) => (
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
        </section>
      )}

      {/* Autres résultats pertinents */}
      {hasOther && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center shadow-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-2xl text-slate-900">
                  Autres résultats
                </h2>
                <p className="text-sm text-slate-600">
                  {otherMatches.length} autre{otherMatches.length > 1 ? 's' : ''} service{otherMatches.length > 1 ? 's' : ''} qui pourrai{otherMatches.length > 1 ? 'ent' : 't'} vous intéresser
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowOther(!showOther)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 transition-all"
            >
              {showOther ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Masquer
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Afficher
                </>
              )}
            </button>
          </div>

          {showOther && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {otherMatches.map((service: Service, index: number) => (
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
        </section>
      )}

      {/* Message si aucun résultat dans toutes les catégories */}
      {!hasExact && !hasSimilar && !hasOther && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-2">
            Aucun résultat trouvé
          </h3>
          <p className="text-slate-600">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      )}
    </div>
  );
}

// Version compacte pour aperçu rapide
export function SearchResultsCompact({
  exactMatches = [],
  similarMatches = [],
  otherMatches = [],
}: Omit<SearchResultsProps, 'query' | 'allResults' | 'showHierarchy'>) {
  const totalResults = exactMatches.length + similarMatches.length + otherMatches.length;

  if (totalResults === 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <h3 className="font-semibold text-lg text-slate-900 mb-4">
        Aperçu des résultats ({totalResults})
      </h3>

      <div className="space-y-3">
        {exactMatches.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-semibold text-sm text-slate-900">
                  Correspondances exactes
                </div>
                <div className="text-xs text-slate-600">
                  Match parfait avec votre recherche
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {exactMatches.length}
            </div>
          </div>
        )}

        {similarMatches.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-sm text-slate-900">
                  Services similaires
                </div>
                <div className="text-xs text-slate-600">
                  En rapport avec votre recherche
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {similarMatches.length}
            </div>
          </div>
        )}

        {otherMatches.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-600" />
              <div>
                <div className="font-semibold text-sm text-slate-900">
                  Autres résultats
                </div>
                <div className="text-xs text-slate-600">
                  Résultats pertinents
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-600">
              {otherMatches.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
