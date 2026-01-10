'use client';

import { Suspense } from "react";
import { TranslatedHeader } from "@/components/layout/TranslatedHeader";
import { Footer } from "@/components/layout/Footer";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { SmartSearchBar } from "@/components/home/SmartSearchBar";
import { RecommendationsSection } from "@/components/home/RecommendationsSection";
import { PopularTodaySection } from "@/components/home/PopularTodaySection";
import { FavoriteProvidersSection } from "@/components/home/FavoriteProvidersSection";
import { RecentActivitySection } from "@/components/home/RecentActivitySection";
import { NewProvidersSection } from "@/components/home/NewProvidersSection";
// Nouvelles sections intelligentes
import { ViewedRecentlySection } from "@/components/home/ViewedRecentlySection";
import { BasedOnSearchesSection } from "@/components/home/BasedOnSearchesSection";
import { ExploredCategoriesSection } from "@/components/home/ExploredCategoriesSection";
import { BecauseYouLikedSection } from "@/components/home/BecauseYouLikedSection";
import { TrendingNowSection } from "@/components/home/TrendingNowSection";
import { NewArrivalsSection } from "@/components/home/NewArrivalsSection";
import { PopularCategoriesSection } from "@/components/home/PopularCategoriesSection";
import { TopRatedWeekSection } from "@/components/home/TopRatedWeekSection";
import type { Service, ProviderProfile } from "@/types";

interface ConnectedHomeClientProps {
  recommended: Service[];
  popular: Service[];
  newProviders: ProviderProfile[];
}

export function ConnectedHomeClient({ 
  recommended, 
  popular, 
  newProviders 
}: ConnectedHomeClientProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TranslatedHeader variant="solid" />

      <main className="flex-1 pt-0 sm:pt-20">
        {/* Welcome Section avec gradient */}
        <section
          className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 py-12 overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            height: "400px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Effets lumineux */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <WelcomeSection />
          </div>
        </section>

        {/* Recommandations pour vous - Personnalisé (basé sur recherches) */}
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-indigo-50 to-blue-50 animate-pulse" />}>
          <BasedOnSearchesSection />
        </Suspense>

        {/* Tendances du moment */}
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-orange-50 to-red-50 animate-pulse" />}>
          <TrendingNowSection />
        </Suspense>

        {/* Services récemment consultés - Personnalisé */}
        <Suspense fallback={<div className="h-96 bg-slate-50 animate-pulse" />}>
          <ViewedRecentlySection />
        </Suspense>

        {/* Populaire aujourd'hui */}
        <Suspense fallback={<div className="h-96 bg-white animate-pulse" />}>
          <PopularTodaySection services={popular} />
        </Suspense>

        {/* Meilleurs notés de la semaine */}
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-yellow-50 to-amber-50 animate-pulse" />}>
          <TopRatedWeekSection />
        </Suspense>

        {/* Parce que vous avez aimé - Personnalisé */}
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-pink-50 to-rose-50 animate-pulse" />}>
          <BecauseYouLikedSection />
        </Suspense>

        {/* Catégories populaires */}
        <Suspense fallback={<div className="h-96 bg-white animate-pulse" />}>
          <PopularCategoriesSection />
        </Suspense>

        {/* Catégories explorées - Personnalisé */}
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-emerald-50 to-teal-50 animate-pulse" />}>
          <ExploredCategoriesSection />
        </Suspense>

        {/* Recommandations personnalisées */}
        <Suspense fallback={<div className="h-96 bg-slate-50 animate-pulse" />}>
          <RecommendationsSection services={recommended} />
        </Suspense>

        {/* Nouveautés */}
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-purple-50 to-indigo-50 animate-pulse" />}>
          <NewArrivalsSection />
        </Suspense>

        {/* Vos prestataires préférés */}
        <Suspense fallback={<div className="h-96 bg-white animate-pulse" />}>
          <FavoriteProvidersSection />
        </Suspense>

        {/* Nouveaux prestataires */}
        <Suspense fallback={<div className="h-96 bg-slate-50 animate-pulse" />}>
          <NewProvidersSection providers={newProviders} />
        </Suspense>

        {/* Activité récente */}
        <Suspense fallback={<div className="h-64 bg-white animate-pulse" />}>
          <RecentActivitySection />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
