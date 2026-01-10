// ============================================================================
// API ADMIN: Initialiser les earnings pour les commandes existantes
// ============================================================================
// ATTENTION: Cette route doit être protégée (admin seulement)

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Vérifier l'authentification (TODO: vérifier si admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // TODO: Vérifier que l'utilisateur est admin
    // if (!user.role === 'admin') { ... }

    // 2. Récupérer toutes les commandes complétées sans earning
    const { data: completedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, provider_id, status, total_cents, fees_cents')
      .in('status', ['completed', 'delivered'])
      .order('created_at', { ascending: true });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des commandes' },
        { status: 500 }
      );
    }

    if (!completedOrders || completedOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune commande à traiter',
        data: {
          processed: 0,
          skipped: 0,
          failed: 0,
        },
      });
    }

    // 3. Vérifier quelles commandes ont déjà un earning
    const { data: existingEarnings } = await supabase
      .from('provider_earnings')
      .select('order_id');

    const existingOrderIds = new Set(
      existingEarnings?.map((e) => e.order_id) || []
    );

    // 4. Traiter chaque commande
    const results = {
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const order of completedOrders) {
      // Ignorer si déjà traité
      if (existingOrderIds.has(order.id)) {
        results.skipped++;
        continue;
      }

      try {
        // Appeler la fonction PostgreSQL pour créer l'earning
        const { data: earningData, error: createError } = await supabase
          .rpc('create_provider_earning', { p_order_id: order.id });

        if (createError) {
          throw createError;
        }

        // Si la commande est 'completed', libérer le paiement
        if (order.status === 'completed') {
          const { error: releaseError } = await supabase
            .rpc('release_provider_earning', { p_order_id: order.id });

          if (releaseError) {
            console.error(`Failed to release earning for order ${order.id}:`, releaseError);
            // Ne pas échouer complètement, juste logger
          }
        }

        results.processed++;
      } catch (error) {
        console.error(`Failed to process order ${order.id}:`, error);
        results.failed++;
        results.errors.push(
          `Order ${order.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // 5. Retourner le résumé
    return NextResponse.json({
      success: true,
      message: `Initialisation terminée: ${results.processed} earnings créés`,
      data: results,
    });

  } catch (error) {
    console.error('Error in init-earnings API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}
