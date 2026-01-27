// ============================================================================
// PROVIDER: ProviderCard Premium
// Card améliorée pour afficher un prestataire avec design premium
// ============================================================================

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  MapPin,
  CheckCircle,
  Award,
  Briefcase,
  User,
} from "lucide-react";
import { ProviderProfile } from "@/types";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { useSmartTranslate } from "@/hooks/useSmartTranslate";

interface ProviderCardProps {
  provider: ProviderProfile;
}

// Composant pour traduire un skill
function SkillBadge({ skill }: { skill: string }) {
  // Force sourceLang='fr' car le contenu de la base de données est en français
  const skillTranslation = useSmartTranslate(skill, "fr");
  return (
    <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-slate-700 text-xs rounded-lg border border-blue-200 font-medium">
      {skillTranslation.translatedText}
    </span>
  );
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const { t } = useSafeLanguage();
  const [imageLoadError, setImageLoadError] = useState(false);

  const displayName =
    provider.profile?.display_name ||
    provider.company_name ||
    t?.providerCard?.provider ||
    "Prestataire";
  // Image par défaut si aucun avatar n'est défini
  const defaultAvatarImage =
    "https://via.placeholder.com/200/E2E8F0/64748B?text=Avatar";
  const avatar = provider.profile?.avatar_url || defaultAvatarImage;

  // Générer les initiales du prestataire
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const bioRaw = provider.profile?.bio || provider.about || "";

  // Traduction automatique de la bio
  // Force sourceLang='fr' car le contenu de la base de données est en français
  const bioTranslation = useSmartTranslate(bioRaw, "fr");
  const bio = bioTranslation.translatedText;
  const location =
    provider.location?.city && provider.location?.country
      ? `${provider.location.city}, ${provider.location.country}`
      : provider.location?.country || "";

  return (
    <Link href={`/provider/${provider.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 p-6 text-center group-hover:transform group-hover:scale-105">
        {/* Avatar avec effet premium */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          {imageLoadError ? (
            // Fallback : afficher un avatar par défaut avec initiales
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-2 border-slate-200 relative z-10">
              <span className="text-white font-bold text-lg">
                {getInitials(displayName)}
              </span>
            </div>
          ) : (
            <Image
              src={avatar}
              alt={displayName}
              fill
              className="rounded-full object-cover border-2 border-slate-200 relative z-10"
              onError={() => setImageLoadError(true)}
            />
          )}
          {provider.is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full p-1 z-20 shadow-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Name & Company */}
        <h3 className="font-heading font-semibold text-lg text-slate-900 mb-1">
          {displayName}
        </h3>
        {provider.company_name && displayName !== provider.company_name && (
          <div className="flex items-center justify-center gap-1 text-sm text-slate-600 mb-2">
            <Briefcase className="w-4 h-4" />
            <span>{provider.company_name}</span>
          </div>
        )}

        {/* Rating avec style premium */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-200">
            <Star className="w-4 h-4 fill-blue-500 text-blue-500" />
            <span className="font-semibold text-sm text-slate-900">
              {provider.rating.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 text-sm">
            <Award className="w-4 h-4 text-purple-500" />
            <span>{provider.completed_orders_count}</span>
          </div>
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-4 bg-slate-50 px-3 py-2 rounded-lg">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>{location}</span>
          </div>
        )}

        {/* Bio - Hauteur fixe */}
        {bio && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4 min-h-[40px] leading-relaxed">
            {bio}
          </p>
        )}

        {/* Skills avec style premium et traduction automatique */}
        {provider.skills && provider.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {provider.skills.slice(0, 3).map((skill, index) => (
              <SkillBadge key={index} skill={skill} />
            ))}
            {provider.skills.length > 3 && (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg border border-slate-200 font-medium">
                +{provider.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer invisible pour consistance */}
        {(!bio || !provider.skills || provider.skills.length === 0) && (
          <div className="min-h-[40px]"></div>
        )}
      </div>
    </Link>
  );
}
