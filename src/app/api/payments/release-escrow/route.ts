// ============================================================================
// API: Release Escrow - Libération de l'escrow (transfert au prestataire)
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPaymentService } from '@/lib/payment';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { orderId } = body;

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID requis' },
        { status: 400 }
      );
    }

    // 2. Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // 3. Vérifier les permissions (client uniquement)
    if (order.client_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé - Seul le client peut libérer l\'escrow' },
        { status: 403 }
      );
    }

    // 4. Vérifier que la commande est livrée
    if (order.status !== 'delivered' && order.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'La commande doit être livrée pour libérer l\'escrow' },
        { status: 400 }
      );
    }

    // 5. Récupérer le paiement
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, error: 'Paiement introuvable' },
        { status: 404 }
      );
    }

    // 6. Vérifier que l'escrow est bien retenu
    if (payment.escrow_status !== 'held') {
      return NextResponse.json(
        { success: false, error: 'L\'escrow a déjà été libéré ou remboursé' },
        { status: 400 }
      );
    }

    // 7. Libérer l'escrow via PaymentService
    const paymentService = getPaymentService();
    const releaseResult = await paymentService.releaseEscrow(payment.id);

    if (!releaseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: releaseResult.error || 'Échec de la libération de l\'escrow',
          error_code: releaseResult.error_code,
        },
        { status: 400 }
      );
    }

    // 8. Mettre à jour la commande en "completed"
    await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      message: 'Escrow libéré avec succès - Le prestataire va recevoir le paiement',
      data: {
        escrow_released_at: releaseResult.payment?.escrow_released_at,
        transaction_id: releaseResult.transaction_id,
      },
    });

  } catch (error) {
    console.error('Error in release-escrow API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'),
      },
      { status: 500 }
    );
  }
}