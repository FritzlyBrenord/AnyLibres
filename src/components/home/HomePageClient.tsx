'use client';

import { TranslatedHeader } from "@/components/layout/TranslatedHeader";
import { Footer } from "@/components/layout/Footer";
import type { Service, Category, ProviderProfile } from "@/types";
import { HomePageContent } from "@/components/home/HomePageContent";

interface HomePageClientProps {
  services: Service[];
  categories: Category[];
  providers: ProviderProfile[];
}

export function HomePageClient({ services, categories, providers }: HomePageClientProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <TranslatedHeader />
      <HomePageContent 
        services={services}
        categories={categories}
        providers={providers}
      />
      <Footer />
    </div>
  );
}
