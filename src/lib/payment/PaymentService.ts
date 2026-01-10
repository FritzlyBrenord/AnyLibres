// ============================================================================
// PAYMENT SERVICE - Service Centralisé de Gestion des Paiements
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { MockPaymentProvider } from './providers/mock';
import { StripePaymentProvider } from './providers/stripe';
import { PayPalPaymentProvider } from './providers/paypal';
import type {
  IPaymentProvider,
  PaymentProviderType,
  CreatePaymentParams,
  RefundPaymentParams,
  PaymentResult,
  Payment,
  PaymentServiceConfig,
  SensitivePaymentDetails,
  PaymentWebhookEvent,
} from '@/types/payment';
import crypto from 'crypto';

/**
 * Service de paiement centralisé
 * Gère : paiements, escrow, remboursements, webhooks, chiffrement
 */
export class PaymentService {
  private provider: IPaymentProvider;
  private config: PaymentServiceConfig;

  constructor(config?: Partial<PaymentServiceConfig>) {
    // Configuration par défaut
    this.config = {
      provider: config?.provider || 'mock',
      escrow: {
        enabled: true,
        auto_release_days: 7,
        require_client_approval: true,
        platform_fee_percentage: 5,
      },
      encryption_key: config?.encryption_key || process.env.PAYMENT_ENCRYPTION_KEY || this.generateDefaultKey(),
      ...config,
    };

    // Initialiser le provider
    this.provider = this.initializeProvider();
  }

  // ============================================================================
  // MÉTHODES PUBLIQUES - PAIEMENTS
  // ============================================================================

