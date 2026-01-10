// ============================================================================
// Component: ExploredCategoriesSection - Catégories explorées
// Services des catégories récemment consultées
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Folder, ArrowRight, TrendingUp } from 'lucide-react';
import { Carousel } from '@/components/ui/Carousel';
import { ServiceCard } from '@/components/service/ServiceCard';
import type { Service } from '@/types';

export function ExploredCategoriesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExploredCategories = async () => {
      try {
        // Récupérer les catégories explorées
        const historyRes = await fetch('/api/user/history');
        if (!historyRes.ok) {
          setLoading(false);
          return;
        }

        const historyData = await historyRes.json();
        const categories = historyData.data?.viewedCategories || [];

        if (categories.length === 0) {
          setLoading(false);
          return;
        }

        // Prendre la première catégorie (la plus récente)
        const topCategory = categories[0];
        setCategoryName(topCategory);

        // Fetch des services de cette catégorie
        const response = await fetch(`/api/services/category?category=${topCategory}&limit=20`);

        if (response.ok) {
          const data = await response.json();
          setServices(data.data?.services || []);
        }
      } catch (error) {
        console.error('Error fetching explored categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExploredCategories();
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

  if (services.length === 0 || !categoryName) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-slate-900">
                Plus de {categoryName}
              </h2>
              <p className="text-sm text-slate-600">
                Continuez à explorer cette catégorie
              </p>
            </div>
          </div>

          <Link
            href={`/explorer?category=${categoryName}`}
            className="hidden sm:flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold transition-colors group"
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
          {services.map((service) => (
            <div key={service.id} className="relative">
              <ServiceCard service={service} />
              {/* Badge "Catégorie explorée" */}
              <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Tendance
              </div>
            </div>
          ))}
        </Carousel>

        {/* Mobile "Voir tout" */}
        <Link
          href={`/explorer?category=${categoryName}`}
          className="sm:hidden flex items-center justify-center gap-2 text-amber-600 hover:text-amber-700 font-semibold mt-6 transition-colors"
        >
          Voir tout
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
