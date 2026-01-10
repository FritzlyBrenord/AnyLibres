// ============================================================================
// Component: ProviderServices - Liste des services du provider
// ============================================================================

'use client';

import { Service } from '@/types';
import { ServiceCard } from '@/components/service/ServiceCard';
import { useLanguage } from '@/hooks/useLanguage';

interface ProviderServicesProps {
  services: Service[];
}

export default function ProviderServices({ services }: ProviderServicesProps) {
  const { language } = useLanguage();

  if (!services || services.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">Aucun service publié pour le moment</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Services ({services.length})
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
  );
}