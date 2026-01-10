// ============================================================================
// API: Open Dispute - Ouvrir un litige sur une commande
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/email/notificationService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { order_id, reason, details } = await request.json();

    console.log('⚖️ API Open Dispute - Début pour:', order_id);

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (!order_id || !reason) {
      return NextResponse.json(
        { success: false, error: 'order_id et reason requis' },
        { status: 400 }
      );
    }

    // 1. Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('❌ Erreur récupération:', orderError);
      return NextResponse.json(
        { success: false, error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // 2. Vérifier que l'utilisateur est le client
    if (order.client_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // 3. Vérifier le statut de la commande (ne peut ouvrir un litige que si la commande est livrée)
    if (order.status !== 'delivered') {
      return NextResponse.json(
        {
          success: false,
          error: 'Un litige ne peut être ouvert que sur une commande livrée'
        },
        { status: 400 }
      );
    }

    // 4. Créer une note de litige dans les métadonnées de la commande
    const disputeInfo = {
      opened_at: new Date().toISOString(),
      opened_by: user.id,
      reason,
      details,
      status: 'open',
    };

    const currentMetadata = order.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      dispute: disputeInfo,
    };

    // 5. Mettre à jour la commande
    // NOTE: Pour l'instant, on garde le statut 'delivered' mais on ajoute l'info dans metadata
    // Plus tard, quand le système de disputes sera implémenté, on créera une table dédiée
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'ouverture du litige' },
        { status: 500 }
      );
    }

    console.log('⚖️ Litige ouvert avec succès:', order_id);
    console.log('📋 Raison:', reason);

    // Envoyer notifications email au client et au prestataire
    try {
      // Récupérer les informations du client
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', order.client_id)
        .single();

      // Récupérer les informations du prestataire
      const { data: providerProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', order.provider_id)
        .single();

      if (clientProfile) {
        await notificationService.sendDisputeNotification(clientProfile.email, order_id, false);
        console.log('📧 Email de dispute envoyé au client');
      }

      if (providerProfile) {
        await notificationService.sendDisputeNotification(providerProfile.email, order_id, true);
        console.log('📧 Email de dispute envoyé au prestataire');
      }
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi des emails:', emailError);
    }

    // TODO: Plus tard, implémenter:
    // - Créer une entrée dans une table `disputes`
    // - Notifier l'équipe support
    // - Mettre l'escrow en hold si pas déjà fait

    return NextResponse.json({
      success: true,
      message: 'Litige ouvert avec succès. Notre équipe va examiner votre cas.',
      data: {
        order: updatedOrder,
        dispute: disputeInfo,
      },
    });

  } catch (error) {
    console.error('❌ Error in open-dispute API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'),
      },
      { status: 500 }
    );
  }
}