// ============================================================================
// PAYMENT SYSTEM - Point d'entrée principal
// ============================================================================

export { PaymentService, getPaymentService } from './PaymentService';
export { InvoiceService, getInvoiceService } from './InvoiceService';

export { BasePaymentProvider } from './providers/base';
export { MockPaymentProvider } from './providers/mock';
export { StripePaymentProvider } from './providers/stripe';
export { PayPalPaymentProvider } from './providers/paypal';

export type {
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentProviderType,
  PaymentResult,
  CreatePaymentParams,
  RefundPaymentParams,
  PaymentRefund,
  RefundReason,
  PaymentWebhook,
  PaymentWebhookEvent,
  Invoice,
  PaymentDisplayDetails,
  SensitivePaymentDetails,
  IPaymentProvider,
  PaymentServiceConfig,
  EscrowConfig,
} from '@/types/payment';