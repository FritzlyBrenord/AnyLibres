// ============================================================================
// Component: SmartSearchBar - Barre de recherche intelligente avec suggestions
// ============================================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function SmartSearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches] = useState(['Logo Design', 'Site Web', 'SEO', 'Vidéo Marketing']);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Simulated auto-suggestion (à remplacer par API)
  useEffect(() => {
    if (searchQuery.length > 2) {
      const mockSuggestions = [
        'Logo professionnel',
        'Logo minimaliste',
        'Logo startup',
        'Site web e-commerce',
        'Site web vitrine',
        'Marketing digital',
        'SEO optimisation',
      ].filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      setSuggestions(mockSuggestions.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div
      ref={searchRef}
      className="max-w-4xl mx-auto animate-slide-up relative"
      style={{ animationDelay: '0.2s' }}
    >
      <form onSubmit={handleSearch}>
        <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-2 border border-white/20">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(searchQuery.length > 2)}
                placeholder="Que recherchez-vous aujourd'hui ?"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-lg bg-transparent"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="px-8 whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0 shadow-lg"
            >
              Rechercher
            </Button>
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-slide-down">
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors text-left"
                  >
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-900">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length === 0 && recentSearches.length > 0 && (
              <div className="p-2 border-t border-slate-100">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">
                  Recherches récentes
                </div>
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(recent)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{recent}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}