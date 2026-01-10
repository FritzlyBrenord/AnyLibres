// ============================================================================
// Component: ProviderHeader - En-tête du profil provider
// ============================================================================

'use client';

import Image from 'next/image';
import { ProviderProfile } from '@/types';
import { Star, MapPin, CheckCircle, Clock, Briefcase } from 'lucide-react';

interface ProviderHeaderProps {
  provider: ProviderProfile & {
    profile?: {
      id: string;
      display_name?: string;
      avatar_url?: string;
      bio?: string;
    };
  };
  stats: {
    total_services: number;
    total_reviews: number;
    average_rating: number;
  };
}

export default function ProviderHeader({ provider, stats }: ProviderHeaderProps) {
  const displayName = provider.profile?.display_name || provider.company_name || 'Provider';
  const avatarUrl = provider.profile?.avatar_url || '/default-avatar.png';
  const location =
    provider.location?.city && provider.location?.country
      ? `${provider.location.city}, ${provider.location.country}`
      : provider.location?.country || '';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-b">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="relative">
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
              />
            </div>
            {provider.is_verified && (
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 shadow-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Info principale */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {displayName}
                </h1>
                {provider.company_name && provider.profile?.display_name && (
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{provider.company_name}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{location}</span>
                  </div>
                )}
              </div>

              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
                Contacter
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 text-yellow-500 mb-1">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.average_rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{stats.total_reviews} avis</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {provider.completed_orders_count}
                </div>
                <p className="text-sm text-gray-600">Commandes</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.total_services}
                </div>
                <p className="text-sm text-gray-600">Services</p>
              </div>

              {provider.response_time_hours && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      ~{provider.response_time_hours}h
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Réponse</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}