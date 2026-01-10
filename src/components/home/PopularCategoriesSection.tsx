// ============================================================================
// Component: PopularCategoriesSection - Catégories Populaires
// Catégories les plus consultées avec aperçu des services
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Grid3x3, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/utils';
import type { Category } from '@/types';

interface CategoryWithCount extends Category {
  services_count?: number;
}

export function PopularCategoriesSection() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularCategories = async () => {
      try {
        const response = await fetch('/api/categories/popular?limit=8');

        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching popular categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Grid3x3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-slate-900">
                Catégories Populaires
              </h2>
              <p className="text-sm text-slate-600">
                Explorez les catégories les plus recherchées
              </p>
            </div>
          </div>

          <Link
            href="/explorer"
            className="hidden sm:flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors group"
          >
            Toutes les catégories
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/explorer?category=${category.slug}`}
              className={cn(
                'group relative overflow-hidden rounded-2xl p-6 transition-all duration-300',
                'bg-gradient-to-br from-slate-50 to-slate-100',
                'hover:shadow-xl hover:scale-105 border border-slate-200 hover:border-indigo-300'
              )}
            >
              {/* Icon */}
              <div className="mb-3 text-4xl group-hover:scale-110 transition-transform duration-300">
                {category.icon || '📦'}
              </div>

              {/* Name */}
              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                {category.name}
              </h3>

              {/* Count */}
              {category.services_count !== undefined && (
                <p className="text-xs text-slate-500">
                  {category.services_count} service{category.services_count > 1 ? 's' : ''}
                </p>
              )}

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* Mobile "Toutes les catégories" */}
        <Link
          href="/explorer"
          className="sm:hidden flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mt-6 transition-colors"
        >
          Toutes les catégories
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
