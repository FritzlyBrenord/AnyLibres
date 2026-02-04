// ============================================================================
// Component: TopRatedWeekSection - Meilleurs notés de la semaine
// Services avec les meilleures notes récemment
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, ArrowRight, Star } from 'lucide-react';
import { Carousel } from '@/components/ui/Carousel';
import { ServiceCard } from '@/components/service/ServiceCard';
import type { Service } from '@/types';
import { useSafeLanguage } from '@/hooks/useSafeLanguage';

export function TopRatedWeekSection() {
  const { t } = useSafeLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopRated = async () => {
      try {
        const response = await fetch('/api/services/top-rated?period=week&limit=20');

        if (response.ok) {
          const data = await response.json();
          setServices(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching top rated services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRated();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="h-8 w-64 bg-yellow-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-yellow-200 rounded-2xl animate-pulse" />
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
    <section className="py-12 bg-gradient-to-br from-yellow-50 to-amber-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-slate-900">
                {t.home.connected.topRated.title}
              </h2>
              <p className="text-sm text-slate-600">
                {t.home.connected.topRated.subtitle}
              </p>
            </div>
          </div>

          <Link
            href="/explorer?sort=top-rated"
            className="hidden sm:flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-semibold transition-colors group"
          >
            {t.home.connected.topRated.viewAll}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Carousel */}
        <Carousel
          itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
          gap={24}
        >
          {services.map((service, index) => (
            <div key={service.id} className="relative">
              <ServiceCard service={service} />
              {/* Badge "Top" avec étoiles */}
              <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" />
                {service.rating?.toFixed(1)} ⭐
              </div>
              {/* Badge position pour top 3 */}
              {index < 3 && (
                <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-yellow-400">
                  <span className="text-xs font-bold text-yellow-600">#{index + 1}</span>
                </div>
              )}
            </div>
          ))}
        </Carousel>

        {/* Mobile "Voir tout" */}
        <Link
          href="/explorer?sort=top-rated"
          className="sm:hidden flex items-center justify-center gap-2 text-yellow-600 hover:text-yellow-700 font-semibold mt-6 transition-colors"
        >
          {t.home.connected.topRated.viewAll}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