  /**
   * Créer un paiement
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      // 1. Activer escrow par défaut si configuré
      const paymentParams = {
        ...params,
        use_escrow: this.config.escrow.enabled,
      };

      // 2. Créer le paiement via le provider
      const result = await this.provider.createPayment(paymentParams);

      // 3. Chiffrer les détails sensibles
      const encryptedDetails = this.encryptPaymentDetails(params.payment_details);

      // 4. Si échec ET pas 3DS requis, retourner l'erreur directement
      if (!result.success && !result.requires_action) {
        return result;
      }

      // 5. Si 3DS requis, créer quand même le paiement en BD avec status 'requires_action'
      let paymentData: any;
      if (result.requires_action) {
        paymentData = {
          order_id: params.order_id,
          client_id: params.client_id,
          provider_id: params.provider_id,
          amount_cents: params.amount_cents,
          currency: params.currency,
          status: 'requires_action',
          payment_method: params.payment_method,
          payment_provider: this.provider.name,
          external_payment_id: result.transaction_id,
          escrow_status: params.use_escrow ? 'held' : 'released',
          requires_3d_secure: true,
          is_3d_secure_completed: false,
          encrypted_payment_details: encryptedDetails.encrypted,
          payment_details_iv: encryptedDetails.iv,
          display_details: this.createDisplayDetails(params),
        };
      } else {
        paymentData = {
          ...result.payment!,
          encrypted_payment_details: encryptedDetails.encrypted,
          payment_details_iv: encryptedDetails.iv,
        };
      }

      // 6. Sauvegarder dans la DB
      const payment = await this.savePaymentToDB(paymentData);

      // 7. Envoyer webhook asynchrone (sauf si 3DS requis)
      if (!result.requires_action) {
        this.sendWebhookAsync('payment.succeeded', payment);
      }

      return {
        ...result,
        payment,
      };
    } catch (error) {
      console.error('[PaymentService] Error creating payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'PAYMENT_ERROR',
      };
    }
  }

  /**
   * Vérifier statut d'un paiement
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentResult> {
    try {
      // 1. Récupérer de la DB
      const payment = await this.getPaymentFromDB(paymentId);

      if (!payment) {
        return {
          success: false,
          error: 'Payment not found',
          error_code: 'PAYMENT_NOT_FOUND',
        };
      }

      // 2. Vérifier avec le provider si nécessaire
      if (payment.status === 'processing' || payment.status === 'requires_action') {
        const providerResult = await this.provider.checkPaymentStatus(
          payment.external_payment_id || paymentId
        );

        if (providerResult.success && providerResult.payment) {
          // Mettre à jour le statut local
          await this.updatePaymentStatus(paymentId, providerResult.payment.status);
        }
      }

      return {
        success: true,
        payment,
      };
    } catch (error) {
      console.error('[PaymentService] Error checking payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Rembourser un paiement
   */
  async refundPayment(params: RefundPaymentParams): Promise<PaymentResult> {
    try {
      // 1. Vérifier que le paiement existe
      const payment = await this.getPaymentFromDB(params.payment_id);

      if (!payment) {
        return {
          success: false,
          error: 'Payment not found',
          error_code: 'PAYMENT_NOT_FOUND',
        };
      }

      // 2. Vérifier que le paiement peut être remboursé
      if (payment.status !== 'succeeded' && payment.status !== 'escrowed') {
        return {
          success: false,
          error: 'Payment cannot be refunded',
          error_code: 'PAYMENT_NOT_REFUNDABLE',
        };
      }

      // 3. Vérifier le montant
      const maxRefundable = payment.amount_cents - payment.refunded_amount_cents;
      if (params.amount_cents > maxRefundable) {
        return {
          success: false,
          error: `Maximum refundable amount is ${maxRefundable}`,
          error_code: 'INVALID_REFUND_AMOUNT',
        };
      }

      // 4. Effectuer le remboursement via le provider
      const result = await this.provider.refundPayment(params);

      if (!result.success) {
        return result;
      }

      // 5. Sauvegarder le remboursement en DB
      await this.saveRefundToDB({
        payment_id: params.payment_id,
        order_id: payment.order_id,
        amount_cents: params.amount_cents,
        reason: params.reason,
        description: params.description,
        status: 'succeeded',
        initiated_by: params.initiated_by,
        external_refund_id: result.transaction_id,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      // 6. Mettre à jour le paiement
      await this.updatePaymentRefund(params.payment_id, params.amount_cents);

      // 7. Webhook
      this.sendWebhookAsync('payment.refunded', payment);

      return result;
    } catch (error) {
      console.error('[PaymentService] Error refunding payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'REFUND_ERROR',
      };
    }
  }

  /**
   * Libérer l'escrow (après acceptation client)
   */
  async releaseEscrow(paymentId: string): Promise<PaymentResult> {
    try {
      // 1. Vérifier que le paiement est en escrow
      const payment = await this.getPaymentFromDB(paymentId);

      if (!payment || payment.escrow_status !== 'held') {
        return {
          success: false,
          error: 'Payment is not in escrow',
          error_code: 'NOT_IN_ESCROW',
        };
      }

      // 2. Libérer via le provider
      const result = await this.provider.releaseEscrow(
        payment.external_payment_id || paymentId
      );

      if (!result.success) {
        return result;
      }

      // 3. Mettre à jour en DB
      const supabase = await createClient();
      await supabase
        .from('payments')
        .update({
          escrow_status: 'released',
          escrow_released_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      // 4. Webhook
      this.sendWebhookAsync('payment.3ds_completed', payment);

      return result;
    } catch (error) {
      console.error('[PaymentService] Error releasing escrow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      error_code: 'ESCROW_RELEASE_ERROR',
      };
    }
  }

  // ============================================================================
  // CHIFFREMENT DES DONNÉES SENSIBLES
  // ============================================================================

  /**
   * Chiffrer les détails de paiement (AES-256-GCM)
   */
  private encryptPaymentDetails(details: SensitivePaymentDetails): {
    encrypted: string;
    iv: string;
  } {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(this.config.encryption_key, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    const jsonData = JSON.stringify(details);
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    const encryptedWithTag = encrypted + ':' + authTag.toString('hex');

    return {
      encrypted: encryptedWithTag,
      iv: iv.toString('hex'),
    };
  }

  /**
   * Déchiffrer les détails de paiement
   */
  decryptPaymentDetails(encrypted: string, iv: string): SensitivePaymentDetails {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(this.config.encryption_key, 'hex');

    const [encryptedData, authTagHex] = encrypted.split(':');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Envoyer un webhook asynchrone (simulation)
   */
  private async sendWebhookAsync(eventType: PaymentWebhookEvent, payment: Partial<Payment>) {
    try {
      // Dans un vrai système, on utiliserait une queue (BullMQ, etc.)
      setTimeout(async () => {
        await this.processWebhook(eventType, payment);
      }, 100);
    } catch (error) {
      console.error('[PaymentService] Webhook error:', error);
    }
  }

  /**
   * Traiter un webhook
   */
  private async processWebhook(eventType: PaymentWebhookEvent, payment: Partial<Payment>) {
    try {
      const supabase = await createClient();

      await supabase.from('payment_webhooks').insert({
        payment_id: payment.id,
        event_type: eventType,
        provider: this.config.provider,
        external_event_id: `MOCK_EVENT_${Date.now()}`,
        payload: { event: eventType, payment_id: payment.id },
        processed: true,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      console.log(`[PaymentService] Webhook processed: ${eventType}`);
    } catch (error) {
      console.error('[PaymentService] Webhook processing error:', error);
    }
  }

  // ============================================================================
  // BASE DE DONNÉES
  // ============================================================================

  /**
   * Sauvegarder un paiement en DB
   */
  private async savePaymentToDB(payment: Partial<Payment>): Promise<Payment> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: payment.order_id,
        client_id: payment.client_id,
        provider_id: payment.provider_id,
        amount_cents: payment.amount_cents,
        currency: payment.currency || 'EUR',
        status: payment.status,
        payment_method: payment.payment_method,
        payment_provider: payment.payment_provider,
        external_payment_id: payment.external_payment_id,
        escrow_status: payment.escrow_status || 'held',
        requires_3d_secure: payment.requires_3d_secure || false,
        is_3d_secure_completed: payment.is_3d_secure_completed || false,
        risk_score: payment.risk_score || 0,
        encrypted_payment_details: payment.encrypted_payment_details,
        payment_details_iv: payment.payment_details_iv,
        display_details: payment.display_details,
        refunded_amount_cents: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        succeeded_at: payment.succeeded_at,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save payment: ${error.message}`);
    }

    return data;
  }

  /**
   * Récupérer un paiement de la DB
   */
  private async getPaymentFromDB(paymentId: string): Promise<Payment | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      console.error('[PaymentService] Error fetching payment:', error);
      return null;
    }

    return data;
  }

  /**
   * Mettre à jour le statut d'un paiement
   */
  private async updatePaymentStatus(paymentId: string, status: string) {
    const supabase = await createClient();

    await supabase
      .from('payments')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
  }

  /**
   * Mettre à jour le remboursement d'un paiement
   */
  private async updatePaymentRefund(paymentId: string, refundedAmount: number) {
    const supabase = await createClient();

    const payment = await this.getPaymentFromDB(paymentId);
    if (!payment) return;

    const totalRefunded = payment.refunded_amount_cents + refundedAmount;
    const newStatus = totalRefunded >= payment.amount_cents ? 'refunded' : 'partially_refunded';

    await supabase
      .from('payments')
      .update({
        status: newStatus,
        refunded_amount_cents: totalRefunded,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
  }

  /**
   * Sauvegarder un remboursement
   */
  private async saveRefundToDB(refund: any) {
    const supabase = await createClient();

    await supabase.from('payment_refunds').insert(refund);
  }

  // ============================================================================
  // UTILITAIRES
  // ============================================================================

  /**
   * Initialiser le provider selon la configuration
   */
  private initializeProvider(): IPaymentProvider {
    switch (this.config.provider) {
      case 'stripe':
        if (!this.config.stripe?.secret_key) {
          throw new Error('Stripe secret key is required');
        }
        return new StripePaymentProvider(this.config.stripe.secret_key);

      case 'paypal':
        if (!this.config.paypal?.client_id || !this.config.paypal?.client_secret) {
          throw new Error('PayPal credentials are required');
        }
        return new PayPalPaymentProvider(
          this.config.paypal.client_id,
          this.config.paypal.client_secret,
          this.config.paypal.mode
        );

      case 'mock':
      default:
        return new MockPaymentProvider();
    }
  }

  /**
   * Générer une clé de chiffrement par défaut (à remplacer en production)
   */
  private generateDefaultKey(): string {
    console.warn('[PaymentService] Using default encryption key - REPLACE IN PRODUCTION!');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculer les frais de plateforme
   */
  calculatePlatformFees(amount: number): number {
    return Math.round(amount * (this.config.escrow.platform_fee_percentage / 100));
  }

  /**
   * Créer les détails d'affichage (non-sensibles)
   */
  private createDisplayDetails(params: CreatePaymentParams): any {
    const { payment_method, payment_details } = params;

    switch (payment_method) {
      case 'card':
        return {
          method: 'card',
          card_brand: this.detectCardBrand(payment_details.card_number || ''),
          card_last4: payment_details.card_number?.replace(/\s/g, '').slice(-4) || '',
          card_exp_month: payment_details.card_exp_month,
          card_exp_year: payment_details.card_exp_year,
          card_holder_name: payment_details.card_holder_name,
        };

      case 'paypal':
        return {
          method: 'paypal',
          paypal_email: payment_details.paypal_email,
        };

      case 'bank_transfer':
        return {
          method: 'bank_transfer',
          bank_name: 'Banque',
          bank_account_last4: payment_details.bank_iban?.slice(-4) || '0000',
        };

      default:
        return { method: payment_method };
    }
  }

  /**
   * Détecter la marque de carte
   */
  private detectCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    const firstDigit = cleaned[0];
    const firstTwo = cleaned.substring(0, 2);

    if (firstDigit === '4') return 'visa';
    if (parseInt(firstTwo) >= 51 && parseInt(firstTwo) <= 55) return 'mastercard';
    if (firstTwo === '34' || firstTwo === '37') return 'amex';
    if (firstTwo === '60' || firstTwo === '65') return 'discover';

    return 'visa'; // Défaut
  }
}

// ============================================================================
// INSTANCE SINGLETON
// ============================================================================

let paymentServiceInstance: PaymentService | null = null;

/**
 * Obtenir l'instance du service de paiement
 */
export function getPaymentService(config?: Partial<PaymentServiceConfig>): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService(config);
  }
  return paymentServiceInstance;
}