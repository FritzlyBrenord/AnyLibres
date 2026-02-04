// ============================================================================
// Component: RecommendationsSection - Recommandations personnalisées
// ============================================================================

'use client';

import Link from 'next/link';
import { ServiceCard } from '@/components/service/ServiceCard';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Service } from '@/types';
import { useSafeLanguage } from '@/hooks/useSafeLanguage';

interface Props {
  services: Service[];
}

export function RecommendationsSection({ services }: Props) {
  const { t } = useSafeLanguage();

  if (services.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 rounded-full text-purple-700 text-sm font-semibold mb-4 shadow-sm">
              <Sparkles className="w-4 h-4" />
              {t.home.connected.recommendations.badge}
            </div>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-2">
              {t.home.connected.recommendations.title}{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t.home.connected.recommendations.titleHighlight}
              </span>
            </h2>
            <p className="text-slate-600 text-lg">
              {t.home.connected.recommendations.subtitle}
            </p>
          </div>
          <Link href="/search" className="hidden md:block">
            <Button
              variant="outline"
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              {t.home.connected.viewAll}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.slice(0, 8).map((service, index) => (
            <div
              key={service.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ServiceCard service={service} />
            </div>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link href="/search">
            <Button
              variant="outline"
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              {t.home.connected.recommendations.viewAllServices}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}