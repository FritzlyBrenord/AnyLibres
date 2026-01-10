// ============================================================================
// Component: SimilarServices - Services similaires
// ============================================================================

'use client';

import { Service } from '@/types';
import { ServiceCard } from './ServiceCard';
import { useLanguage } from '@/hooks/useLanguage';

interface SimilarServicesProps {
  services: Service[];
}

export default function SimilarServices({ services }: SimilarServicesProps) {
  const { t, language } = useLanguage();

  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {t.similar.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              locale={language}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
