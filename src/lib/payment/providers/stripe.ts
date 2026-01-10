// ============================================================================
// STRIPE PAYMENT PROVIDER - Prêt pour implémentation
// ============================================================================

import type {
  PaymentProviderType,
  CreatePaymentParams,
  RefundPaymentParams,
  PaymentResult,
} from '@/types/payment';
import { BasePaymentProvider } from './base';

/**
 * Provider Stripe (à implémenter)
 *
 * Pour activer :
 * 1. npm install stripe
 * 2. Ajouter variables d'environnement :
 *    - STRIPE_SECRET_KEY
 *    - STRIPE_PUBLISHABLE_KEY
 *    - STRIPE_WEBHOOK_SECRET
 * 3. Implémenter les méthodes ci-dessous
 */
export class StripePaymentProvider extends BasePaymentProvider {
  name: PaymentProviderType = 'stripe';

  // private stripe: Stripe;

  constructor(secretKey: string) {
    super();
    // this.stripe = new Stripe(secretKey, { apiVersion: '2024-11-20.acacia' });
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    // TODO: Implémenter avec Stripe API
    //
    // Exemple:
    // const paymentIntent = await this.stripe.paymentIntents.create({
    //   amount: params.amount_cents,
    //   currency: params.currency,
    //   payment_method_types: ['card'],
    //   metadata: {
    //     order_id: params.order_id,
    //     client_id: params.client_id,
    //   },
    // });

    throw new Error('Stripe provider not implemented yet');
  }

  async checkPaymentStatus(paymentId: string): Promise<PaymentResult> {
    // TODO: Implémenter avec Stripe API
    throw new Error('Stripe provider not implemented yet');
  }

  async refundPayment(params: RefundPaymentParams): Promise<PaymentResult> {
    // TODO: Implémenter avec Stripe API
    throw new Error('Stripe provider not implemented yet');
  }

  async releaseEscrow(paymentId: string): Promise<PaymentResult> {
    // TODO: Implémenter avec Stripe Connect Transfer API
    throw new Error('Stripe provider not implemented yet');
  }

  async verify3DSecure(paymentId: string, verificationData: any): Promise<PaymentResult> {
    // TODO: Implémenter avec Stripe 3D Secure
    throw new Error('Stripe provider not implemented yet');
  }
}