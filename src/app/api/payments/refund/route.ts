// ============================================================================
// API: Refund Payment - Remboursement de paiement
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPaymentService } from '@/lib/payment';
import type { RefundReason } from '@/types/payment';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { orderId, reason, description, amount } = body;

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (!orderId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Order ID et raison requis' },
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

    // 3. Vérifier les permissions (client ou admin)
    if (order.client_id !== user.id) {
      // TODO: Vérifier si user est admin
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // 4. Récupérer le paiement associé
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

    // 5. Déterminer le montant à rembourser
    const refundAmount = amount || payment.amount_cents;

    // 6. Effectuer le remboursement via PaymentService
    const paymentService = getPaymentService();
    const refundResult = await paymentService.refundPayment({
      payment_id: payment.id,
      amount_cents: refundAmount,
      reason: reason as RefundReason,
      description: description || '',
      initiated_by: user.id,
    });

    if (!refundResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: refundResult.error || 'Échec du remboursement',
          error_code: refundResult.error_code,
        },
        { status: 400 }
      );
    }

    // 7. Mettre à jour la commande
    const newStatus = refundAmount >= payment.amount_cents ? 'refunded' : order.status;
    await supabase
      .from('orders')
      .update({
        status: newStatus,
        payment_status: refundAmount >= payment.amount_cents ? 'refunded' : 'partially_refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      message: 'Remboursement effectué avec succès',
      data: {
        refund: {
          amount_cents: refundAmount,
          transaction_id: refundResult.transaction_id,
        },
      },
    });

  } catch (error) {
    console.error('Error in refund API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'),
      },
      { status: 500 }
    );
  }
}