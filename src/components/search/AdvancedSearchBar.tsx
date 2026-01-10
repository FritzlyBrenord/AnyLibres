// ============================================================================
// Component: AdvancedSearchBar - Recherche Ultra-Puissante avec Filtres Intelligents
// Fonctionnalités:
// - Recherche en temps réel avec suggestions
// - Analyse par lettre/chiffre
// - Filtres dynamiques (titre, description, prix, provider)
// - Suggestions hiérarchisées (exact, similaire, autres)
// ============================================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  X,
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  User,
  Tag,
  Sparkles,
  ChevronDown,
  Check,
  SlidersHorizontal,
  Hash,
  Type,
  Star,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Service, ProviderProfile } from '@/types';
import { useLanguageContext } from '@/contexts/LanguageContext';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'exact' | 'similar' | 'service' | 'provider' | 'letter' | 'number' | 'price';
  score: number;
  service?: Service;
  provider?: ProviderProfile;
  icon?: React.ReactNode;
}

interface FilterOptions {
  searchIn: {
    title: boolean;
    description: boolean;
    tags: boolean;
    provider: boolean;
    price: boolean;
  };
  priceRange: {
    min: number | null;
    max: number | null;
  };
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'recent';
  letter?: string;
  startsWith?: string;
}

export function AdvancedSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguageContext();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    searchIn: {
      title: true,
      description: true,
      tags: true,
      provider: true,
      price: false,
    },
    priceRange: {
      min: null,
      max: null,
    },
    sortBy: 'relevance',
  });

  // Charger les recherches récentes depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Sauvegarder une recherche récente
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Fermer suggestions si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fonction pour analyser et générer des suggestions intelligentes
  const generateSuggestions = useCallback(async (query: string) => {
    if (query.length === 0) {
      // Afficher les recherches récentes
      const recentSuggestions: SearchSuggestion[] = recentSearches.map((text, i) => ({
        id: `recent-${i}`,
        text,
        type: 'exact',
        score: 100 - i,
        icon: <Clock className="w-4 h-4" />,
      }));
      setSuggestions(recentSuggestions);
      return;
    }

    setLoading(true);
    const newSuggestions: SearchSuggestion[] = [];

    try {
      // 1. Analyse par lettre unique (A-Z, 0-9)
      if (query.length === 1) {
        const char = query.toUpperCase();
        if (/^[A-Z]$/.test(char)) {
          newSuggestions.push({
            id: `letter-starts-${char}`,
            text: `Services commençant par "${char}"`,
            type: 'letter',
            score: 1000,
            icon: <Type className="w-4 h-4" />,
          });
          newSuggestions.push({
            id: `letter-contains-${char}`,
            text: `Services contenant "${char}"`,
            type: 'letter',
            score: 900,
            icon: <Tag className="w-4 h-4" />,
          });
        } else if (/^\d$/.test(char)) {
          newSuggestions.push({
            id: `number-${char}`,
            text: `Services avec prix contenant "${char}"`,
            type: 'number',
            score: 950,
            icon: <Hash className="w-4 h-4" />,
          });
        }
      }

      // 2. Analyse de prix (détection automatique)
      const priceMatch = query.match(/(\d+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        newSuggestions.push({
          id: `price-exact-${price}`,
          text: `Services autour de ${price}€`,
          type: 'price',
          score: 800,
          icon: <DollarSign className="w-4 h-4" />,
        });
        newSuggestions.push({
          id: `price-max-${price}`,
          text: `Services moins de ${price}€`,
          type: 'price',
          score: 750,
          icon: <DollarSign className="w-4 h-4" />,
        });
      }

      // 3. Recherche dans l'API pour des suggestions réelles
      if (query.length >= 2) {
        const response = await fetch(`/api/services/suggest?q=${encodeURIComponent(query)}&limit=10`);

        if (response.ok) {
          const data = await response.json();

          // Ajouter les services correspondants
          if (data.services && data.services.length > 0) {
            data.services.forEach((service: Service, index: number) => {
              const titleMatch = service.title?.toString().toLowerCase().includes(query.toLowerCase());
              const descMatch = service.description?.toString().toLowerCase().includes(query.toLowerCase());

              newSuggestions.push({
                id: `service-${service.id}`,
                text: service.title?.toString() || 'Service',
                type: titleMatch ? 'exact' : 'similar',
                score: 700 - index,
                service,
                icon: titleMatch ? <Zap className="w-4 h-4 text-yellow-500" /> : <Sparkles className="w-4 h-4" />,
              });
            });
          }

          // Ajouter les providers correspondants
          if (data.providers && data.providers.length > 0) {
            data.providers.forEach((provider: ProviderProfile, index: number) => {
              newSuggestions.push({
                id: `provider-${provider.id}`,
                text: `Services de ${provider.company_name || provider.profile?.display_name || 'Provider'}`,
                type: 'provider',
                score: 600 - index,
                provider,
                icon: <User className="w-4 h-4" />,
              });
            });
          }

          // Ajouter les suggestions de mots-clés
          if (data.keywords && data.keywords.length > 0) {
            data.keywords.forEach((keyword: string, index: number) => {
              newSuggestions.push({
                id: `keyword-${index}`,
                text: keyword,
                type: 'similar',
                score: 500 - index,
                icon: <TrendingUp className="w-4 h-4" />,
              });
            });
          }
        }
      }

      // 4. Suggestions basées sur les premiers caractères
      if (query.length >= 2) {
        const firstChar = query.charAt(0).toUpperCase();
        newSuggestions.push({
          id: `starts-with-${firstChar}`,
          text: `Tous les services commençant par "${firstChar}"`,
          type: 'letter',
          score: 400,
          icon: <Filter className="w-4 h-4" />,
        });
      }

      // Trier par score et limiter à 12 suggestions
      const sorted = newSuggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

      setSuggestions(sorted);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [recentSearches]);

  // Debounce pour les suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSuggestions) {
        generateSuggestions(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showSuggestions, generateSuggestions]);

  const handleSearch = (e?: React.FormEvent, customQuery?: string) => {
    e?.preventDefault();
    const query = customQuery || searchQuery;

    if (!query.trim()) return;

    saveRecentSearch(query);
    setShowSuggestions(false);

    // Construire les paramètres de recherche avec filtres
    const params = new URLSearchParams();
    params.set('q', query);

    if (filters.priceRange.min) params.set('minPrice', filters.priceRange.min.toString());
    if (filters.priceRange.max) params.set('maxPrice', filters.priceRange.max.toString());
    if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);

    router.push(`/search?${params.toString()}`);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'service' && suggestion.service) {
      router.push(`/services/${suggestion.service.id}`);
    } else if (suggestion.type === 'provider' && suggestion.provider) {
      router.push(`/providers/${suggestion.provider.id}`);
    } else if (suggestion.type === 'letter') {
      const letter = suggestion.text.match(/["']([A-Z])["']/)?.[1];
      if (letter) {
        if (suggestion.id.includes('starts')) {
          router.push(`/search?q=&letter=${letter}&startsWith=true`);
        } else {
          router.push(`/search?q=&letter=${letter}`);
        }
      }
    } else if (suggestion.type === 'price') {
      const priceMatch = suggestion.text.match(/(\d+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        if (suggestion.id.includes('max')) {
          router.push(`/search?q=&maxPrice=${price}`);
        } else {
          router.push(`/search?q=&minPrice=${price * 0.8}&maxPrice=${price * 1.2}`);
        }
      }
    } else {
      setSearchQuery(suggestion.text);
      handleSearch(undefined, suggestion.text);
    }

    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const toggleFilter = (category: keyof FilterOptions['searchIn']) => {
    setFilters(prev => ({
      ...prev,
      searchIn: {
        ...prev.searchIn,
        [category]: !prev.searchIn[category],
      },
    }));
  };

  const activeFiltersCount = Object.values(filters.searchIn).filter(Boolean).length +
    (filters.priceRange.min ? 1 : 0) + (filters.priceRange.max ? 1 : 0);

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Barre de recherche principale */}
      <form onSubmit={handleSearch}>
        <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Input de recherche */}
          <div className="flex items-center gap-2 p-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setShowSuggestions(true);
                  if (searchQuery.length === 0) {
                    generateSuggestions('');
                  }
                }}
                placeholder="Recherchez par titre, description, prix, provider, lettre..."
                className="w-full pl-12 pr-12 py-4 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-lg bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bouton Filtres */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`relative px-4 py-4 rounded-xl border transition-all ${
                showFilters
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-amber-300'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFiltersCount > 5 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount - 5}
                </span>
              )}
            </button>

            {/* Bouton Rechercher */}
            <Button
              type="submit"
              size="lg"
              className="px-8 whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0 shadow-lg"
            >
              <Search className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Rechercher</span>
            </Button>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="border-t border-slate-200 bg-slate-50 p-4 animate-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Rechercher dans */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Rechercher dans
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(filters.searchIn).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          value ? 'bg-amber-500 border-amber-500' : 'border-slate-300 group-hover:border-amber-400'
                        }`}>
                          {value && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-slate-700 capitalize">{key}</span>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => toggleFilter(key as keyof FilterOptions['searchIn'])}
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Plage de prix */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Prix (€)
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, min: e.target.value ? parseFloat(e.target.value) : null }
                      }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, max: e.target.value ? parseFloat(e.target.value) : null }
                      }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                    />
                  </div>
                </div>

                {/* Tri */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Trier par
                  </h3>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterOptions['sortBy'] }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                  >
                    <option value="relevance">Pertinence</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="rating">Meilleure note</option>
                    <option value="recent">Plus récents</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({
                      searchIn: { title: true, description: true, tags: true, provider: true, price: false },
                      priceRange: { min: null, max: null },
                      sortBy: 'relevance',
                    })}
                    className="border-slate-300"
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Dropdown des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-slide-down max-h-[500px] overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}

          <div className="p-2">
            {/* Grouper par type */}
            {searchQuery.length === 0 && recentSearches.length > 0 && (
              <div className="mb-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Recherches récentes
                </div>
                {suggestions.filter(s => s.type === 'exact' && recentSearches.includes(s.text)).map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                  />
                ))}
              </div>
            )}

            {suggestions.filter(s => s.type === 'letter' || s.type === 'number').length > 0 && (
              <div className="mb-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Filtres intelligents
                </div>
                {suggestions.filter(s => s.type === 'letter' || s.type === 'number').map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                  />
                ))}
              </div>
            )}

            {suggestions.filter(s => s.type === 'exact').length > 0 && searchQuery.length > 0 && (
              <div className="mb-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  Correspondances exactes
                </div>
                {suggestions.filter(s => s.type === 'exact').map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                  />
                ))}
              </div>
            )}

            {suggestions.filter(s => s.type === 'service').length > 0 && (
              <div className="mb-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                  <Star className="w-3 h-3" />
                  Services
                </div>
                {suggestions.filter(s => s.type === 'service').slice(0, 5).map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    showPrice={suggestion.service}
                  />
                ))}
              </div>
            )}

            {suggestions.filter(s => s.type === 'provider').length > 0 && (
              <div className="mb-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                  <User className="w-3 h-3" />
                  Providers
                </div>
                {suggestions.filter(s => s.type === 'provider').map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                  />
                ))}
              </div>
            )}

            {suggestions.filter(s => s.type === 'similar' || s.type === 'price').length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Suggestions
                </div>
                {suggestions.filter(s => s.type === 'similar' || s.type === 'price').map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour chaque suggestion
function SuggestionItem({
  suggestion,
  onClick,
  showPrice
}: {
  suggestion: SearchSuggestion;
  onClick: () => void;
  showPrice?: Service | undefined;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-amber-50 rounded-lg transition-colors text-left group"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-slate-400 group-hover:text-amber-500 transition-colors flex-shrink-0">
          {suggestion.icon || <Search className="w-4 h-4" />}
        </div>
        <span className="text-slate-900 group-hover:text-amber-700 truncate">
          {suggestion.text}
        </span>
      </div>
      {showPrice && (
        <span className="text-sm font-semibold text-slate-600 group-hover:text-amber-600 flex-shrink-0">
          {showPrice.base_price_cents ? `${(showPrice.base_price_cents / 100).toFixed(0)}€` : ''}
        </span>
      )}
    </button>
  );
}
