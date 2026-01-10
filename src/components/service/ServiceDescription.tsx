// ============================================================================
// Component: ServiceDescription - Description complète du service
// ============================================================================

"use client";

import { Service } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import { useSmartTranslate } from "@/hooks/useSmartTranslate";

interface ServiceDescriptionProps {
  service: Service;
}

function TranslatedText({ text }: { text: string }) {
  const { translatedText } = useSmartTranslate(text, "fr");
  return <>{translatedText}</>;
}

export default function ServiceDescription({
  service,
}: ServiceDescriptionProps) {
  const { getText, t } = useLanguage();

  return (
    <div className="bg-white rounded-lg shadow p-0 sm:p-6 space-y-6">
      {/* Titre du service */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getText(service.title)}
        </h1>
        {service.short_description && (
          <p className="text-lg text-gray-600">
            {getText(service.short_description)}
          </p>
        )}
      </div>

      {/* Description détaillée */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Description
        </h2>
        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
          {getText(service.description)}
        </div>
      </div>

      {/* Tags */}
      {service.tags && service.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {service.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                <TranslatedText text={tag} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
