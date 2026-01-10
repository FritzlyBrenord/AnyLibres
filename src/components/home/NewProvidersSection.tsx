// ============================================================================
// Component: NewProvidersSection - Nouveaux prestataires
// ============================================================================

'use client';

import Link from 'next/link';
import { ProviderCard } from '@/components/service/ProviderCard';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ProviderProfile } from '@/types';

interface Props {
  providers: ProviderProfile[];
}

export function NewProvidersSection({ providers }: Props) {
  if (providers.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 rounded-full text-indigo-700 text-sm font-semibold mb-4 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Nouveautés
            </div>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-2">
              Nouveaux{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Prestataires
              </span>
            </h2>
            <p className="text-slate-600 text-lg">
              Découvrez les talents qui viennent de nous rejoindre
            </p>
          </div>
          <Link href="/providers" className="hidden md:block">
            <Button
              variant="outline"
              className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              Tous les prestataires
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {providers.slice(0, 3).map((provider, index) => (
            <div
              key={provider.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <ProviderCard provider={provider} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}