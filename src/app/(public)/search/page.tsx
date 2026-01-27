// ============================================================================
// PAGE: Search - Recherche Ultra-Puissante avec Filtres Intelligents
// Fonctionnalités avancées:
// - Recherche en temps réel avec suggestions
// - Analyse par lettre/chiffre
// - Filtres multicritères (titre, description, prix, provider)
// - Résultats hiérarchisés (exact, similaire, autres)
// ============================================================================

import { SearchPageClient } from "@/components/search/SearchPageClient";

// Fetch résultats avec les nouveaux paramètres
async function getSearchResults(params: {
  q?: string;
  page?: string;
  letter?: string;
  startsWith?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const limit = 20;

  console.log("🔍 Search params:", params);

  // Construire les paramètres de recherche
  const searchQuery = new URLSearchParams();
  if (query) searchQuery.set("q", query);
  if (params.letter) searchQuery.set("letter", params.letter);
  if (params.startsWith) searchQuery.set("startsWith", params.startsWith);
  if (params.minPrice) searchQuery.set("minPrice", params.minPrice);
  if (params.maxPrice) searchQuery.set("maxPrice", params.maxPrice);
  if (params.sort) searchQuery.set("sort", params.sort);
  searchQuery.set("page", page.toString());
  searchQuery.set("limit", limit.toString());

  try {
    const apiUrl = `${baseUrl}/api/services/search?${searchQuery.toString()}`;
    console.log("📡 Calling API:", apiUrl);

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("❌ API response not OK:", response.status);
      return {
        services: [],
        total: 0,
        query,
        currentPage: page,
        totalPages: 0,
        resultCategories: null,
      };
    }

    const data = await response.json();
    console.log("📦 API Data received:", data);

    if (!data.success) {
      console.error("❌ API returned error:", data.error);
      return {
        services: [],
        total: 0,
        query,
        currentPage: page,
        totalPages: 0,
        resultCategories: null,
      };
    }

    return {
      services: data.data || [],
      total: data.total || 0,
      query,
      currentPage: data.currentPage || page,
      totalPages: data.totalPages || 0,
      resultCategories: data.resultCategories || null,
      filters: data.filters || {},
    };
  } catch (error) {
    console.error("💥 Error fetching search results:", error);
    return {
      services: [],
      total: 0,
      query,
      currentPage: page,
      totalPages: 0,
      resultCategories: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    letter?: string;
    startsWith?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;

  const results = await getSearchResults(params);

  return <SearchPageClient results={results} params={params} />;
}
