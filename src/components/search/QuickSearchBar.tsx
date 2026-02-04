// ============================================================================
// Component: QuickSearchBar - Barre de recherche rapide pour le Header
// Suggestions intelligentes compactes en temps réel
// ============================================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  TrendingUp,
  Zap,
  Type,
  Hash,
  DollarSign,
} from "lucide-react";

interface QuickSuggestion {
  id: string;
  text: string;
  type: "service" | "letter" | "number" | "price" | "recent";
  icon?: React.ReactNode;
}

interface QuickSearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function QuickSearchBar({
  placeholder = "Logo, site web, marketing...",
  className = "",
  onSearch,
}: QuickSearchBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les recherches récentes
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading recent searches:", e);
      }
    }
  }, []);

  // Fermer suggestions si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Générer suggestions rapides
  const generateQuickSuggestions = useCallback(
    async (query: string) => {
      if (query.length === 0) {
        // Afficher les recherches récentes
        const recent: QuickSuggestion[] = recentSearches
          .slice(0, 3)
          .map((text, i) => ({
            id: `recent-${i}`,
            text,
            type: "recent",
            icon: <TrendingUp className="w-4 h-4 text-slate-400" />,
          }));
        setSuggestions(recent);
        return;
      }

      const newSuggestions: QuickSuggestion[] = [];

      // 1. Analyse par lettre unique
      if (query.length === 1) {
        const char = query.toUpperCase();
        if (/^[A-Z]$/.test(char)) {
          newSuggestions.push({
            id: `letter-${char}`,
            text: `Services commençant par "${char}"`,
            type: "letter",
            icon: <Type className="w-4 h-4 text-blue-500" />,
          });
        } else if (/^\d$/.test(char)) {
          newSuggestions.push({
            id: `number-${char}`,
            text: `Prix autour de ${char}0€`,
            type: "number",
            icon: <Hash className="w-4 h-4 text-green-500" />,
          });
        }
      }

      // 2. Détection de prix
      const priceMatch = query.match(/(\d+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        newSuggestions.push({
          id: `price-${price}`,
          text: `Services autour de ${price}€`,
          type: "price",
          icon: <DollarSign className="w-4 h-4 text-green-500" />,
        });
      }

      // 3. Appel API pour suggestions réelles (limité à 3 pour la rapidité)
      if (query.length >= 2) {
        try {
          const response = await fetch(
            `/api/services/suggest?q=${encodeURIComponent(query)}&limit=3`,
          );
          if (response.ok) {
            const data = await response.json();

            // Ajouter les services
            if (data.services && data.services.length > 0) {
              data.services
                .slice(0, 3)
                .forEach((service: any, index: number) => {
                  const titleMatch = service.title
                    ?.toString()
                    .toLowerCase()
                    .includes(query.toLowerCase());
                  newSuggestions.push({
                    id: `service-${service.id}`,
                    text: service.title?.toString() || "Service",
                    type: "service",
                    icon: (
                      <Zap
                        className={`w-4 h-4 ${titleMatch ? "text-yellow-500" : "text-slate-400"}`}
                      />
                    ),
                  });
                });
            }
          }
        } catch (error) {
          console.error("Error fetching quick suggestions:", error);
        }
      }

      setSuggestions(newSuggestions.slice(0, 5)); // Limiter à 5 suggestions max
    },
    [recentSearches],
  );

  // Debounce pour les suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSuggestions) {
        generateQuickSuggestions(searchQuery);
      }
    }, 200); // Plus rapide que AdvancedSearchBar

    return () => clearTimeout(timer);
  }, [searchQuery, showSuggestions, generateQuickSuggestions]);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
      0,
      5,
    ); // Top 5
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleSearch = (e?: React.FormEvent, customQuery?: string) => {
    e?.preventDefault();
    const query = customQuery || searchQuery;

    if (!query.trim()) return;

    saveRecentSearch(query);
    setShowSuggestions(false);

    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSuggestionClick = (suggestion: QuickSuggestion) => {
    if (suggestion.type === "letter") {
      const letter = suggestion.text.match(/["']([A-Z])["']/)?.[1];
      if (letter) {
        router.push(`/search?letter=${letter}&startsWith=true`);
      }
    } else if (suggestion.type === "price" || suggestion.type === "number") {
      const price = suggestion.text.match(/(\d+)/)?.[1];
      if (price) {
        const priceNum = parseInt(price);
        router.push(
          `/search?minPrice=${priceNum * 0.8}&maxPrice=${priceNum * 1.2}`,
        );
      }
    } else {
      setSearchQuery(suggestion.text);
      handleSearch(undefined, suggestion.text);
    }
    setShowSuggestions(false);
  };

  return (
    <div ref={searchRef} className={`relative w-[400px] ${className}`}>
      <form onSubmit={handleSearch} className="relative w-full group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            setShowSuggestions(true);
            if (searchQuery.length === 0) {
              generateQuickSuggestions("");
            }
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-300 hover:border-slate-300"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown des suggestions rapides */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-slide-down">
          <div className="py-2">
            {searchQuery.length === 0 && recentSearches.length > 0 && (
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase">
                Récentes
              </div>
            )}
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group/item"
              >
                <div className="flex-shrink-0">
                  {suggestion.icon || (
                    <Search className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <span className="text-sm text-slate-700 group-hover/item:text-slate-900 truncate flex-1">
                  {suggestion.text}
                </span>
                {suggestion.type === "service" && (
                  <div className="flex-shrink-0 text-xs text-slate-400">
                    Appuyez sur Entrée
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Version Mobile compacte
export function QuickSearchBarMobile({
  placeholder = "Rechercher...",
  onSearch,
}: {
  placeholder?: string;
  onSearch?: (query: string) => void;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Sauvegarder dans les recherches récentes
    const saved = localStorage.getItem("recentSearches");
    const recent = saved ? JSON.parse(saved) : [];
    const updated = [
      searchQuery,
      ...recent.filter((s: string) => s !== searchQuery),
    ].slice(0, 5);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        autoFocus
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </form>
  );
}
