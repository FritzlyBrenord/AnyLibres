// ============================================================================
// API: Complete 3D Secure - Finaliser le paiement après vérification 3DS
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPaymentService } from '@/lib/payment';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { orderId } = await request.json();

    console.log('🔐 Finalisation 3DS pour commande:', orderId);

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID requis' },
        { status: 400 }
      );
    }

    // 1. Récupérer la commande
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

    // 2. Vérifier que la commande est en cours de traitement
    if (order.status !== 'payment_processing') {
      return NextResponse.json(
        { success: false, error: 'La commande n\'est pas en attente de 3DS' },
        { status: 400 }
      );
    }

    // 3. Récupérer le paiement
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (paymentError || !payment) {
      console.error('❌ Paiement non trouvé');
      return NextResponse.json(
        { success: false, error: 'Paiement introuvable' },
        { status: 404 }
      );
    }

    // 4. Vérifier 3DS via PaymentService
    const paymentService = getPaymentService();
    const verifyResult = await paymentService['provider'].verify3DSecure(
      payment.id,
      { verified: true }
    );

    if (!verifyResult.success) {
      console.error('❌ Échec vérification 3DS');

      // Mettre à jour en failed
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      return NextResponse.json(
        { success: false, error: 'Échec de la vérification 3D Secure' },
        { status: 400 }
      );
    }

    // 5. Mettre à jour le paiement en succeeded
    await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        is_3d_secure_completed: true,
        succeeded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // 6. Mettre à jour la commande en paid
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'succeeded',
        payment_intent_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    console.log('✅ Paiement 3DS finalisé - Commande mise à jour:', orderId);
    console.log('💰 Escrow status:', payment.escrow_status);

    return NextResponse.json({
      success: true,
      message: 'Paiement finalisé avec succès',
      data: {
        order_id: orderId,
        payment_id: payment.id,
        status: 'paid',
      },
    });

  } catch (error) {
    console.error('Error in complete-3ds API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'),
      },
      { status: 500 }
    );
  }
}