"use client";

import { useLanguageContext } from "@/contexts/LanguageContext";
import { useLiveStats } from "@/hooks/useLiveStats";

export function LiveStats() {
  const { t } = useLanguageContext();
  const { stats, loading } = useLiveStats();

  // Valeurs par défaut si chargement ou erreur (pour éviter un vide)
  const displayStats = stats || {
    providers: "5K+",
    projects: "10K+",
    satisfaction: "98%",
    successRate: "98%",
    rating: "4.9/5",
    users: "15K+",
    clients: "2.5K+"
  };

  return (
    <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
      <div>
        <div className="text-3xl lg:text-4xl font-bold text-amber-400 mb-2">
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            displayStats.providers
          )}
        </div>
        <div className="text-slate-300 text-sm">
          {t?.about?.hero?.stats?.freelances || 'Freelances'}
        </div>
      </div>
      <div className="border-x border-white/20">
        <div className="text-3xl lg:text-4xl font-bold text-amber-400 mb-2">
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            displayStats.projects
          )}
        </div>
        <div className="text-slate-300 text-sm">
          {t?.about?.hero?.stats?.projects || 'Projets réalisés'}
        </div>
      </div>
      <div>
        <div className="text-3xl lg:text-4xl font-bold text-amber-400 mb-2">
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            displayStats.satisfaction
          )}
        </div>
        <div className="text-slate-300 text-sm">
          {t?.about?.story?.satisfaction || 'Satisfaction'}
        </div>
      </div>
    </div>
  );
}
