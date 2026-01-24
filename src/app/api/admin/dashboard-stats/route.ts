// ============================================================================
// API: Admin Dashboard Stats - Statistiques globales pour le dashboard
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin');

    // Vérifier les permissions admin
    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    console.log('[API DASHBOARD-STATS] Fetching dashboard statistics...');

    // 1. Statistiques des utilisateurs
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [clientsResult, providersResult, newClientsResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
      supabase.from('providers').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .eq('role', 'client')
        .gte('created_at', last24Hours.toISOString())
    ]);

    const totalClients = clientsResult.count || 0;
    const totalProviders = providersResult.count || 0;
    const totalUsers = totalClients + totalProviders;

    // Considérer les utilisateurs actifs comme ceux créés dans les 7 derniers jours
    // ou on peut utiliser le total des clients si last_login n'est pas disponible
    const { count: activeClientsCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .gte('created_at', last7Days.toISOString());

    const activeUsers = activeClientsCount || totalClients;
    const newUsers = newClientsResult.count || 0;

    console.log('[API DASHBOARD-STATS] User stats:', {
      totalClients,
      totalProviders,
      totalUsers,
      activeUsers,
      newUsers,
      last24Hours: last24Hours.toISOString(),
      last7Days: last7Days.toISOString()
    });

    // 2. Statistiques des commandes
    const { data: allOrders } = await supabase
      .from('orders')
      .select('id, total_cents, fees_cents, status, payment_status, created_at');

    const totalOrders = allOrders?.length || 0;
    const pendingOrders = allOrders?.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length || 0;
    const completedOrders = allOrders?.filter(o => o.status === 'completed').length || 0;

    // 3. Statistiques de revenus
    const paidOrders = allOrders?.filter(o => o.payment_status === 'succeeded') || [];
    const totalRevenue = paidOrders.reduce((sum, order) =>
      sum + ((order.total_cents + (order.fees_cents || 0)) / 100), 0
    );

    // 4. Calculer l'historique des revenus (7 derniers jours)
    const revenueHistory: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayRevenue = paidOrders
        .filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= dayStart && orderDate <= dayEnd;
        })
        .reduce((sum, order) => sum + ((order.total_cents + (order.fees_cents || 0)) / 100), 0);

      revenueHistory.push(Math.round(dayRevenue));
    }

    console.log('[API DASHBOARD-STATS] Revenue history:', revenueHistory);
    console.log('[API DASHBOARD-STATS] Total revenue:', totalRevenue);

    // 5. Taux de performance (commandes complétées / total)
    const performanceScore = totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

    // 6. Calculer les variations (comparaison avec la semaine dernière)
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);
    lastWeekStart.setHours(0, 0, 0, 0);

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekOrders = paidOrders.filter(o => {
      const date = new Date(o.created_at);
      return date >= lastWeekStart && date < thisWeekStart;
    });

    const thisWeekOrders = paidOrders.filter(o => {
      const date = new Date(o.created_at);
      return date >= thisWeekStart;
    });

    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) =>
      sum + ((o.total_cents + (o.fees_cents || 0)) / 100), 0
    );
    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) =>
      sum + ((o.total_cents + (o.fees_cents || 0)) / 100), 0
    );

    const revenueChange = lastWeekRevenue > 0
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1)
      : '0';

    const usersChange = '+12.3'; // TODO: Calculer la vraie variation
    const ordersChange = lastWeekOrders.length > 0
      ? ((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length * 100).toFixed(1)
      : '0';

    const stats = {
      revenue: {
        total: Math.round(totalRevenue),
        change: parseFloat(revenueChange),
        trend: parseFloat(revenueChange) >= 0 ? 'up' : 'down',
        history: revenueHistory,
      },
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
        trend: 'up',
        change: parseFloat(usersChange),
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        revenue: Math.round(totalRevenue),
        change: parseFloat(ordersChange),
      },
      performance: {
        score: performanceScore,
        level: performanceScore >= 90 ? 'Excellent' : performanceScore >= 70 ? 'Bon' : 'Moyen',
        metrics: {
          responseTime: 2.4,
          satisfaction: 4.8,
          growth: parseFloat(revenueChange),
        },
      },
    };

    console.log('[API DASHBOARD-STATS] Stats calculated successfully');

    return NextResponse.json({
      success: true,
      data: { stats },
    });

  } catch (error) {
    console.error('[API DASHBOARD-STATS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}
