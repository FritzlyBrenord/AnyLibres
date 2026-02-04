"use client";

import { TranslatedHeader } from "@/components/layout/TranslatedHeader";
import { Footer } from "@/components/layout/Footer";
import type { Service, Category, ProviderProfile } from "@/types";
import { useEffect } from "react";
import { HomePageContent } from "@/components/home/HomePageContent";

interface HomePageClientProps {
  services: Service[];
  categories: Category[];
  providers: ProviderProfile[];
  stats?: any;
}

export function HomePageClient({
  services,
  categories,
  providers,
  stats,
}: HomePageClientProps) {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch("/api/tracking/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: window.location.pathname,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        console.error("Tracking Error:", error);
      }
    };

    trackVisit();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TranslatedHeader />
      <HomePageContent
        services={services}
        categories={categories}
        providers={providers}
        stats={stats}
      />
      <Footer />
    </div>
  );
}
