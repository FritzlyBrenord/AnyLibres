// ============================================================================
// TYPES: Order & OrderItem
// Types pour le système de commandes
// ============================================================================

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD';
// types/order.ts - VERSION CORRECTE
// Flux recommandé :
// 1. Création → status: 'pending', payment_status: 'pending'
// 2. Paiement démarré → status: 'payment_processing', payment_status: 'processing'  
// 3. Paiement réussi → status: 'paid', payment_status: 'succeeded'
// 4. Prestataire commence → status: 'in_progress'
// 5. Livraison → status: 'delivered'
// 6. Client accepte → status: 'completed'
export type OrderStatus =
  | 'pending'           // ⏳ En attente de paiement
  | 'paid'              // ✅ Payé, en attente du prestataire
  | 'in_progress'       // 🔄 Prestataire travaille
  | 'delivery_delayed'  // ⏰ Délai prolongé demandé
  | 'delivered'         // 📦 Travail livré, en attente validation
  | 'revision_requested' // 🔄 Révision demandée
  | 'completed'         // ✅ Terminé et validé
  | 'cancelled'         // ❌ Annulé par client/prestataire
  | 'refunded'          // 💰 Remboursé
  | 'disputed';         // ⚠️ Litige ouvert

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'cancelled'
  | 'disputed';


// Labels pour l'UI
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  paid: 'Payé',
  in_progress: 'En cours',
  delivery_delayed: 'Délai prolongé',
  delivered: 'Livré',
  revision_requested: 'Révision demandée',
  completed: 'Terminé',
  cancelled: 'Annulé',
  refunded: 'Remboursé',
  disputed: 'Litige',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'En attente',
  processing: 'En traitement',
  succeeded: 'Réussi',
  failed: 'Échoué',
  refunded: 'Remboursé',
  cancelled: 'Annulé',
  disputed: 'Litige',
};

// Couleurs pour les badges
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  in_progress: 'bg-purple-100 text-purple-800',
  delivery_delayed: 'bg-amber-100 text-amber-800',
  delivered: 'bg-indigo-100 text-indigo-800',
  revision_requested: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  disputed: 'bg-rose-100 text-rose-800',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  succeeded: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  disputed: 'bg-rose-100 text-rose-800',
};


// types/order.ts
export interface Order {
  id: string;
  client_id: string;
  provider_id: string;
  total_cents: number;
  fees_cents: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  payment_method?: 'card' | 'paypal' | 'bank';
  payment_details?: any;
  payment_intent_id?: string;
  message?: string;
  delivery_deadline: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  service_id: string;
  title: string;
  unit_price_cents: number;
  quantity: number;
  subtotal_cents: number;
  selected_extras: any[];
}


export interface SelectedExtra {
  id: string;
  name: string | Record<string, string>;
  price_cents: number;
  delivery_time_days?: number;
}

// ============================================================================
// DTOs pour création/update
// ============================================================================

export interface CreateOrderDTO {
  provider_id: string;
  message?: string;
  delivery_deadline?: string;
  items: CreateOrderItemDTO[];
}

export interface CreateOrderItemDTO {
  service_id: string;
  title: string;
  unit_price_cents: number;
  quantity: number;
  selected_extras: SelectedExtra[];
}

export interface UpdateOrderStatusDTO {
  order_id: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  payment_intent_id?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Response Types pour APIs
// ============================================================================

export interface OrderResponse {
  success: boolean;
  data?: {
    order: Order;
  };
  error?: string;
}

export interface OrdersListResponse {
  success: boolean;
  data?: {
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
}

// ============================================================================
// TYPES: Order Deliveries (Livrables)
// ============================================================================

export interface OrderDelivery {
  id: string;
  order_id: string;
  delivery_number: number;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null; // MIME type
  file_size_bytes: number | null;
  external_link: string | null;
  message: string | null;
  delivered_at: string;
}

export interface CreateOrderDeliveryDTO {
  order_id: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size_bytes?: number;
  external_link?: string;
  message?: string;
}

// ============================================================================
// TYPES: Order Revisions (Révisions)
// ============================================================================

export type RevisionStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface OrderRevision {
  id: string;
  order_id: string;
  delivery_id: string | null;
  revision_number: number;
  requested_by: string;
  reason: string;
  details: string | null;
  status: RevisionStatus;
  requested_at: string;
  completed_at: string | null;
}

export interface CreateOrderRevisionDTO {
  order_id: string;
  delivery_id?: string;
  reason: string;
  details?: string;
}

// ============================================================================
// TYPES: Delivery Extensions (Extensions de délai)
// ============================================================================

export type DeliveryExtensionStatus = 'pending' | 'approved' | 'rejected';

export interface DeliveryExtension {
  id: string;
  order_id: string;
  requested_by: string; // provider_id
  reason: string;
  details: string | null;
  original_deadline: string;
  new_deadline: string;
  days_extended: number;
  status: DeliveryExtensionStatus;
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null; // client_id
}

export interface CreateDeliveryExtensionDTO {
  order_id: string;
  reason: string;
  details?: string;
  new_deadline: string;
}

// ============================================================================
// Extended Order avec relations
// ============================================================================

export interface OrderWithDeliveries extends Order {
  order_deliveries?: OrderDelivery[];
  order_revisions?: OrderRevision[];
  delivery_extensions?: DeliveryExtension[];
  client?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  service?: {
    id: string;
    title: { fr: string; en: string };
    cover_image?: string;
  };
  service_info?: {
    revisions_included: number;
    max_revisions: number;
  };
}

