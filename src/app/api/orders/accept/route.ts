import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentService } from '@/lib/payment';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { order_id } = await request.json();

    console.log('✅ API Accept Delivery - Début pour:', order_id);

    if (!order_id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Order ID requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que la commande existe et appartient au client
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('client_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('❌ Commande non trouvée:', orderError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Commande non trouvée' 
        },
        { status: 404 }
      );
    }

    // Vérifier que la commande peut être acceptée (doit être "delivered")
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { 
          success: false,
          error: `La commande ne peut pas être acceptée. Statut actuel: ${order.status}` 
        },
        { status: 400 }
      );
    }

    // Vérifier qu'il y a au moins une livraison
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('order_deliveries')
      .select('id')
      .eq('order_id', order_id);

    if (deliveriesError || !deliveries || deliveries.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Aucune livraison trouvée pour cette commande' 
        },
        { status: 400 }
      );
    }

    // IMPORTANT: Créer l'earning AVANT de changer le statut
    // Sinon le trigger ne trouvera pas d'earning pending!
    console.log('📝 Création de l\'earning pour le prestataire...');

    try {
      const { data: earningId, error: earningError } = await supabase
        .rpc('create_provider_earning', { p_order_id: order_id });

      if (earningError) {
        console.error('❌ Erreur lors de la création de l\'earning:', earningError);
        return NextResponse.json(
          {
            success: false,
            error: 'Erreur lors de la création de l\'earning'
          },
          { status: 500 }
        );
      }

      console.log('✅ Earning créé:', earningId);
    } catch (earningErr) {
      console.error('❌ Exception lors de la création de l\'earning:', earningErr);
      return NextResponse.json(
        {
          success: false,
          error: 'Exception lors de la création de l\'earning'
        },
        { status: 500 }
      );
    }

    // Libérer l'escrow du paiement
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (payment && payment.escrow_status === 'held') {
      console.log('🔓 Libération de l\'escrow pour le paiement:', payment.id);

      const paymentService = getPaymentService();
      const releaseResult = await paymentService.releaseEscrow(payment.id);

      if (!releaseResult.success) {
        console.error('❌ Échec libération escrow:', releaseResult.error);
      } else {
        console.log('✅ Escrow libéré');
      }
    }

    // Mettre à jour le statut de la commande à 'completed'
    // ⚡ CECI VA DÉCLENCHER LE TRIGGER qui appliquera les règles automatiquement
    console.log('🔄 Changement du statut → completed (trigger va se déclencher)');

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select(`
        *,
        order_deliveries(*)
      `)
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de l\'acceptation de la commande'
        },
        { status: 500 }
      );
    }

    console.log('✅ Commande acceptée avec succès:', updatedOrder.id);
    console.log('⚡ Le trigger SQL a appliqué automatiquement les règles de release');

    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder
      },
      message: 'Commande acceptée avec succès !'
    });

  } catch (error: any) {
    console.error('💥 Erreur inattendue:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}