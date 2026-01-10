// ============================================================================
// Component: PopularTodaySection - Services populaires aujourd'hui
// ============================================================================

'use client';

import Link from 'next/link';
import { ServiceCard } from '@/components/service/ServiceCard';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Service } from '@/types';

interface Props {
  services: Service[];
}

export function PopularTodaySection({ services }: Props) {
  if (services.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 rounded-full text-amber-700 text-sm font-semibold mb-4 shadow-sm">
              <TrendingUp className="w-4 h-4" />
              Tendances du jour
            </div>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-2">
              Populaire{' '}
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                Aujourd&apos;hui
              </span>
            </h2>
            <p className="text-slate-600 text-lg">
              Les services les plus demandés en ce moment
            </p>
          </div>
          <Link href="/explorer" className="hidden md:block">
            <Button
              variant="outline"
              className="border-2 border-amber-600 text-amber-600 hover:bg-amber-50"
            >
              Explorer
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.slice(0, 4).map((service, index) => (
            <div
              key={service.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}