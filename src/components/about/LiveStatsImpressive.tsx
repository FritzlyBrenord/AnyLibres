"use client";

import { useLanguageContext } from "@/contexts/LanguageContext";
import { useLiveStats } from "@/hooks/useLiveStats";
import { Users, Building2, CheckCircle, Star } from "lucide-react";

export function LiveStatsImpressive() {
  const { t } = useLanguageContext();
  const { stats, loading } = useLiveStats();

  // Valeurs par défaut
  const displayStats = stats || {
    providers: "5K+",
    projects: "10K+",
    satisfaction: "98%",
    successRate: "98%",
    rating: "4.9/5",
    users: "15K+",
    clients: "2.5K+"
  };

  const statItems = [
    { 
      icon: Users, 
      number: loading ? "..." : displayStats.users, 
      index: 0 
    },
    { 
      icon: Building2, 
      number: loading ? "..." : displayStats.clients, 
      index: 1 
    },
    { 
      icon: CheckCircle, 
      number: loading ? "..." : displayStats.projects, 
      index: 2 
    },
    { 
      icon: Star, 
      number: loading ? "..." : displayStats.rating, 
      index: 3 
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {statItems.map((stat, idx) => (
        <div key={idx} className="text-center group">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-all">
            <stat.icon className="w-8 h-8 text-amber-400" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {stat.number}
          </div>
          <div className="text-slate-300">
            {t?.about?.stats?.items?.[stat.index]?.label || ''}
          </div>
        </div>
      ))}
    </div>
  );
}
