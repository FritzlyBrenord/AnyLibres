// ============================================================================
// Component: ViewedRecentlySection - Services récemment consultés
// Style Fiverr avec carousel
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { Carousel } from '@/components/ui/Carousel';
import { ServiceCard } from '@/components/service/ServiceCard';
import type { Service } from '@/types';

export function ViewedRecentlySection() {
  const [viewedServices, setViewedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViewed = async () => {
      try {
        const response = await fetch('/api/user/history');
        if (response.ok) {
          const data = await response.json();
          setViewedServices(data.data?.viewedServices || []);
        }
      } catch (error) {
        console.error('Error fetching viewed services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchViewed();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (viewedServices.length === 0) {
    return null; // Ne pas afficher si aucun service vu
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-slate-900">
                Vu récemment
              </h2>
              <p className="text-sm text-slate-600">
                Continuez là où vous vous êtes arrêté
              </p>
            </div>
          </div>

          <Link
            href="/history"
            className="hidden sm:flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors group"
          >
            Voir tout
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Carousel */}
        <Carousel
          itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
          gap={24}
        >
          {viewedServices.map((service) => (
            <div key={service.id} className="relative">
              <ServiceCard service={service} />
              {/* Badge "Vu récemment" */}
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                Vu récemment
              </div>
            </div>
          ))}
        </Carousel>

        {/* Mobile "Voir tout" */}
        <Link
          href="/history"
          className="sm:hidden flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mt-6 transition-colors"
        >
          Voir tout
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
