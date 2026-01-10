import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id est requis' },
        { status: 400 }
      );
    }

    console.log('[API CLIENT-STATS] Fetching stats for user_id:', userId);

    // Récupérer toutes les commandes du client
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', userId);

    if (ordersError) {
      console.error('[API CLIENT-STATS] Error fetching orders:', ordersError);
      return NextResponse.json(
        { success: false, error: ordersError.message },
        { status: 500 }
      );
    }

    console.log(`[API CLIENT-STATS] Found ${orders?.length || 0} orders`);

    // Calculer les statistiques
    const stats = {
      total_orders: orders?.length || 0,
      total_spent: 0,
      active_orders: 0,
      completed_orders: 0,
      canceled_orders: 0,
    };

    orders?.forEach(order => {
      // Compter les commandes par statut
      if (order.status === 'completed') {
        stats.completed_orders += 1;
      } else if (order.status === 'cancelled' || order.status === 'canceled') {
        stats.canceled_orders += 1;
      } else {
        stats.active_orders += 1;
      }

      // Ajouter au total dépensé seulement si la commande est payée
      if (order.payment_status === 'succeeded') {
        stats.total_spent += (order.total_cents / 100);
      }
    });

    console.log('[API CLIENT-STATS] Calculated stats:', stats);

    return NextResponse.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error: any) {
    console.error('[API CLIENT-STATS] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
