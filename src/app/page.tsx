// ============================================================================
// PAGE: Home (Accueil)
// Page d'accueil principale du site - UI/UX PREMIUM AMÉLIORÉ
// ============================================================================

import { Suspense } from "react";
import type { Service, Category, ProviderProfile } from "@/types";
import { HomePageClient } from "@/components/home/HomePageClient";

// Fetch data côté serveur (LOGIQUE BACKEND INCHANGÉE)
async function getHomeData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const [servicesRes, categoriesRes, providersRes, statsRes] = await Promise.all([
      fetch(`${baseUrl}/api/services/popular`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/categories`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/providers/popular`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/stats/public`, { cache: "no-store" }), // New stats endpoint
    ]);

    const services = servicesRes.ok ? await servicesRes.json() : { data: [] };
    const categories = categoriesRes.ok
      ? await categoriesRes.json()
      : { data: [] };
    const providers = providersRes.ok
      ? await providersRes.json()
      : { data: [] };
    const stats = statsRes.ok ? await statsRes.json() : null;

    return {
      services: services.data || [],
      categories: (categories.data || []).slice(0, 6),
      providers: providers.data || [],
      stats: stats || {},
    };
  } catch (error) {
    console.error("Error fetching home data:", error);
    return { services: [], categories: [], providers: [], stats: {} };
  }
}

export default async function HomePage() {
  const { services, categories, providers, stats } = await getHomeData();

  return (
    <HomePageClient 
      services={services}
      categories={categories}
      providers={providers}
      stats={stats}
    />
  );
}
