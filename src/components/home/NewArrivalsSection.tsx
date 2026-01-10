// ============================================================================
// Component: NewArrivalsSection - Nouveautés
// Services récemment ajoutés sur la plateforme
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { Carousel } from '@/components/ui/Carousel';
import { ServiceCard } from '@/components/service/ServiceCard';
import type { Service } from '@/types';

export function NewArrivalsSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        // Récupérer les services récemment créés
        const response = await fetch('/api/services/new-arrivals?limit=20');

        if (response.ok) {
          const data = await response.json();
          setServices(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
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
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-slate-900">
                Nouveautés
              </h2>
              <p className="text-sm text-slate-600">
                Les derniers services ajoutés sur Anylibre
              </p>
            </div>
          </div>

          <Link
            href="/explorer?sort=newest"
            className="hidden sm:flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition-colors group"
          >
            Découvrir plus
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
              {/* Badge "Nouveau" */}
              <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Nouveau
              </div>
            </div>
          ))}
        </Carousel>

        {/* Mobile "Découvrir plus" */}
        <Link
          href="/explorer?sort=newest"
          className="sm:hidden flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mt-6 transition-colors"
        >
          Découvrir plus
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
