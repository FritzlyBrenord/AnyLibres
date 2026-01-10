// ============================================================================
// Component: ProviderAbout - Section À propos du provider
// ============================================================================

'use client';

import { ProviderProfile } from '@/types';

interface ProviderAboutProps {
  provider: ProviderProfile & {
    profile?: {
      bio?: string;
    };
  };
}

export default function ProviderAbout({ provider }: ProviderAboutProps) {
  const about = provider.profile?.bio || provider.about;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">À propos</h2>

      {about && (
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {about}
          </p>
        </div>
      )}

      {/* Compétences */}
      {provider.skills && provider.skills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Compétences
          </h3>
          <div className="flex flex-wrap gap-2">
            {provider.skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Langues */}
      {provider.languages && provider.languages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Langues parlées
          </h3>
          <div className="flex flex-wrap gap-2">
            {provider.languages.map((lang, index) => {
              const langStr = typeof lang === 'string' ? lang : (lang?.name || lang?.code || 'Unknown');
              return (
                <span
                  key={index}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium"
                >
                  {langStr.toUpperCase()}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {provider.portfolio && provider.portfolio.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Portfolio
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {provider.portfolio.map((item: any, index: number) => (
              <div
                key={index}
                className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title || `Portfolio ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}