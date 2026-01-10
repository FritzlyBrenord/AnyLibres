// ============================================================================
// PAYMENT PROVIDER - INTERFACE DE BASE (Strategy Pattern)
// ============================================================================

import type {
  IPaymentProvider,
  PaymentProviderType,
  CreatePaymentParams,
  RefundPaymentParams,
  PaymentResult,
} from '@/types/payment';

/**
 * Classe abstraite de base pour tous les providers de paiement
 * Implémente le Strategy Pattern pour faciliter le switch entre providers
 */
export abstract class BasePaymentProvider implements IPaymentProvider {
  abstract name: PaymentProviderType;

  /**
   * Créer un paiement
   */
  abstract createPayment(params: CreatePaymentParams): Promise<PaymentResult>;

  /**
   * Vérifier le statut d'un paiement
   */
  abstract checkPaymentStatus(paymentId: string): Promise<PaymentResult>;

  /**
   * Rembourser un paiement
   */
  abstract refundPayment(params: RefundPaymentParams): Promise<PaymentResult>;

  /**
   * Libérer l'escrow (transférer au prestataire)
   */
  abstract releaseEscrow(paymentId: string): Promise<PaymentResult>;

  /**
   * Vérifier 3D Secure
   */
  abstract verify3DSecure(
    paymentId: string,
    verificationData: any
  ): Promise<PaymentResult>;

  /**
   * Générer un ID de transaction unique
   */
  protected generateTransactionId(prefix: string = 'TXN'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Calculer le score de risque (0-100)
   * 100 = très risqué, 0 = pas de risque
   */
  protected calculateRiskScore(params: CreatePaymentParams): number {
    let score = 0;

    // Montant élevé = plus risqué
    if (params.amount_cents > 100000) score += 20; // > 1000€
    if (params.amount_cents > 500000) score += 20; // > 5000€

    // Nouvelle méthode de paiement = plus risqué
    // (dans un vrai système, on vérifierait l'historique)
    score += 10;

    // PayPal généralement moins risqué que carte
    if (params.payment_method === 'card') score += 15;
    if (params.payment_method === 'bank_transfer') score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Déterminer si 3D Secure est requis
   */
  protected should3DSecureBeRequired(params: CreatePaymentParams): boolean {
    // En Europe (PSD2), 3DS obligatoire pour > 30€
    if (params.amount_cents > 3000) return true;

    // Ou si le risque est élevé
    const riskScore = this.calculateRiskScore(params);
    if (riskScore > 50) return true;

    return false;
  }

  /**
   * Valider les détails de paiement
   */
  protected validatePaymentDetails(params: CreatePaymentParams): {
    valid: boolean;
    error?: string;
  } {
    const { payment_method, payment_details } = params;

    switch (payment_method) {
      case 'card':
        if (!payment_details.card_number) {
          return { valid: false, error: 'Numéro de carte requis' };
        }
        if (!payment_details.card_cvv) {
          return { valid: false, error: 'CVV requis' };
        }
        if (!payment_details.card_exp_month || !payment_details.card_exp_year) {
          return { valid: false, error: 'Date d\'expiration requise' };
        }
        break;

      case 'paypal':
        if (!payment_details.paypal_email) {
          return { valid: false, error: 'Email PayPal requis' };
        }
        break;

      case 'bank_transfer':
        if (!payment_details.bank_iban && !payment_details.bank_account_number) {
          return { valid: false, error: 'IBAN ou numéro de compte requis' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Logger une opération (à implémenter avec winston/pino)
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${this.name}] ${message}`, data || '');
  }
}