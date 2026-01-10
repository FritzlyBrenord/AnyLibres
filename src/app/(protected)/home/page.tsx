// ============================================================================
// PAGE: Home Connectée - Dashboard personnalisé utilisateur
// Route protégée: /home (accessible uniquement si connecté)
// ============================================================================

import { Suspense } from "react";
import { ConnectedHomeClient } from "@/components/home/ConnectedHomeClient";

// Fetch data côté serveur
async function getHomeData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const [recommendedRes, popularRes, newProvidersRes] = await Promise.all([
      fetch(`${baseUrl}/api/services/recommended`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/services/popular`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/providers/new`, { cache: "no-store" }),
    ]);

    const recommended = recommendedRes.ok
      ? await recommendedRes.json()
      : { data: [] };
    const popular = popularRes.ok ? await popularRes.json() : { data: [] };
    const newProviders = newProvidersRes.ok
      ? await newProvidersRes.json()
      : { data: [] };

    // Randomize order pour effet dynamique
    const shuffleArray = (array: any[]) => {
      return [...array].sort(() => Math.random() - 0.5);
    };

    return {
      recommended: shuffleArray(recommended.data || []),
      popular: shuffleArray(popular.data || []),
      newProviders: shuffleArray(newProviders.data || []),
    };
  } catch (error) {
    console.error("Error fetching home data:", error);
    return { recommended: [], popular: [], newProviders: [] };
  }
}

export default async function ConnectedHomePage() {
  const { recommended, popular, newProviders } = await getHomeData();

  return (
    <ConnectedHomeClient
      recommended={recommended}
      popular={popular}
      newProviders={newProviders}
    />
  );
}
