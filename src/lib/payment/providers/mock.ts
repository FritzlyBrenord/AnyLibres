// ============================================================================
// MOCK PAYMENT PROVIDER - Simulation Réaliste (Test & Développement)
// ============================================================================

import type {
  PaymentProviderType,
  CreatePaymentParams,
  RefundPaymentParams,
  PaymentResult,
  Payment,
  PaymentDisplayDetails,
} from '@/types/payment';
import { BasePaymentProvider } from './base';

/**
 * Provider de paiement simulé
 * Simule Stripe/PayPal de façon réaliste avec :
 * - 3D Secure
 * - Escrow
 * - Remboursements
 * - Webhooks
 * - Taux d'échec configurable
 */
export class MockPaymentProvider extends BasePaymentProvider {
  name: PaymentProviderType = 'mock';

  // Configuration du mock
  private config = {
    successRate: 0.95, // 95% de succès
    processingDelay: 2000, // 2 secondes de délai
    requires3DSRate: 0.30, // 30% des paiements nécessitent 3DS
    escrowEnabled: true,
  };

  /**
   * Créer un paiement simulé
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    this.log('info', 'Creating payment', {
      order_id: params.order_id,
      amount: params.amount_cents / 100 + ' ' + params.currency,
    });

    // 1. Valider les détails
    const validation = this.validatePaymentDetails(params);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        error_code: 'INVALID_PAYMENT_DETAILS',
      };
    }

    // 2. Simuler délai de traitement
    await this.delay(this.config.processingDelay);

    // 3. Simuler échec aléatoire
    if (Math.random() > this.config.successRate) {
      this.log('warn', 'Payment failed (simulated)', { order_id: params.order_id });
      return {
        success: false,
        error: 'Transaction refusée par la banque',
        error_code: 'PAYMENT_DECLINED',
      };
    }

    // 4. Déterminer si 3D Secure est requis
    const requires3DS =
      params.require_3d_secure ||
      this.should3DSecureBeRequired(params) ||
      Math.random() < this.config.requires3DSRate;

    if (requires3DS) {
      this.log('info', 'Payment requires 3D Secure', { order_id: params.order_id });
      return {
        success: false, // Pas encore complété
        requires_action: true,
        action_type: '3d_secure',
        action_url: this.generate3DSUrl(params.order_id),
        transaction_id: this.generateTransactionId('MOCK_3DS'),
      };
    }

    // 5. Créer le paiement avec succès
    const transactionId = this.generateTransactionId('MOCK');
    const riskScore = this.calculateRiskScore(params);

    const payment: Partial<Payment> = {
      order_id: params.order_id,
      client_id: params.client_id,
      provider_id: params.provider_id,
      amount_cents: params.amount_cents,
      currency: params.currency,
      status: 'succeeded',
      payment_method: params.payment_method,
      payment_provider: 'mock',
      external_payment_id: transactionId,

      // Escrow
      escrow_status: params.use_escrow ? 'held' : 'released',

      // Sécurité
      requires_3d_secure: false,
      is_3d_secure_completed: false,
      risk_score: riskScore,

      // Display details (non-sensibles)
      display_details: this.createDisplayDetails(params),

      refunded_amount_cents: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      succeeded_at: new Date().toISOString(),
    };

    this.log('info', 'Payment succeeded', {
      transaction_id: transactionId,
      escrow: params.use_escrow ? 'held' : 'released',
    });

    return {
      success: true,
      payment: payment as Payment,
      transaction_id: transactionId,
    };
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentResult> {
    this.log('info', 'Checking payment status', { payment_id: paymentId });

    await this.delay(500);

    // Simulation: on considère que le paiement existe et est succeeded
    return {
      success: true,
      payment: {
        id: paymentId,
        status: 'succeeded',
      } as Payment,
    };
  }

  /**
   * Rembourser un paiement
   */
  async refundPayment(params: RefundPaymentParams): Promise<PaymentResult> {
    this.log('info', 'Processing refund', {
      payment_id: params.payment_id,
      amount: params.amount_cents / 100,
      reason: params.reason,
    });

    await this.delay(1500);

    // Simuler succès (dans 98% des cas)
    if (Math.random() < 0.98) {
      const refundId = this.generateTransactionId('MOCK_REFUND');

      this.log('info', 'Refund succeeded', { refund_id: refundId });

      return {
        success: true,
        transaction_id: refundId,
        payment: {
          id: params.payment_id,
          status: params.amount_cents === 0 ? 'refunded' : 'partially_refunded',
          refunded_amount_cents: params.amount_cents,
          refunded_at: new Date().toISOString(),
        } as Payment,
      };
    } else {
      return {
        success: false,
        error: 'Échec du remboursement - Fonds insuffisants',
        error_code: 'REFUND_FAILED',
      };
    }
  }

