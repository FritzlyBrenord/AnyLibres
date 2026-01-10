/**
 * Service de notification par email avec intégration In-App
 *
 * Gère toutes les notifications email ET in-app pour:
 * - Nouvelles commandes
 * - Messages (après 20 minutes sans réponse)
 * - Livraison de commande
 * - Demande de révision
 * - Annulation/Remboursement
 * - Retrait d'argent
 * - Disputes
 */

import { emailService } from './emailService';
import { inAppNotificationService } from '../notifications/inAppNotificationService';
import { createClient } from '@supabase/supabase-js';

// Client Admin pour lookup userId par email si nécessaire
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface OrderNotificationData {
  orderId: string;
  serviceTitle: string;
  clientName: string;
  providerName: string;
  amount: number;
  orderUrl: string;
  providerId?: string; // Added for immediate in-app notification
  clientId?: string;   // Added for immediate in-app notification
}

interface MessageNotificationData {
  senderName: string;
  recipientEmail: string;
  messagePreview: string;
  conversationUrl: string;
  recipientId?: string; // Added
}

interface DeliveryNotificationData {
  orderId: string;
  serviceTitle: string;
  clientName: string;
  deliveryMessage: string;
  orderUrl: string;
  clientId?: string; // Added
}

interface RevisionNotificationData {
  orderId: string;
  serviceTitle: string;
  clientName: string;
  revisionMessage: string;
  orderUrl: string;
  providerId?: string; // Added
}

interface WithdrawalNotificationData {
  amount: number;
  providerName: string;
  withdrawalId: string;
  status: 'pending' | 'completed' | 'failed';
  providerId?: string; // Added
}

class NotificationService {

  /**
   * Helper pour récupérer userId par email (cache possible à ajouter)
   */
  private async getUserIdByEmail(email: string): Promise<string | null> {
    // Note: auth.users n'est pas directement requêtable facilement sans RPC ou droits spéciaux parfois.
    // Une alternative est de chercher dans la table `public.profiles` si elle existe et contient l'email (souvent non pour sécurité).
    // Si on utilise le service role key, on peut lister les users :
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error || !data || !data.users) return null;

