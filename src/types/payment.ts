// ============================================================================
// TYPES & INTERFACES - SYSTÈME DE PAIEMENT SÉCURISÉ
// ============================================================================

/**
 * Statuts de paiement
 */
export type PaymentStatus =
  | 'pending'           // En attente d'initialisation
  | 'processing'        // En cours de traitement
  | 'requires_action'   // Nécessite action (3D Secure, etc.)
  | 'succeeded'         // Paiement réussi
  | 'failed'            // Paiement échoué
  | 'cancelled'         // Annulé par l'utilisateur
  | 'refunded'          // Remboursé
  | 'partially_refunded'// Partiellement remboursé
  | 'disputed'          // Contesté (chargeback)
  | 'escrowed';         // En escrow (retenu)

/**
 * Méthodes de paiement supportées
 */
export type PaymentMethod = 'card' | 'paypal' | 'bank_transfer' | 'wallet';

/**
 * Providers de paiement (strategy pattern)
 */
export type PaymentProviderType = 'mock' | 'stripe' | 'paypal';

/**
 * Interface principale d'un paiement
 */
export interface Payment {
  id: string;
  order_id: string;
  client_id: string;
  provider_id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_provider: PaymentProviderType;

  // Identifiants externes (Stripe, PayPal, etc.)
  external_payment_id?: string;
  external_customer_id?: string;

  // Escrow (rétention d'argent)
  escrow_status: 'held' | 'released' | 'refunded';
  escrow_released_at?: string;

  // Sécurité & Vérification
  requires_3d_secure: boolean;
  is_3d_secure_completed: boolean;
  risk_score?: number; // 0-100 (100 = très risqué)

  // Metadata sécurisées (chiffrées)
  encrypted_payment_details?: string;
  payment_details_iv?: string; // Initialization Vector pour déchiffrement

  // Détails publics (affichage)
  display_details?: PaymentDisplayDetails;

  // Remboursements
  refunded_amount_cents: number;
  refund_reason?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  succeeded_at?: string;
  failed_at?: string;
  refunded_at?: string;

  // Relations
  refunds?: PaymentRefund[];
  webhooks?: PaymentWebhook[];
}

/**
 * Détails d'affichage (non-sensibles)
 */
export interface PaymentDisplayDetails {
  method: PaymentMethod;

  // Pour carte
  card_brand?: 'visa' | 'mastercard' | 'amex' | 'discover';
  card_last4?: string;
  card_exp_month?: string;
  card_exp_year?: string;
  card_holder_name?: string;

  // Pour PayPal
  paypal_email?: string;
  paypal_payer_id?: string;

  // Pour virement
  bank_name?: string;
  bank_account_last4?: string;
  bank_reference?: string;
}

/**
 * Détails sensibles de paiement (à chiffrer)
 */
export interface SensitivePaymentDetails {
  // Carte bancaire
  card_number?: string;
  card_cvv?: string;
  card_exp_month?: string;
  card_exp_year?: string;
  card_holder_name?: string;

  // PayPal
  paypal_email?: string;
  paypal_access_token?: string;

  // Virement bancaire
  bank_iban?: string;
  bank_bic?: string;
  bank_account_number?: string;

  // Métadonnées
  ip_address?: string;
  user_agent?: string;
  billing_address?: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
}

/**
 * Résultat d'un processus de paiement
 */
export interface PaymentResult {
  success: boolean;
  payment?: Payment;
  error?: string;
  error_code?: string;

  // Pour 3D Secure
  requires_action?: boolean;
  action_url?: string;
  action_type?: '3d_secure' | 'redirect' | 'verify_code';

  // Transaction ID du provider
  transaction_id?: string;
}

/**
 * Remboursement de paiement
 */
export interface PaymentRefund {
  id: string;
  payment_id: string;
  order_id: string;
  amount_cents: number;
  reason: RefundReason;
  description?: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  external_refund_id?: string; // ID Stripe/PayPal
  initiated_by: string; // user_id (admin, client, auto)
  created_at: string;
  completed_at?: string;
  failed_reason?: string;
}

