/**
 * Message Notification Tracker
 *
 * Gère l'envoi de notifications email pour les messages non répondus après 20 minutes
 */

import { createClient } from '@/lib/supabase/server';
import { notificationService } from './notificationService';

interface MessageNotificationCheck {
  conversationId: string;
  lastMessageId: string;
  senderId: string;
  recipientId: string;
  messageContent: string;
  messageTimestamp: Date;
}

export class MessageNotificationTracker {
  private readonly NOTIFICATION_DELAY_MINUTES = 1; // Temporairement réduit à 1 minute pour les tests (normalement 20)

  /**
   * Enregistrer un message et programmer une notification si pas de réponse
   */
  async trackMessage(data: MessageNotificationCheck): Promise<void> {
    try {
      const supabase = await createClient();

      // Enregistrer dans une table de tracking (à créer dans Supabase)
      // Pour l'instant, on peut utiliser un système simple avec setTimeout côté serveur
      // ou créer une table pending_message_notifications

      const { error } = await supabase
        .from('pending_message_notifications')
        .insert({
          conversation_id: data.conversationId,
          message_id: data.lastMessageId,
          sender_id: data.senderId,
          recipient_id: data.recipientId,
          message_preview: data.messageContent.substring(0, 200),
          created_at: data.messageTimestamp.toISOString(),
          scheduled_for: new Date(data.messageTimestamp.getTime() + this.NOTIFICATION_DELAY_MINUTES * 60000).toISOString(),
          status: 'pending',
        });

      if (error) {
        console.error('Erreur lors de l\'enregistrement de la notification:', error);
      }
    } catch (error) {
      console.error('Erreur dans trackMessage:', error);
    }
  }

  /**
   * Annuler les notifications en attente lorsqu'un utilisateur répond
   */
  async cancelPendingNotifications(conversationId: string, userId: string): Promise<void> {
    try {
      const supabase = await createClient();

      // Annuler toutes les notifications en attente pour cette conversation
      // où l'utilisateur actuel est le destinataire (car il a répondu)
      await supabase
        .from('pending_message_notifications')
        .update({ status: 'cancelled' })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', userId)
        .eq('status', 'pending');

    } catch (error) {
      console.error('Erreur dans cancelPendingNotifications:', error);
    }
  }

  /**
   * Vérifier et envoyer les notifications en attente (à appeler via un cron job)
   */
  async processPendingNotifications(): Promise<void> {
    try {
      const supabase = await createClient();

      const now = new Date();

      // Récupérer les notifications à envoyer
      const { data: notifications, error } = await supabase
        .from('pending_message_notifications')
        .select(`
          *,
          sender:sender_id(first_name, last_name, display_name),
          recipient:recipient_id(email)
        `)
        .eq('status', 'pending')
        .lte('scheduled_for', now.toISOString());

      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return;
      }

      if (!notifications || notifications.length === 0) {
        return;
      }

      // Envoyer chaque notification
      for (const notification of notifications) {
        try {
          const senderName = notification.sender.display_name ||
            `${notification.sender.first_name} ${notification.sender.last_name}`;

          await notificationService.sendMessageNotification({
            senderName,
            recipientEmail: notification.recipient.email,
            messagePreview: notification.message_preview,
            conversationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/messages?conversation=${notification.conversation_id}`,
          });

          // Marquer comme envoyée
          await supabase
            .from('pending_message_notifications')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', notification.id);

          console.log(`📧 Notification envoyée pour le message ${notification.message_id}`);
        } catch (emailError) {
          console.error(`Erreur lors de l'envoi de la notification ${notification.id}:`, emailError);

          // Marquer comme échouée
          await supabase
            .from('pending_message_notifications')
            .update({ status: 'failed' })
            .eq('id', notification.id);
        }
      }
    } catch (error) {
      console.error('Erreur dans processPendingNotifications:', error);
    }
  }
}

export const messageNotificationTracker = new MessageNotificationTracker();
