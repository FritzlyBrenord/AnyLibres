import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/email/notificationService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { order_id, reason, details } = await request.json();

    console.log('🔄 API Request Revision - Début pour:', order_id);

    if (!order_id || !reason) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Order ID et raison requis' 
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
      .select('*, order_deliveries(id)')
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

    // Vérifier que la commande peut avoir une révision (doit être "delivered")
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { 
          success: false,
          error: `La commande ne peut pas avoir de révision. Statut actuel: ${order.status}` 
        },
        { status: 400 }
      );
    }

    // Vérifier le nombre maximum de révisions
    const { data: existingRevisions, error: revisionsError } = await supabase
      .from('order_revisions')
      .select('id')
      .eq('order_id', order_id);

    const maxRevisions = 3; // Maximum de révisions autorisées
    if (existingRevisions && existingRevisions.length >= maxRevisions) {
      return NextResponse.json(
        { 
          success: false,
          error: `Nombre maximum de révisions atteint (${maxRevisions})` 
        },
        { status: 400 }
      );
    }

    // Créer la révision
    const revisionNumber = (existingRevisions?.length || 0) + 1;
    const latestDelivery = order.order_deliveries?.[0];

    const { data: revision, error: revisionError } = await supabase
      .from('order_revisions')
      .insert({
        order_id,
        delivery_id: latestDelivery?.id || null,
        revision_number: revisionNumber,
        requested_by: user.id,
        reason,
        details: details || null,
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (revisionError) {
      console.error('❌ Erreur création révision:', revisionError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Erreur lors de la création de la révision' 
        },
        { status: 500 }
      );
    }

    // Mettre à jour le statut de la commande
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'revision_requested',
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour commande:', updateError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Erreur lors de la mise à jour de la commande' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Révision demandée avec succès:', revision.id);

    // Envoyer notification email au prestataire
    try {
      // Récupérer les informations du client
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name')
        .eq('user_id', user.id)
        .single();

      // Récupérer les informations du prestataire
      const { data: providerProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name, email')
        .eq('user_id', order.provider_id)
        .single();

      // Récupérer les informations du service
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('title')
        .eq('order_id', order_id)
        .limit(1);

      if (clientProfile && providerProfile && orderItems && orderItems.length > 0) {
        const clientName = clientProfile.display_name || `${clientProfile.first_name} ${clientProfile.last_name}`;
        const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/Provider/TableauDeBord/Order/${order_id}`;

        await notificationService.sendRevisionRequestNotification(providerProfile.email, {
          orderId: order_id,
          serviceTitle: orderItems[0].title,
          clientName,
          revisionMessage: `${reason}${details ? ': ' + details : ''}`,
          orderUrl,
        });

        console.log('📧 Email de demande de révision envoyé au prestataire');
      }
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
      // Ne pas bloquer la révision si l'email échoue
    }

    return NextResponse.json({
      success: true,
      data: {
        revision,
        order: updatedOrder
      },
      message: 'Demande de révision envoyée au prestataire'
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