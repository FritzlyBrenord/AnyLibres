// ============================================================================
// Component: BecauseYouLikedSection - Parce que vous avez aimé
// Services similaires aux services favoris ou bien notés
// ============================================================================

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight, Star } from 'lucide-react';
import { Carousel } from '@/components/ui/Carousel';
import { ServiceCard } from '@/components/service/ServiceCard';
import type { Service } from '@/types';
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

export function BecauseYouLikedSection() {
  const { t } = useSafeLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [likedService, setLikedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        // Récupérer l'historique pour trouver un service bien noté ou favori
        const historyRes = await fetch('/api/user/history');
        if (!historyRes.ok) {
          setLoading(false);
          return;
        }

        const historyData = await historyRes.json();
        const viewedServices = historyData.data?.viewedServices || [];

        if (viewedServices.length === 0) {
          setLoading(false);
          return;
        }

        // Prendre le premier service vu (le plus récent)
        const recentService = viewedServices[0];
        setLikedService(recentService);

        // Fetch des services similaires
        const response = await fetch(`/api/services/similar?serviceId=${recentService.id}&limit=20`);

        if (response.ok) {
          const data = await response.json();
          setServices(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching similar services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="container mx-auto px-4">
          <div className="h-8 w-64 bg-pink-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-pink-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0 || !likedService) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-slate-900">
                {t.home.connected.becauseYouLiked.title}
              </h2>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-pink-700">
                  {likedService.title?.toString().substring(0, 30)}...
                </span>
              </p>
            </div>
          </div>

          <Link
            href={`/services/${likedService.id}`}
            className="hidden sm:flex items-center gap-2 text-pink-600 hover:text-pink-700 font-semibold transition-colors group"
          >
            {t.home.connected.becauseYouLiked.revisit}
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
              {/* Badge "Similaire" */}
              <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3" />
                {t.home.connected.becauseYouLiked.badge}
              </div>
            </div>
          ))}
        </Carousel>

        {/* Mobile "Revoir" */}
        <Link
          href={`/services/${likedService.id}`}
          className="sm:hidden flex items-center justify-center gap-2 text-pink-600 hover:text-pink-700 font-semibold mt-6 transition-colors"
        >
          {t.home.connected.becauseYouLiked.revisit}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
