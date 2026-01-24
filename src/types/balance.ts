// Types pour client_balance, admin_balance et transactions
export type TransactionType = 
  | 'refund'              // Remboursement
  | 'admin_donation'      // Don de l'admin
  | 'withdrawal'          // Retrait client
  | 'manual_adjustment';  // Ajustement manuel

export type TransactionStatus =
  | 'pending'       // En attente
  | 'processing'    // En traitement
  | 'completed'     // Complétée
  | 'failed'        // Échouée
  | 'cancelled';    // Annulée

export interface ClientBalance {
  id: string;
  client_id: string;
  available_cents: number;
  pending_withdrawal_cents: number;
  withdrawn_cents: number;
  total_received_cents: number;
  currency: string;
  preferred_payment_method?: string;
  payment_details?: Record<string, any>;
  last_withdrawal_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AdminBalance {
  id: string;
  admin_id: string;
  available_cents: number;
  total_donated_cents: number;
  total_refunded_cents: number;
  currency: string;
  metadata?: Record<string, any>;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  transaction_type: TransactionType;
  from_user_id?: string;
  to_user_id: string;
  amount_cents: number;
  currency: string;
  status: TransactionStatus;
  description?: string;
  related_refund_id?: string;
  related_order_id?: string;
  payment_method?: string;
  payment_reference?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ClientWithdrawalRequest {
  client_id: string;
  amount_cents: number;
  payment_method: string;
  payment_details: Record<string, any>;
}

export interface AdminDonationRequest {
  admin_id: string;
  recipient_id: string;
  recipient_type: 'client' | 'provider';
  amount_cents: number;
  reason?: string;
}
