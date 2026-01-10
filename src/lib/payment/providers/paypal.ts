// ============================================================================
// PAYPAL PAYMENT PROVIDER - Prêt pour implémentation
// ============================================================================

import type {
  PaymentProviderType,
  CreatePaymentParams,
  RefundPaymentParams,
  PaymentResult,
} from '@/types/payment';
import { BasePaymentProvider } from './base';

/**
 * Provider PayPal (à implémenter)
 *
 * Pour activer :
 * 1. npm install @paypal/checkout-server-sdk
 * 2. Ajouter variables d'environnement :
 *    - PAYPAL_CLIENT_ID
 *    - PAYPAL_CLIENT_SECRET
 *    - PAYPAL_MODE (sandbox | production)
 * 3. Implémenter les méthodes ci-dessous
 */
export class PayPalPaymentProvider extends BasePaymentProvider {
  name: PaymentProviderType = 'paypal';

  // private client: PayPalHttpClient;

  constructor(clientId: string, clientSecret: string, mode: 'sandbox' | 'production') {
    super();
    // const environment = mode === 'production'
    //   ? new core.LiveEnvironment(clientId, clientSecret)
    //   : new core.SandboxEnvironment(clientId, clientSecret);
    // this.client = new core.PayPalHttpClient(environment);
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    // TODO: Implémenter avec PayPal API
    throw new Error('PayPal provider not implemented yet');
  }

  async checkPaymentStatus(paymentId: string): Promise<PaymentResult> {
    // TODO: Implémenter avec PayPal API
    throw new Error('PayPal provider not implemented yet');
  }

  async refundPayment(params: RefundPaymentParams): Promise<PaymentResult> {
    // TODO: Implémenter avec PayPal API
    throw new Error('PayPal provider not implemented yet');
  }

  async releaseEscrow(paymentId: string): Promise<PaymentResult> {
    // TODO: Implémenter avec PayPal Payouts API
    throw new Error('PayPal provider not implemented yet');
  }

  async verify3DSecure(paymentId: string, verificationData: any): Promise<PaymentResult> {
    // PayPal gère automatiquement la vérification
    throw new Error('PayPal provider not implemented yet');
  }
}