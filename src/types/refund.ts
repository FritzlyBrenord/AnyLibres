// Types pour le système de remboursement
export type RefundStatus = 
  | 'pending'      // En attente de traitement par admin
  | 'approved'     // Approuvé par admin
  | 'rejected'     // Rejeté par admin
  | 'processing'   // En cours de traitement Stripe/PayPal
  | 'completed'    // Remboursement effectué
  | 'failed'       // Remboursement échoué
  | 'cancelled';   // Annulé

export type RefundReason =
  | 'client_request'      // Demande du client
  | 'quality_issue'       // Problème de qualité
  | 'not_delivered'       // Non livré
  | 'order_cancelled'     // Commande annulée
  | 'payment_error'       // Erreur de paiement
  | 'duplicate_payment'   // Paiement dupliqué
  | 'other';              // Autre

export type RefundMethod =
  | 'stripe'
  | 'paypal'
  | 'bank_transfer'
  | 'wallet';

export interface Refund {
  id: string;
  order_id: string;
  client_id: string;
  provider_id: string;
  amount_cents: number;
  currency: string;
  status: RefundStatus;
  reason: RefundReason;
  reason_details?: string;
  admin_notes?: string;
  refund_method?: RefundMethod;
  refund_reference?: string;
  refunded_at?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface RefundRequest {
  order_id: string;
  amount_cents: number;
  reason: RefundReason;
  reason_details?: string;
}

export interface RefundApproval {
  refund_id: string;
  approved: boolean;
  admin_notes?: string;
  refund_method?: RefundMethod;
}

export interface RefundResponse {
  success: boolean;
  message: string;
  refund?: Refund;
  error?: string;
}