export type RefundReason =
  | 'customer_request'      // Demande du client
  | 'order_cancelled'       // Commande annulée
  | 'service_not_delivered' // Service non livré
  | 'dispute_resolved'      // Litige résolu en faveur client
  | 'duplicate_payment'     // Paiement en double
  | 'fraud'                 // Fraude détectée
  | 'other';                // Autre raison

/**
 * Webhook de paiement (événements asynchrones)
 */
export interface PaymentWebhook {
  id: string;
  payment_id: string;
  event_type: PaymentWebhookEvent;
  provider: PaymentProviderType;
  external_event_id?: string;
  payload: any; // Payload brut du webhook
  processed: boolean;
  processed_at?: string;
  error?: string;
  created_at: string;
}

export type PaymentWebhookEvent =
  | 'payment.created'
  | 'payment.processing'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.disputed'
  | 'payment.3ds_required'
  | 'payment.3ds_completed'
  | 'refund.created'
  | 'refund.succeeded'
  | 'refund.failed';

/**
 * Configuration d'escrow
 */
export interface EscrowConfig {
  enabled: boolean;
  auto_release_days?: number; // Libération auto après N jours si pas d'action
  require_client_approval: boolean; // Nécessite approbation client
  platform_fee_percentage: number; // Frais plateforme (ex: 5%)
}

/**
 * Facture PDF
 */
export interface Invoice {
  id: string;
  order_id: string;
  payment_id: string;
  invoice_number: string; // Format: INV-2025-00001
  issue_date: string;
  due_date?: string;

  // Parties
  client_id: string;
  provider_id: string;

  // Montants
  subtotal_cents: number;
  tax_cents: number;
  fees_cents: number;
  total_cents: number;

  // PDF
  pdf_url?: string;
  pdf_generated: boolean;

  // Statut
  status: 'draft' | 'issued' | 'paid' | 'cancelled';

  created_at: string;
  updated_at: string;
}

/**
 * Interface provider de paiement (Strategy Pattern)
 */
export interface IPaymentProvider {
  /**
   * Nom du provider
   */
  name: PaymentProviderType;

  /**
   * Créer un paiement
   */
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;

  /**
   * Vérifier le statut d'un paiement
   */
  checkPaymentStatus(paymentId: string): Promise<PaymentResult>;

  /**
   * Rembourser un paiement
   */
  refundPayment(params: RefundPaymentParams): Promise<PaymentResult>;

  /**
   * Libérer l'escrow (transférer au prestataire)
   */
  releaseEscrow(paymentId: string): Promise<PaymentResult>;

  /**
   * Vérifier 3D Secure
   */
  verify3DSecure(paymentId: string, verificationData: any): Promise<PaymentResult>;
}

/**
 * Paramètres de création de paiement
 */
export interface CreatePaymentParams {
  order_id: string;
  client_id: string;
  provider_id: string;
  amount_cents: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_details: SensitivePaymentDetails;
  metadata?: Record<string, any>;

  // Escrow
  use_escrow?: boolean;

  // 3D Secure
  require_3d_secure?: boolean;
  return_url?: string; // URL de retour après 3DS
}

/**
 * Paramètres de remboursement
 */
export interface RefundPaymentParams {
  payment_id: string;
  amount_cents: number; // Montant à rembourser (peut être partiel)
  reason: RefundReason;
  description?: string;
  initiated_by: string; // user_id
}

/**
 * Configuration du service de paiement
 */
export interface PaymentServiceConfig {
  provider: PaymentProviderType;
  escrow: EscrowConfig;

  // Stripe config (optionnel)
  stripe?: {
    secret_key: string;
    publishable_key: string;
    webhook_secret: string;
  };

  // PayPal config (optionnel)
  paypal?: {
    client_id: string;
    client_secret: string;
    mode: 'sandbox' | 'production';
  };

  // Sécurité
  encryption_key: string; // Clé de chiffrement AES-256
}