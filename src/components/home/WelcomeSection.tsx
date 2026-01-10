// ============================================================================
// Component: WelcomeSection - Section de bienvenue personnalisée
// ============================================================================

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";

export function WelcomeSection() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const getDisplayName = () => {
    if (user?.first_name) {
      return user.first_name;
    }
    if (user?.display_name) {
      return user.display_name.split(" ")[0];
    }
    return "cher utilisateur";
  };

  return (
    <div className="relative w-full animate-fade-in overflow-hidden">
      {/* Overlay de premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-purple-900/10 to-blue-900/20"></div>

      {/* Contenu */}
      <div className="relative z-10 px-4 py-8 w-full max-w-6xl mx-auto text-center">
        {/* Badge premium */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white text-sm font-semibold mb-6 shadow-lg">
          <Sparkles className="w-4 h-4" />
          Tableau de bord personnalisé
        </div>

        {/* Greeting */}
        <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-4 animate-slide-up">
          {getGreeting()}, {getDisplayName()} 👋
        </h1>

        <p
          className="text-xl md:text-2xl text-slate-100 max-w-3xl mx-auto animate-slide-up leading-relaxed"
          style={{ animationDelay: "0.1s" }}
        >
          Découvrez des{" "}
          <span className="font-semibold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
            recommandations personnalisées
          </span>{" "}
          pour faire décoller vos projets freelance
        </p>
      </div>

      {/* Effet de brillance subtile */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    </div>
  );
}
