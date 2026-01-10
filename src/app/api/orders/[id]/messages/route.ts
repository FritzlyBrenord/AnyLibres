import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/email/notificationService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: orderId } = await params;

    console.log('🔍 API Order Messages - Récupération pour:', orderId);

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que la commande existe et que l'utilisateur y a accès
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, client_id, provider_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est soit le client soit le prestataire
    if (order.client_id !== user.id && order.provider_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer les messages liés à cette commande
    // Les messages ont metadata->order_id = orderId
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .or(`sender_id.eq.${order.client_id},receiver_id.eq.${order.client_id}`)
      .or(`sender_id.eq.${order.provider_id},receiver_id.eq.${order.provider_id}`)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ Erreur récupération messages:', messagesError);
      return NextResponse.json(
        { success: false, error: 'Erreur récupération messages' },
        { status: 500 }
      );
    }

    // Filtrer uniquement les messages liés à cette commande
    const orderMessages = messages.filter(msg => {
      // Vérifier que le message concerne bien cette commande
      const metadata = msg.metadata;
      if (metadata && metadata.order_id === orderId) {
        return true;
      }
      // Aussi accepter les messages entre client et provider même sans metadata
      // (pour rétrocompatibilité)
      return (
        (msg.sender_id === order.client_id && msg.receiver_id === order.provider_id) ||
        (msg.sender_id === order.provider_id && msg.receiver_id === order.client_id)
      );
    });

    console.log(`✅ ${orderMessages.length} messages trouvés pour la commande`);

    return NextResponse.json({
      success: true,
      data: {
        messages: orderMessages,
        total: orderMessages.length
      }
    });

  } catch (error: any) {
    console.error('💥 Erreur inattendue:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Envoyer un message contextualisé pour cette commande
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: orderId } = await params;
    const body = await request.json();
    const { text, message_type } = body;

    console.log('📤 API Order Messages - Envoi message pour:', orderId);

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que la commande existe
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, client_id, provider_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Déterminer le receiver_id
    const receiver_id = user.id === order.client_id ? order.provider_id : order.client_id;

    // Créer le message avec metadata order_id
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id,
        text,
        message_type: message_type || 'text',
        is_delivered: true,
        delivered_at: new Date().toISOString(),
        metadata: {
          order_id: orderId,
          context: 'order_discussion'
        }
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (messageError) {
      console.error('❌ Erreur création message:', messageError);
      return NextResponse.json(
        { success: false, error: 'Erreur envoi message' },
        { status: 500 }
      );
    }

    console.log('✅ Message envoyé avec succès');

    // Récupérer les informations pour le debug et l'envoi immédiat de l'email
    let debugInfo = {
      senderEmail: '',
      recipientEmail: '',
      emailSent: false,
      error: null as string | null
    };

    // Envoyer l'email IMMÉDIATEMENT au destinataire
    try {
      // Récupérer les emails pour le debug
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('email, display_name, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      // Le receiver_id peut être soit un user_id soit un profile_id
      // On essaie d'abord par id (profile_id), puis par user_id
      let recipientProfile = null;

      // Essayer par profile.id
      const { data: profileById } = await supabase
        .from('profiles')
        .select('email, display_name, first_name, last_name')
        .eq('id', receiver_id)
        .single();

      if (profileById) {
        recipientProfile = profileById;
      } else {
        // Essayer par user_id
        const { data: profileByUserId } = await supabase
          .from('profiles')
          .select('email, display_name, first_name, last_name')
          .eq('user_id', receiver_id)
          .single();

        recipientProfile = profileByUserId;
      }

      debugInfo.senderEmail = senderProfile?.email || 'Email non trouvé';
      debugInfo.recipientEmail = recipientProfile?.email || 'Email non trouvé';

      console.log('📧 DEBUG - Expéditeur:', {
        id: user.id,
        email: senderProfile?.email,
        name: senderProfile?.display_name || `${senderProfile?.first_name} ${senderProfile?.last_name}`
      });

      console.log('📧 DEBUG - Destinataire:', {
        id: receiver_id,
        email: recipientProfile?.email,
        name: recipientProfile?.display_name || `${recipientProfile?.first_name} ${recipientProfile?.last_name}`
      });

      // Envoyer l'email immédiatement
      if (recipientProfile?.email && senderProfile) {
        const senderName = senderProfile.display_name || `${senderProfile.first_name} ${senderProfile.last_name}`;
        const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderId}`;

        await notificationService.sendMessageNotification({
          senderName,
          recipientEmail: recipientProfile.email,
          messagePreview: text,
          conversationUrl: orderUrl,
        });

        debugInfo.emailSent = true;
        console.log('📧✅ Email envoyé IMMÉDIATEMENT au destinataire:', recipientProfile.email);
      } else {
        debugInfo.error = 'Email du destinataire non trouvé';
        console.error('❌ Impossible d\'envoyer l\'email: email destinataire manquant');
      }
    } catch (error) {
      debugInfo.emailSent = false;
      debugInfo.error = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur lors de l\'envoi immédiat de l\'email:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        message
      },
      debug: {
        notification: debugInfo,
        alert: `📧 Message envoyé ! Email ${debugInfo.emailSent ? 'ENVOYÉ' : 'ÉCHOUÉ'} à ${debugInfo.recipientEmail}`
      }
    });

  } catch (error: any) {
    console.error('💥 Erreur inattendue:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
