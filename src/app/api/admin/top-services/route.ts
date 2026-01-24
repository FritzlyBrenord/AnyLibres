// ============================================================================
// API: Admin Top Services - Services les plus performants
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Vérifier les permissions admin
    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    console.log('[API TOP-SERVICES] Fetching top services...');

    // 1. Récupérer tous les services avec leurs statistiques (incluant les inactifs pour avoir plus de données)
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        id,
        title,
        status,
        created_at,
        provider_id,
        base_price_cents
      `)
      .order('created_at', { ascending: false });

    if (servicesError) {
      console.error('[API TOP-SERVICES] Error fetching services:', servicesError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des services' },
        { status: 500 }
      );
    }

    console.log(`[API TOP-SERVICES] Found ${services?.length || 0} total services`);

    // 2. Récupérer toutes les commandes pour calculer les revenus par service
    const { data: allOrders } = await supabase
      .from('orders')
      .select(`
        id,
        service_id,
        total_cents,
        fees_cents,
        status,
        payment_status,
        created_at
      `);

    // 3. Récupérer les avis pour calculer les notes moyennes
    const { data: allReviews } = await supabase
      .from('service_reviews')
      .select('service_id, rating');

    // 4. Calculer les statistiques par service
    // Utiliser string comme clé car les IDs sont des UUIDs
    const serviceStats = new Map<string, {
      revenue: number;
      orders: number;
      rating: number;
      reviewCount: number;
    }>();

    // Initialiser les stats
    services?.forEach(service => {
      serviceStats.set(String(service.id), {
        revenue: 0,
        orders: 0,
        rating: 0,
        reviewCount: 0
      });
    });

    console.log('[API TOP-SERVICES] Initialized stats for', serviceStats.size, 'services');
    console.log('[API TOP-SERVICES] Processing', allOrders?.length || 0, 'orders');

    // Calculer les revenus et nombre de commandes
    allOrders?.forEach(order => {
      if (order.service_id && order.payment_status === 'succeeded') {
        const stats = serviceStats.get(String(order.service_id));
        if (stats) {
          stats.revenue += (order.total_cents + (order.fees_cents || 0)) / 100;
          stats.orders += 1;
        }
      }
    });

    console.log('[API TOP-SERVICES] Processing', allReviews?.length || 0, 'reviews');

    // Calculer les notes moyennes
    allReviews?.forEach(review => {
      if (review.service_id) {
        const stats = serviceStats.get(String(review.service_id));
        if (stats) {
          stats.reviewCount += 1;
          stats.rating += review.rating;
        }
      }
    });

    // Finaliser le calcul des notes moyennes
    serviceStats.forEach(stats => {
      if (stats.reviewCount > 0) {
        stats.rating = parseFloat((stats.rating / stats.reviewCount).toFixed(1));
      } else {
        stats.rating = 0;
      }
    });

    // 5. Créer la liste des services avec leurs stats
    const servicesWithStats = services?.map(service => {
      const stats = serviceStats.get(String(service.id)) || {
        revenue: 0,
        orders: 0,
        rating: 0,
        reviewCount: 0
      };

      // Déterminer le statut à afficher (active = published, inactive = draft/archived)
      const displayStatus = service.status === 'published' ? 'active' : 'inactive';

      // Extraire le titre (peut être un objet {fr, en} ou une chaîne directe)
      let serviceName = 'Service sans titre';
      if (service.title) {
        if (typeof service.title === 'object' && service.title !== null) {
          serviceName = service.title.fr || service.title.en || 'Service sans titre';
        } else if (typeof service.title === 'string') {
          serviceName = service.title;
        }
      }

      return {
        id: service.id,
        name: serviceName,
        revenue: Math.round(stats.revenue),
        orders: stats.orders,
        rating: stats.rating || 4.5, // Valeur par défaut si pas de reviews
        status: displayStatus,
        originalStatus: service.status,
        provider_id: service.provider_id,
        base_price: service.base_price_cents / 100,
        review_count: stats.reviewCount
      };
    }) || [];

    // 6. Trier par revenus et limiter aux top services
    // On prend tous les services (pas seulement published) pour montrer les top performers
    const topServices = servicesWithStats
      .sort((a, b) => {
        // Prioriser d'abord par revenus, puis par nombre de commandes
        if (b.revenue !== a.revenue) {
          return b.revenue - a.revenue;
        }
        return b.orders - a.orders;
      })
      .slice(0, limit);

    console.log(`[API TOP-SERVICES] Returning ${topServices.length} top services out of ${servicesWithStats.length} total`);

    return NextResponse.json({
      success: true,
      data: { services: topServices },
    });

  } catch (error) {
    console.error('[API TOP-SERVICES] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}
