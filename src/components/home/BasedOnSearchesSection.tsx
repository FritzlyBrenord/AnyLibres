// ============================================================================
// Component: BasedOnSearchesSection - Basé sur vos recherches
// Recommandations intelligentes basées sur l'historique de recherche
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { Carousel } from '@/components/ui/Carousel';
import { ServiceCard } from '@/components/service/ServiceCard';
import type { Service } from '@/types';

export function BasedOnSearchesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBasedOnSearches = async () => {
      try {
        // Récupérer l'historique de recherche depuis localStorage
        const savedSearches = localStorage.getItem('recentSearches');
        const searches = savedSearches ? JSON.parse(savedSearches) : [];

        if (searches.length === 0) {
          setLoading(false);
          return;
        }

        // Prendre les 5 dernières recherches pour avoir plus de variété
        const recentSearchQueries = searches.slice(0, 5).map((s: any) => s.query || s);

        // Fetch des services basés sur les recherches
        const query = recentSearchQueries.join(' '); // Combiner les recherches
        const response = await fetch(`/api/services/search?q=${encodeURIComponent(query)}&limit=20`);

        if (response.ok) {
          const data = await response.json();
          setServices(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching search-based services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBasedOnSearches();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="h-8 w-64 bg-purple-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-purple-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return null; // Ne pas afficher si pas de services
  }

  return (
    <section className="py-12 bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-slate-900">
                Recommandations pour vous
              </h2>
              <p className="text-sm text-slate-600">
                Sélectionnés selon vos préférences et recherches
              </p>
            </div>
          </div>

          <Link
            href="/search"
            className="hidden sm:flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors group"
          >
            Voir plus
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Carousel */}
        <Carousel
          itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
          gap={24}
        >
          {services.map((service) => (
            <div key={service.id} className="relative">
              <ServiceCard service={service} />
              {/* Badge "Recommandé" */}
              <div className="absolute top-2 left-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Recommandé
              </div>
            </div>
          ))}
        </Carousel>

        {/* Mobile "Voir plus" */}
        <Link
          href="/search"
          className="sm:hidden flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mt-6 transition-colors"
        >
          Voir plus
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