    // C'est inefficace pour beaucoup d'users, mais simple pour l'instant.
    // Idéalement, on passe l'ID directement aux méthodes.
    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    return user ? user.id : null;
  }

  /**
   * Envoyer notification de nouvelle commande au prestataire
   */
  async sendNewOrderNotification(providerEmail: string, data: OrderNotificationData) {
    // 1. Envoyer Email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 24px; }
            .content { padding: 30px; }
            .order-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .order-detail { margin: 10px 0; color: #1f2937; }
            .order-detail strong { color: #059669; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>🎉 Nouvelle commande reçue !</h1></div>
            <div class="content">
              <p>Bonjour <strong>${data.providerName}</strong>,</p>
              <p>Vous avez reçu une nouvelle commande sur AnyLibre !</p>
              <div class="order-box">
                <p class="order-detail"><strong>📋 Commande :</strong> #${data.orderId}</p>
                <p class="order-detail"><strong>🛍️ Service :</strong> ${data.serviceTitle}</p>
                <p class="order-detail"><strong>👤 Client :</strong> ${data.clientName}</p>
                <p class="order-detail"><strong>💰 Montant :</strong> ${data.amount.toFixed(2)} HTG</p>
              </div>
              <center><a href="${data.orderUrl}" class="cta-button">Voir la commande</a></center>
            </div>
            <div class="footer"><p><strong>AnyLibre</strong></p></div>
          </div>
        </body>
      </html>
    `;

    const emailPromise = emailService.sendEmail({
      to: providerEmail,
      subject: `🎉 Nouvelle commande #${data.orderId} - ${data.serviceTitle}`,
      html,
    });

    // 2. Créer Notification In-App
    const userId = data.providerId || await this.getUserIdByEmail(providerEmail);
    if (userId) {
      await inAppNotificationService.create({
        userId,
        type: 'order',
        title: 'Nouvelle commande reçue',
        message: `Vous avez reçu une commande de ${data.clientName} pour "${data.serviceTitle}".`,
        link: data.orderUrl,
        metadata: { orderId: data.orderId, amount: data.amount }
      });
    }

    return emailPromise;
  }

  /**
   * Envoyer notification de confirmation de commande au client
   */
  async sendOrderConfirmationToClient(clientEmail: string, data: OrderNotificationData) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>✅ Commande confirmée !</h1>
            <p>Bonjour <strong>${data.clientName}</strong>,</p>
            <p>Votre commande <strong>#${data.orderId}</strong> a été créée avec succès.</p>
            <p>Prestataire : ${data.providerName}</p>
            <a href="${data.orderUrl}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:white;text-decoration:none;border-radius:5px;">Suivre ma commande</a>
          </div>
        </body>
      </html>
    `;

    const emailPromise = emailService.sendEmail({
      to: clientEmail,
      subject: `✅ Confirmation de commande #${data.orderId}`,
      html,
    });

    // In-App
    const userId = data.clientId || await this.getUserIdByEmail(clientEmail);
    if (userId) {
      await inAppNotificationService.create({
        userId,
        type: 'order',
        title: 'Commande confirmée',
        message: `Votre commande #${data.orderId} a bien été enregistrée.`,
        link: data.orderUrl,
        metadata: { orderId: data.orderId }
      });
    }

    return emailPromise;
  }

  /**
   * Envoyer notification de message
   */
  async sendMessageNotification(data: MessageNotificationData) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>💬 Nouveau message</h1>
            <p><strong>${data.senderName}</strong> vous a envoyé un message.</p>
            <p><em>"${data.messagePreview}"</em></p>
            <a href="${data.conversationUrl}" style="display:inline-block;padding:10px 20px;background:#8b5cf6;color:white;text-decoration:none;border-radius:5px;">Répondre</a>
          </div>
        </body>
      </html>
    `;

    const emailPromise = emailService.sendEmail({
      to: data.recipientEmail,
      subject: `💬 ${data.senderName} vous a envoyé un message`,
      html,
    });

    // In-App (Seulement si flagué comme notification système, car le chat a son propre système temps réel)
    // Ici, on double si l'utilisateur n'est pas là. Mais pour l'instant on le fait systématiquement pour l'historique notification.
    const userId = data.recipientId || await this.getUserIdByEmail(data.recipientEmail);
    if (userId) {
      await inAppNotificationService.create({
        userId,
        type: 'message',
        title: `Message de ${data.senderName}`,
        message: data.messagePreview,
        link: data.conversationUrl,
      });
    }

    return emailPromise;
  }

  /**
   * Envoyer notification de livraison au client
   */
  async sendDeliveryNotification(clientEmail: string, data: DeliveryNotificationData) {
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h1>🎁 Votre commande a été livrée !</h1>
        <p>Le prestataire a livré votre commande #${data.orderId}.</p>
        <a href="${data.orderUrl}">Voir la livraison</a>
      </body></html>
    `;

    const emailPromise = emailService.sendEmail({
      to: clientEmail,
      subject: `🎁 Livraison de la commande #${data.orderId}`,
      html,
    });

    const userId = data.clientId || await this.getUserIdByEmail(clientEmail);
    if (userId) {
      await inAppNotificationService.create({
        userId,
        type: 'delivery',
        title: 'Commande livrée !',
        message: `Votre commande "${data.serviceTitle}" a été livrée. Vérifiez-la maintenant.`,
        link: data.orderUrl,
        metadata: { orderId: data.orderId }
      });
    }

    return emailPromise;
  }

  /**
   * Envoyer notification de demande de révision au prestataire
   */
  async sendRevisionRequestNotification(providerEmail: string, data: RevisionNotificationData) {
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h1>🔄 Demande de révision</h1>
        <p>Le client demande une révision pour la commande #${data.orderId}.</p>
        <a href="${data.orderUrl}">Voir la demande</a>
      </body></html>
    `;

    const emailPromise = emailService.sendEmail({
      to: providerEmail,
      subject: `🔄 Révision demandée pour #${data.orderId}`,
      html,
    });

    const userId = data.providerId || await this.getUserIdByEmail(providerEmail);
    if (userId) {
      await inAppNotificationService.create({
        userId,
        type: 'order',
        title: 'Demande de révision',
        message: `Le client demande une révision pour la commande #${data.orderId}.`,
        link: data.orderUrl,
        metadata: { orderId: data.orderId }
      });
    }

    return emailPromise;
  }

  /**
   * Envoyer notification d'annulation de commande
   */
  async sendCancellationNotification(email: string, orderId: string, reason: string, isProvider: boolean, userId?: string) {
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h1>❌ Commande annulée</h1>
        <p>La commande #${orderId} a été annulée.</p>
        <p>Raison : ${reason}</p>
      </body></html>
    `;

    const emailPromise = emailService.sendEmail({
      to: email,
      subject: `❌ Commande #${orderId} annulée`,
      html,
    });

    const targetUserId = userId || await this.getUserIdByEmail(email);
    if (targetUserId) {
      await inAppNotificationService.create({
        userId: targetUserId,
        type: 'order',
        title: 'Commande annulée',
        message: `La commande #${orderId} a été annulée. Raison : ${reason}`,
        link: `/orders/${orderId}`,
        metadata: { orderId }
      });
    }

    return emailPromise;
  }

  /**
 * Envoyer notification de retrait d'argent
 */
  async sendWithdrawalNotification(providerEmail: string, data: WithdrawalNotificationData) {
    const statusTexts = {
      pending: '⏳ En cours de traitement',
      completed: '✅ Traitement réussi',
      failed: '❌ Traitement échoué',
    };
    const statusText = statusTexts[data.status];

    const html = `
      <!DOCTYPE html>
      <html><body>
        <h1>💰 ${statusText}</h1>
        <p>Votre retrait de ${data.amount} HTG est ${data.status}.</p>
      </body></html>
    `;

    const emailPromise = emailService.sendEmail({
      to: providerEmail,
      subject: `💰 ${statusText} - Retrait de ${data.amount.toFixed(2)} HTG`,
      html,
    });

    const userId = data.providerId || await this.getUserIdByEmail(providerEmail);
    if (userId) {
      await inAppNotificationService.create({
        userId,
        type: 'payment',
        title: `Retrait ${statusText}`,
        message: `Votre demande de retrait de ${data.amount} HTG est maintenant : ${data.status}.`,
        link: '/wallet',
        metadata: { withdrawalId: data.withdrawalId, amount: data.amount, status: data.status }
      });
    }

    return emailPromise;
  }

  /**
 * Envoyer notification de dispute ouverte
 */
  async sendDisputeNotification(email: string, orderId: string, isProvider: boolean, userId?: string) {
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h1>⚠️ Dispute ouverte</h1>
        <p>Une dispute a été ouverte pour la commande #${orderId}.</p>
      </body></html>
    `;

    const emailPromise = emailService.sendEmail({
      to: email,
      subject: `⚠️ Dispute ouverte - Commande #${orderId}`,
      html,
    });

    const targetUserId = userId || await this.getUserIdByEmail(email);
    if (targetUserId) {
      await inAppNotificationService.create({
        userId: targetUserId,
        type: 'system',
        title: 'Dispute ouverte',
        message: `Une dispute a été ouverte pour la commande #${orderId}. L'équipe de support va intervenir.`,
        link: `/orders/${orderId}`,
        metadata: { orderId }
      });
    }

    return emailPromise;
  }
}

export const notificationService = new NotificationService();
