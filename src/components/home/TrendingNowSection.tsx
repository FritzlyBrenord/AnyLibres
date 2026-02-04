// ============================================================================
// Component: TrendingNowSection - Tendances du moment
// Services populaires avec le plus de vues/commandes récemment
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight, Flame } from 'lucide-react';
import { Carousel } from '@/components/ui/Carousel';
import { ServiceCard } from '@/components/service/ServiceCard';
import type { Service } from '@/types';
import { useSafeLanguage } from '@/hooks/useSafeLanguage';

export function TrendingNowSection() {
  const { t } = useSafeLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Récupérer les services les plus populaires
        const response = await fetch('/api/services/trending?limit=20');

        if (response.ok) {
          const data = await response.json();
          setServices(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching trending services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="h-8 w-64 bg-orange-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-orange-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-slate-900">
                {t.home.connected.trending.title}
              </h2>
              <p className="text-sm text-slate-600">
                {t.home.connected.trending.subtitle}
              </p>
            </div>
          </div>

          <Link
            href="/explorer?sort=trending"
            className="hidden sm:flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors group"
          >
            {t.home.connected.viewAll}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Carousel */}
        <Carousel
          itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
          gap={24}
          autoScroll={true}
          autoScrollInterval={6000}
        >
          {services.map((service, index) => (
            <div key={service.id} className="relative">
              <ServiceCard service={service} />
              {/* Badge "Tendance" avec position */}
              <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                #{index + 1} {t.home.connected.trending.badge}
              </div>
            </div>
          ))}
        </Carousel>

        {/* Mobile "Voir tout" */}
        <Link
          href="/explorer?sort=trending"
          className="sm:hidden flex items-center justify-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mt-6 transition-colors"
        >
          {t.home.connected.viewAll}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