  /**
   * Libérer l'escrow (transférer au prestataire)
   */
  async releaseEscrow(paymentId: string): Promise<PaymentResult> {
    this.log('info', 'Releasing escrow', { payment_id: paymentId });

    await this.delay(1000);

    const transferId = this.generateTransactionId('MOCK_TRANSFER');

    this.log('info', 'Escrow released', {
      payment_id: paymentId,
      transfer_id: transferId,
    });

    return {
      success: true,
      transaction_id: transferId,
      payment: {
        id: paymentId,
        escrow_status: 'released',
        escrow_released_at: new Date().toISOString(),
      } as Payment,
    };
  }

  /**
   * Vérifier 3D Secure
   */
  async verify3DSecure(
    paymentId: string,
    verificationData: any
  ): Promise<PaymentResult> {
    this.log('info', 'Verifying 3D Secure', { payment_id: paymentId });

    await this.delay(1500);

    // Simuler succès (95%)
    if (Math.random() < 0.95) {
      this.log('info', '3D Secure verification succeeded');

      return {
        success: true,
        payment: {
          id: paymentId,
          status: 'succeeded',
          requires_3d_secure: true,
          is_3d_secure_completed: true,
          succeeded_at: new Date().toISOString(),
        } as Payment,
      };
    } else {
      return {
        success: false,
        error: 'Échec de la vérification 3D Secure',
        error_code: '3DS_FAILED',
      };
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Créer les détails d'affichage (non-sensibles)
   */
  private createDisplayDetails(params: CreatePaymentParams): PaymentDisplayDetails {
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
          paypal_payer_id: 'MOCK_PAYER_' + Math.random().toString(36).substring(2, 9),
        };

      case 'bank_transfer':
        return {
          method: 'bank_transfer',
          bank_name: 'Banque Simulée',
          bank_account_last4: payment_details.bank_iban?.slice(-4) || '0000',
          bank_reference: this.generateTransactionId('MOCK_BANK'),
        };

      default:
        return { method: payment_method };
    }
  }

  /**
   * Détecter la marque de carte
   */
  private detectCardBrand(cardNumber: string): PaymentDisplayDetails['card_brand'] {
    const cleaned = cardNumber.replace(/\s/g, '');
    const firstDigit = cleaned[0];
    const firstTwo = cleaned.substring(0, 2);

    if (firstDigit === '4') return 'visa';
    if (parseInt(firstTwo) >= 51 && parseInt(firstTwo) <= 55) return 'mastercard';
    if (firstTwo === '34' || firstTwo === '37') return 'amex';
    if (firstTwo === '60' || firstTwo === '65') return 'discover';

    return 'visa'; // Défaut
  }

  /**
   * Générer URL 3D Secure simulée
   */
  private generate3DSUrl(orderId: string): string {
    // Dans un vrai système, ce serait l'URL du provider (Stripe, etc.)
    return `/api/payments/3ds/verify?order_id=${orderId}`;
  }

  /**
   * Délai simulé
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Simuler webhook (à appeler manuellement dans les tests)
   */
  async simulateWebhook(
    paymentId: string,
    eventType: string
  ): Promise<{ success: boolean; webhook_id: string }> {
    const webhookId = this.generateTransactionId('MOCK_WEBHOOK');

    this.log('info', 'Webhook received', {
      payment_id: paymentId,
      event_type: eventType,
      webhook_id: webhookId,
    });

    // Simulation du traitement
    await this.delay(200);

    return {
      success: true,
      webhook_id: webhookId,
    };
  }
}