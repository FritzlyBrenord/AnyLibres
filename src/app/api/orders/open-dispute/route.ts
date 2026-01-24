import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { inAppNotificationService } from '@/lib/notifications/inAppNotificationService';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { order_id, reason, details, meetingRequest } = await request.json();

    let disputeDetails = details;
    if (meetingRequest) {
      disputeDetails += `\n\n📅 Demande de Médiation :\n${meetingRequest}`;
    }

    // 1. Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // 2. Verify order ownership and status
    console.log(`🔍 Checking order ${order_id} for user ${user.id}`);

    // Simplification de la requête pour déboguer (retrait des joins complexes si RLS bloque profiles)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error("❌ Order fetch error:", orderError);
      return NextResponse.json(
        { success: false, error: `Commande introuvable (Error: ${orderError?.message || 'Unknown'})` },
        { status: 404 }
      );
    }

    // User must be client or provider
    if (order.client_id !== user.id && order.provider_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Check if dispute already exists
    const { data: existingDispute } = await supabase
      .from('disputes')
      .select('id')
      .eq('order_id', order_id)
      .eq('status', 'open')
      .single();

    if (existingDispute) {
      return NextResponse.json(
        { success: false, error: 'Un litige est déjà ouvert pour cette commande' },
        { status: 400 }
      );
    }

    // 3. Create Dispute Record
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .insert({
        order_id: order_id,
        opened_by_id: user.id,
        reason: reason,
        details: disputeDetails,
        status: 'open'
      })
      .select()
      .single();

    // Note: If 'disputes' table doesn't exist yet, this will fail. 
    // Ideally we'd handle that, but we assume the schema is/will be applied.
    if (disputeError) {
      console.error('Error creating dispute:', disputeError);
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création du litige. Vérifiez que la table 'disputes' existe." },
        { status: 500 }
      );
    }

    // 4. Update Order Status to 'disputed' & Hold Funds
    // Assuming 'escrow_status' field exists in 'payment_info' or related table.
    // Here we update order status.
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'disputed',
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id);

    if (updateError) {
      // Rollback dispute creation if possible? Or just log.
      console.error('Error updating order:', updateError);
    }

    // 5. Update Conversation Metadata (Unified Chat)
    // Find conversation for this order
    // We assume conversation has metadata -> order_id
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .contains('metadata', { order_id: order_id });

    // Update the first matching conversation (usually only one per order)
    if (conversations && conversations.length > 0) {
      const conversation = conversations[0];
      const newMetadata = {
        ...conversation.metadata,
        type: 'dispute',
        dispute_id: dispute.id,
        dispute_status: 'open',
        admin_involved: true
      };

      await supabase
        .from('conversations')
        .update({ metadata: newMetadata })
        .eq('id', conversation.id);

      // 6. Send System Message to Cha
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id, // Or a system ID if available
        text: `⚠️ **LITIGE OUVERT**\n\nRaison : ${reason}\n\nL'administrateur a été notifié et rejoindra cette conversation pour médiation.`,
        message_type: 'system',
        metadata: {
          is_alert: true,
          dispute_id: dispute.id
        }
      });
    }

    // 7. Envoyer une notification in-app à l'autre partie
    const recipientId = user.id === order.client_id ? order.provider_id : order.client_id;
    await inAppNotificationService.create({
      userId: recipientId,
      type: 'system',
      title: '⚠️ Nouveau litige ouvert',
      message: `Un litige a été ouvert pour la commande #${order.id.slice(0, 8)}. Raison : ${reason}`,
      link: user.id === order.client_id ? `/Provider/TableauDeBord/Order` : `/orders`,
      metadata: {
        order_id: order.id,
        dispute_id: dispute.id
      }
    });

    return NextResponse.json({ success: true, data: { dispute, order: { ...order, status: 'disputed' } } });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}