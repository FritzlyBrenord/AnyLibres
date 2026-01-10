// app/api/messages/send/route.ts
// API pour envoyer un message
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/email/notificationService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      conversation_id,
      receiver_id,
      text,
      message_type = 'text',
      reply_to_message_id,
      attachments = [],
      metadata = {},
    } = body;

    // Vérifier l'authentification
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Valider les données
    if (!receiver_id) {
      return NextResponse.json(
        { error: 'receiver_id is required' },
        { status: 400 }
      );
    }

    if (!text && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message must have text or attachments' },
        { status: 400 }
      );
    }

    let finalConversationId = conversation_id;

    // Si pas de conversation_id, créer une nouvelle conversation
    if (!conversation_id) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          participants: [profile.id, receiver_id],
          unread_count: { [receiver_id]: 0 },
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      finalConversationId = newConversation.id;
    } else {
      // Vérifier que l'utilisateur est participant
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participants')
        .eq('id', conversation_id)
        .single();

      if (!conversation || !conversation.participants.includes(profile.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Créer le message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: finalConversationId,
        sender_id: profile.id,
        receiver_id: receiver_id,
        text: text || null,
        message_type,
        reply_to_message_id: reply_to_message_id || null,
        attachments: attachments || [],
        metadata,
        is_delivered: true,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    console.log('✅ Message envoyé avec succès');

    // Envoyer l'email IMMÉDIATEMENT au destinataire
    let debugInfo = {
      senderEmail: '',
      recipientEmail: '',
      emailSent: false,
      error: null as string | null
    };

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

        // Déterminer l'URL selon le contexte (commande ou conversation générale)
        let conversationUrl = '';
        if (metadata?.order_id) {
          conversationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${metadata.order_id}`;
        } else {
          conversationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/messages?conversation=${finalConversationId}`;
        }

        await notificationService.sendMessageNotification({
          senderName,
          recipientEmail: recipientProfile.email,
          messagePreview: text || '[Pièce jointe]',
          conversationUrl,
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
        message,
        conversation_id: finalConversationId,
      },
      debug: {
        notification: debugInfo,
        alert: `📧 Message envoyé ! Email ${debugInfo.emailSent ? 'ENVOYÉ' : 'ÉCHOUÉ'} à ${debugInfo.recipientEmail}`
      }
    });
  } catch (error: any) {
    console.error('Error in send message API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}