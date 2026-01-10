// ============================================================================
// API: Update Order Status
// Route: PATCH /api/orders/update-status
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { orderId, status, paymentStatus, paymentIntentId } = body;

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer la commande
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // Préparer l'update
    const updateData: any = { updated_at: new Date().toISOString() };

    if (status) updateData.status = status;
    if (paymentStatus) updateData.payment_status = paymentStatus;
    if (paymentIntentId) updateData.payment_intent_id = paymentIntentId;

    // Si payment succeeded
    if (paymentStatus === 'succeeded' && !status) {
      updateData.status = 'paid';
    }

    // Si order completed
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Update
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Erreur update: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { order: updatedOrder },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
