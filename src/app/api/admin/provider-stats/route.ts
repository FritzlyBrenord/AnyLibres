// ============================================================================
// API: Admin Provider Stats - Récupérer les statistiques financières d'un prestataire
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');
    const isAdmin = searchParams.get('isAdmin');

    // Vérifier les permissions admin
    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: 'ID du profil requis' },
        { status: 400 }
      );
    }

    // 1. Récupérer le user_id à partir du profile_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { success: false, error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    const userId = profileData.user_id;

    console.log('[API PROVIDER-STATS] Looking for stats for user_id:', userId);

    // 2. Récupérer les données du provider_balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('provider_balance')
      .select('*')
      .eq('provider_id', userId)
      .single();

    console.log('[API PROVIDER-STATS] Balance data:', { balanceData, balanceError });

    // 3. Récupérer le provider record pour obtenir l'ID du provider
    const { data: providerRecord, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', profileId)
      .single();

    console.log('[API PROVIDER-STATS] Provider record:', { providerRecord, providerError });

    // Utiliser l'ID du provider (pas le user_id) pour chercher les commandes
    const providerIdForOrders = providerRecord?.id || userId;

    // 3. Récupérer les statistiques des commandes
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total_cents, payment_status')
      .eq('provider_id', providerIdForOrders);

    console.log('[API PROVIDER-STATS] Orders data:', {
      count: ordersData?.length || 0,
      ordersError,
      providerIdUsed: providerIdForOrders
    });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Calculer les statistiques
    const orders = ordersData || [];
    const completedOrders = orders.filter(o => o.status === 'completed');
    const activeOrders = orders.filter(o =>
      o.status === 'pending' ||
      o.status === 'in_progress' ||
      o.status === 'revision_requested'
    );
    const disputedOrders = orders.filter(o => o.status === 'disputed');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');

    // Récupérer les revenus réels depuis provider_earnings
    const { data: earningsData, error: earningsError } = await supabase
      .from('provider_earnings')
      .select('net_amount_cents, status, order_id')
      .eq('user_id', userId);

    console.log('[API PROVIDER-STATS] Earnings data:', {
      count: earningsData?.length || 0,
      earningsError
    });

    // Calculer les revenus basés sur provider_earnings (montant net après frais)
    let completedOrdersRevenue = 0;
    let pendingOrdersRevenue = 0;
    let disputedOrdersRevenue = 0;

    // Créer un map des earnings par order_id
    const earningsMap = new Map((earningsData || []).map(e => [e.order_id, e]));

    // Pour chaque commande, utiliser earnings si disponible, sinon calculer depuis le total
    completedOrders.forEach(order => {
      const earning = earningsMap.get(order.id);
      if (earning) {
        completedOrdersRevenue += earning.net_amount_cents || 0;
      } else if (order.payment_status === 'succeeded') {
        // Estimer 95% du montant total (5% de frais plateforme)
        completedOrdersRevenue += (order.total_cents * 0.95) || 0;
      }
    });

    activeOrders.forEach(order => {
      const earning = earningsMap.get(order.id);
      if (earning) {
        pendingOrdersRevenue += earning.net_amount_cents || 0;
      } else if (order.payment_status === 'succeeded' || order.payment_status === 'pending') {
        // Estimer 95% du montant total (5% de frais plateforme)
        pendingOrdersRevenue += (order.total_cents * 0.95) || 0;
      }
    });

    disputedOrders.forEach(order => {
      const earning = earningsMap.get(order.id);
      if (earning) {
        disputedOrdersRevenue += earning.net_amount_cents || 0;
      } else {
        disputedOrdersRevenue += (order.total_cents * 0.95) || 0;
      }
    });

    completedOrdersRevenue = completedOrdersRevenue / 100;
    pendingOrdersRevenue = pendingOrdersRevenue / 100;
    disputedOrdersRevenue = disputedOrdersRevenue / 100;

    console.log('[API PROVIDER-STATS] Revenue calculation:', {
      completedOrdersRevenue,
      pendingOrdersRevenue,
      disputedOrdersRevenue,
      completedOrdersCount: completedOrders.length,
      activeOrdersCount: activeOrders.length,
      disputedOrdersCount: disputedOrders.length
    });

    // Calculer le total retiré depuis provider_withdrawals (utiliser net_amount_cents, pas amount_cents)
    const { data: withdrawalsData, error: withdrawalsError } = await supabase
      .from('provider_withdrawals')
      .select('net_amount_cents, amount_cents, fee_cents, status')
      .eq('provider_id', userId);

    console.log('[API PROVIDER-STATS] Withdrawals query result:', {
      count: withdrawalsData?.length || 0,
      withdrawalsError,
      withdrawals: withdrawalsData
    });

    // Calculer le montant NET total retiré (ce que le prestataire a réellement reçu)
    let withdrawnTotal = 0;
    if (withdrawalsData && withdrawalsData.length > 0) {
      withdrawalsData.forEach(withdrawal => {
        if (withdrawal.status === 'completed' || withdrawal.status === 'processing') {
          // Utiliser net_amount_cents qui exclut les frais de retrait
          withdrawnTotal += (withdrawal.net_amount_cents || 0);
        }
      });
      withdrawnTotal = withdrawnTotal / 100;
    } else if (balanceData) {
      // Fallback: si pas d'historique de retraits, utiliser withdrawn_cents de provider_balance
      // NOTE: Ce montant peut être brut, donc peut ne pas correspondre au montant net
      withdrawnTotal = (balanceData.withdrawn_cents || 0) / 100;
    }

    console.log('[API PROVIDER-STATS] Withdrawn total (net amount):', withdrawnTotal);

    const stats = {
      total_earned: balanceData ? (balanceData.total_earned_cents || 0) / 100 : completedOrdersRevenue,
      available_balance: balanceData ? (balanceData.available_cents || 0) / 100 : 0,
      pending_balance: balanceData ? (balanceData.pending_cents || 0) / 100 : pendingOrdersRevenue,
      withdrawn_total: withdrawnTotal,
      completed_orders: completedOrders.length,
      active_orders: activeOrders.length,
      disputed_orders: disputedOrders.length,
      cancelled_orders: cancelledOrders.length,
      total_orders: orders.length,
      completed_orders_revenue: completedOrdersRevenue,
      pending_orders_revenue: pendingOrdersRevenue,
      disputed_orders_revenue: disputedOrdersRevenue,
    };

    console.log('[API PROVIDER-STATS] Final stats:', stats);

    return NextResponse.json({
      success: true,
      data: {
        stats,
      },
    });

  } catch (error) {
    console.error('Error in provider stats API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}
