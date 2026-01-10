// ============================================================================
// API: Admin Finance Stats - Statistiques financières globales du système
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

    console.log('[API FINANCE-STATS] Fetching global finance stats...');

    // 1. Récupérer TOUTES les commandes
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_cents, fees_cents, status, payment_status, created_at, provider_id');

    if (ordersError) {
      console.error('[API FINANCE-STATS] Error fetching orders:', ordersError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des commandes' },
        { status: 500 }
      );
    }

    console.log(`[API FINANCE-STATS] Found ${allOrders?.length || 0} orders`);

    // 2. Récupérer les earnings pour connaître les montants réels et les frais
    const { data: allEarnings, error: earningsError } = await supabase
      .from('provider_earnings')
      .select('*');

    console.log('[API FINANCE-STATS] Earnings found:', allEarnings?.length || 0);

    // 2. Calculer les revenus en fonction du statut des earnings
    let total_revenue_gross = 0; // Montant total brut de toutes les commandes
    let total_revenue_net_confirmed = 0; // Revenus plateforme CONFIRMÉS (commandes acceptées)
    let total_revenue_net_pending = 0; // Revenus plateforme EN ATTENTE (commandes non acceptées)
    let total_provider_earnings_confirmed = 0; // Montant pour prestataires CONFIRMÉ
    let total_provider_earnings_pending = 0; // Montant pour prestataires EN ATTENTE
    let total_refunds = 0; // Total des remboursements

    let completed_orders_count = 0;
    let pending_orders_count = 0;
    let cancelled_orders_count = 0;

    const ordersByStatus = {
      pending: 0,
      in_progress: 0,
      in_review: 0,
      completed: 0,
      cancelled: 0,
    };

    // Créer un map des earnings par order_id
    const earningsMap = new Map((allEarnings || []).map(e => [e.order_id, e]));

    // Traiter chaque commande
    (allOrders || []).forEach(order => {
      // Compter par statut
      if (order.status in ordersByStatus) {
        ordersByStatus[order.status as keyof typeof ordersByStatus]++;
      }

      if (order.status === 'completed') {
        completed_orders_count++;
      } else if (order.status === 'cancelled') {
        cancelled_orders_count++;
      } else {
        pending_orders_count++;
      }

      // Calculer les revenus uniquement pour les commandes payées
      if (order.payment_status === 'succeeded') {
        const serviceCost = order.total_cents / 100; // Prix du service uniquement
        const systemFees = (order.fees_cents || 0) / 100; // Frais système

        // Déterminer qui paie les frais depuis metadata
        const metadata = order.metadata as any;
        const paidBy = metadata?.pricing?.fee_config?.paid_by || 'client';

        // Calculer le montant total que le client a payé
        let clientPaid = serviceCost;
        if (paidBy === 'client') {
          clientPaid = serviceCost + systemFees;  // Client paie 100% des frais
        } else if (paidBy === 'split') {
          clientPaid = serviceCost + (systemFees / 2);  // Client paie 50% des frais
        }
        // Si provider, client paie juste le service

        // Calculer ce que le prestataire reçoit
        let providerReceives = serviceCost;
        if (paidBy === 'provider') {
          providerReceives = serviceCost - systemFees;  // Prestataire paie 100% des frais
        } else if (paidBy === 'split') {
          providerReceives = serviceCost - (systemFees / 2);  // Prestataire paie 50% des frais
        }
        // Si client, prestataire reçoit tout le service cost

        total_revenue_gross += clientPaid;

        const earning = earningsMap.get(order.id);

        // Si l'earning existe et est complété (client a accepté)
        if (earning && earning.status === 'completed') {
          // Utiliser les montants réels de provider_earnings
          const providerNet = (earning.net_amount_cents || 0) / 100;
          const platformFee = (earning.platform_fee_cents || 0) / 100;

          // Si platform_fee_cents est 0, calculer 5% du service cost
          const actualPlatformFee = platformFee > 0 ? platformFee : serviceCost * 0.05;

          total_provider_earnings_confirmed += providerNet;
          // Commission (5% du service) + Frais système (100% des fees_cents)
          total_revenue_net_confirmed += actualPlatformFee + systemFees;
        }
        // Si l'earning existe mais n'est pas complété (en attente d'acceptation)
        else if (earning && (earning.status === 'pending' || earning.status === 'processing')) {
          const providerNet = (earning.net_amount_cents || 0) / 100;
          const platformFee = (earning.platform_fee_cents || 0) / 100;

          const actualPlatformFee = platformFee > 0 ? platformFee : serviceCost * 0.05;

          total_provider_earnings_pending += providerNet;
          // Commission (5% du service) + Frais système (100% des fees_cents)
          total_revenue_net_pending += actualPlatformFee + systemFees;
        }
        // Pas d'earning, estimer avec 95/5 + frais système
        else if (!earning) {
          const providerShare = serviceCost * 0.95;
          const platformShare = serviceCost * 0.05;

          // Selon le statut de la commande
          if (order.status === 'completed') {
            total_provider_earnings_confirmed += providerReceives * 0.95; // 95% de ce que le prestataire reçoit
            // Commission (5% du service) + Frais système (100% des fees_cents)
            total_revenue_net_confirmed += platformShare + systemFees;
          } else {
            total_provider_earnings_pending += providerReceives * 0.95; // 95% de ce que le prestataire reçoit
            // Commission (5% du service) + Frais système (100% des fees_cents)
            total_revenue_net_pending += platformShare + systemFees;
          }
        }
      }

      // Gérer les remboursements (commandes annulées qui étaient payées)
      if (order.status === 'cancelled' && order.payment_status === 'refunded') {
        // Le montant total remboursé = total_cents + fees_cents
        total_refunds += ((order.total_cents || 0) + (order.fees_cents || 0)) / 100;
      }
    });

    const total_revenue_net = total_revenue_net_confirmed; // Seulement les revenus confirmés
    const total_provider_earnings = total_provider_earnings_confirmed; // Seulement les montants confirmés

    // 3. Récupérer le total des retraits effectués par les prestataires
    const { data: allWithdrawals, error: withdrawalsError } = await supabase
      .from('provider_withdrawals')
      .select('net_amount_cents, fee_cents, amount_cents, status');

    let total_withdrawals = 0;
    let total_withdrawal_fees = 0; // Frais de retrait (2.5%) qui vont au système
    if (allWithdrawals && !withdrawalsError) {
      allWithdrawals.forEach(withdrawal => {
        if (withdrawal.status === 'completed' || withdrawal.status === 'processing') {
          total_withdrawals += (withdrawal.net_amount_cents || 0) / 100;
          total_withdrawal_fees += (withdrawal.fee_cents || 0) / 100;
        }
      });
    }

    console.log('[API FINANCE-STATS] Withdrawals found:', allWithdrawals?.length || 0);
    console.log('[API FINANCE-STATS] Total withdrawal fees collected:', total_withdrawal_fees);

    // 4. Calculer le solde restant dû aux prestataires
    const pending_provider_balance = total_provider_earnings - total_withdrawals;

    // 5. Récupérer les soldes réels depuis provider_balance
    const { data: providerBalances, error: balancesError } = await supabase
      .from('provider_balance')
      .select('available_cents, pending_cents, withdrawn_cents, total_earned_cents');

    let total_available_balance = 0;
    let total_pending_balance = 0;
    let total_earned_balance = 0;

    if (providerBalances && !balancesError) {
      providerBalances.forEach(balance => {
        total_available_balance += (balance.available_cents || 0) / 100;
        total_pending_balance += (balance.pending_cents || 0) / 100;
        total_earned_balance += (balance.total_earned_cents || 0) / 100;
      });
    }

    // NOTE: On utilise total_withdrawals calculé depuis provider_withdrawals.net_amount_cents
    // au lieu de withdrawn_cents de provider_balance, car ce dernier contient le montant brut
    const total_withdrawn_balance = total_withdrawals;

    console.log('[API FINANCE-STATS] Provider balances aggregated');

    // 6. Calculer les statistiques par mois (12 derniers mois)
    const monthlyStats: {
      month: string;
      revenue: number;
      platform_share: number;
      provider_share: number;
      orders_count: number;
    }[] = [];

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthDate.toISOString().slice(0, 7); // YYYY-MM
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      let monthRevenue = 0;
      let monthPlatformShare = 0;
      let monthProviderShare = 0;
      let monthOrdersCount = 0;

      (allOrders || []).forEach(order => {
        const orderMonth = order.created_at.slice(0, 7);
        if (orderMonth === monthKey && order.payment_status === 'succeeded') {
          // Le montant total que le client a payé = total_cents + fees_cents
          const orderTotal = (order.total_cents + (order.fees_cents || 0)) / 100;
          monthRevenue += orderTotal;
          monthPlatformShare += orderTotal * 0.05;
          monthProviderShare += orderTotal * 0.95;
          monthOrdersCount++;
        }
      });

      monthlyStats.push({
        month: monthName,
        revenue: parseFloat(monthRevenue.toFixed(2)),
        platform_share: parseFloat(monthPlatformShare.toFixed(2)),
        provider_share: parseFloat(monthProviderShare.toFixed(2)),
        orders_count: monthOrdersCount,
      });
    }

    // 7. Construire la réponse
    // Les revenus du système = 5% des commandes CONFIRMÉES + frais de retrait (2.5%)
    const total_system_revenue = total_revenue_net + total_withdrawal_fees;
    const total_system_revenue_pending = total_revenue_net_pending; // Revenus en attente

    const stats = {
      // Revenus totaux
      total_revenue_gross: parseFloat(total_revenue_gross.toFixed(2)),
      total_revenue_net: parseFloat(total_revenue_net.toFixed(2)), // 5% des commandes CONFIRMÉES
      total_revenue_net_pending: parseFloat(total_revenue_net_pending.toFixed(2)), // 5% EN ATTENTE
      total_withdrawal_fees: parseFloat(total_withdrawal_fees.toFixed(2)), // 2.5% des retraits
      total_system_revenue: parseFloat(total_system_revenue.toFixed(2)), // Total système CONFIRMÉ
      total_system_revenue_pending: parseFloat(total_system_revenue_pending.toFixed(2)), // Total EN ATTENTE
      total_provider_earnings: parseFloat(total_provider_earnings.toFixed(2)), // Montants CONFIRMÉS
      total_provider_earnings_pending: parseFloat(total_provider_earnings_pending.toFixed(2)), // Montants EN ATTENTE
      total_refunds: parseFloat(total_refunds.toFixed(2)), // Total remboursements

      // Retraits et soldes
      total_withdrawals: parseFloat(total_withdrawals.toFixed(2)),
      pending_provider_balance: parseFloat(pending_provider_balance.toFixed(2)),

      // Soldes détaillés des prestataires
      provider_balances: {
        available: parseFloat(total_available_balance.toFixed(2)),
        pending: parseFloat(total_pending_balance.toFixed(2)),
        withdrawn: parseFloat(total_withdrawn_balance.toFixed(2)),
        total_earned: parseFloat(total_earned_balance.toFixed(2)),
      },

      // Statistiques des commandes
      orders: {
        total: allOrders?.length || 0,
        completed: completed_orders_count,
        pending: pending_orders_count,
        cancelled: cancelled_orders_count,
        by_status: ordersByStatus,
      },

      // Statistiques mensuelles
      monthly_stats: monthlyStats,
    };

    console.log('[API FINANCE-STATS] Final stats calculated:', stats);

    return NextResponse.json({
      success: true,
      data: { stats },
    });

  } catch (error) {
    console.error('Error in finance stats API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}
