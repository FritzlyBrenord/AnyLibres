// ============================================================================
// API: GET /api/user/history
// Récupère l'historique intelligent de l'utilisateur
// - Services visités récemment
// - Recherches effectuées
// - Catégories explorées
// - Providers consultés
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        data: {
          viewedServices: [],
          searchHistory: [],
          viewedCategories: [],
          viewedProviders: [],
        }
      }, { status: 401 });
    }

    // Récupérer les données depuis userTracker (localStorage côté client)
    // Pour l'instant, retourner des données basées sur la DB

    // 1. Services récemment consultés (depuis user_service_views)
    const { data: viewedServices } = await supabase
      .from('user_service_views')
      .select(`
        service_id,
        viewed_at,
        service:services(
          id,
          title,
          description,
          base_price_cents,
          currency,
          images,
          categories,
          tags,
          provider:providers!inner(
            id,
            company_name,
            rating,
            profile:profiles!inner(
              id,
              display_name,
              avatar_url
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(20);

    // 2. Catégories récemment explorées
    const { data: categoriesData } = await supabase
      .from('user_service_views')
      .select(`
        service:services(categories)
      `)
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(50);

    // Extraire les catégories uniques
    const categoriesSet = new Set<string>();
    categoriesData?.forEach((item: any) => {
      const cats = item.service?.categories || [];
      cats.forEach((cat: string) => categoriesSet.add(cat));
    });
    const viewedCategories = Array.from(categoriesSet);

    // 3. Providers récemment consultés
    const { data: providersData } = await supabase
      .from('user_service_views')
      .select(`
        service:services(
          provider:providers(id, company_name)
        )
      `)
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(30);

    const providersSet = new Set<string>();
    providersData?.forEach((item: any) => {
      const providerId = item.service?.provider?.id;
      if (providerId) providersSet.add(providerId);
    });
    const viewedProviders = Array.from(providersSet);

    // Formater les services vus
    const formattedViewedServices = (viewedServices || [])
      .filter((v: any) => v.service)
      .map((v: any) => v.service);

    return NextResponse.json({
      success: true,
      data: {
        viewedServices: formattedViewedServices,
        viewedCategories,
        viewedProviders,
        searchHistory: [], // Sera rempli par le client depuis localStorage
      }
    });

  } catch (error) {
    console.error('💥 Error fetching user history:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        viewedServices: [],
        searchHistory: [],
        viewedCategories: [],
        viewedProviders: [],
      }
    }, { status: 500 });
  }
}
