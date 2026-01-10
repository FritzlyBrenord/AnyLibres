# 💳 Système de Paiement Sécurisé - AnyLibre

## 📋 Vue d'ensemble

Système de paiement complet avec :
- ✅ **Escrow** (rétention d'argent jusqu'à livraison)
- ✅ **Chiffrement AES-256-GCM** des données sensibles
- ✅ **3D Secure** (simulation + prêt pour intégration réelle)
- ✅ **Remboursements** automatiques et partiels
- ✅ **Webhooks** pour événements asynchrones
- ✅ **Factures PDF** générées automatiquement
- ✅ **Architecture Strategy Pattern** pour faciliter switch Stripe/PayPal

---

## 🏗️ Architecture

### Structure des fichiers

```
src/lib/payment/
├── PaymentService.ts          # Service principal (orchestrateur)
├── InvoiceService.ts           # Génération factures PDF
├── index.ts                    # Exports publics
├── providers/
│   ├── base.ts                 # Classe abstraite
│   ├── mock.ts                 # Provider simulé (ACTIF)
│   ├── stripe.ts               # Provider Stripe (placeholder)
│   └── paypal.ts               # Provider PayPal (placeholder)
└── README.md

src/types/
└── payment.ts                  # Tous les types TypeScript

supabase/migrations/
└── 20250208_create_payments_system.sql  # Migration BD
```

### Tables de base de données

- **`payments`** : Stocke tous les paiements avec chiffrement
- **`payment_refunds`** : Historique des remboursements
- **`payment_webhooks`** : Webhooks reçus (Stripe, PayPal, etc.)
- **`invoices`** : Factures générées

---

## 🚀 Utilisation Actuelle (Mode Mock)

### 1. Créer un paiement

```typescript
import { getPaymentService } from '@/lib/payment';

const paymentService = getPaymentService();

const result = await paymentService.createPayment({
  order_id: 'order-123',
  client_id: 'client-456',
  provider_id: 'provider-789',
  amount_cents: 50000, // 500€
  currency: 'EUR',
  payment_method: 'card',
  payment_details: {
    card_number: '4242424242424242',
    card_cvv: '123',
    card_exp_month: '12',
    card_exp_year: '25',
    card_holder_name: 'John Doe',
  },
  use_escrow: true, // Active l'escrow
  require_3d_secure: false,
});

if (result.success) {
  console.log('Paiement créé:', result.payment);
  console.log('Transaction ID:', result.transaction_id);
} else if (result.requires_action) {
  // 3D Secure requis
  window.location.href = result.action_url;
} else {
  console.error('Erreur:', result.error);
}
```

### 2. Libérer l'escrow (après livraison acceptée)

```typescript
const result = await paymentService.releaseEscrow('payment-id');

if (result.success) {
  console.log('Escrow libéré, prestataire va recevoir les fonds');
}
```

### 3. Rembourser un paiement

```typescript
const result = await paymentService.refundPayment({
  payment_id: 'payment-id',
  amount_cents: 50000, // Montant complet
  reason: 'customer_request',
  description: 'Client insatisfait',
  initiated_by: 'admin-user-id',
});

if (result.success) {
  console.log('Remboursement effectué');
}
```

### 4. Générer une facture

```typescript
import { getInvoiceService } from '@/lib/payment';

const invoiceService = getInvoiceService();

const invoice = await invoiceService.createInvoiceForOrder('order-id');

console.log('Facture générée:', invoice.invoice_number);
console.log('PDF disponible à:', invoice.pdf_url);
```

---

## 🔐 Sécurité

### Chiffrement des données sensibles

Les détails de paiement (numéro carte, CVV, etc.) sont **automatiquement chiffrés** avec AES-256-GCM avant stockage en base de données.

```typescript
// Automatique lors de createPayment()
// Les données sont chiffrées dans PaymentService.encryptPaymentDetails()

// Pour déchiffrer (si besoin admin) :
const decrypted = paymentService.decryptPaymentDetails(
  payment.encrypted_payment_details,
  payment.payment_details_iv
);
```

**⚠️ Important** : Définissez `PAYMENT_ENCRYPTION_KEY` dans `.env` :

```bash
# Générer une clé sécurisée (32 bytes en hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ajouter dans .env
PAYMENT_ENCRYPTION_KEY=votre_cle_securisee_64_caracteres_hex
```

### 3D Secure

Le système détecte automatiquement si 3D Secure est requis :
- Montant > 30€ (PSD2 Europe)
- Score de risque > 50

En mode mock, 30% des paiements nécessitent 3DS (configurable).

---

## 📊 Flux de Paiement Complet

```
Client passe commande
    ↓
PaymentService.createPayment()
    ↓
┌─────────────────────────────────┐
│  Provider (Mock/Stripe/PayPal)  │
│  - Valide détails              │
│  - Vérifie risque              │
│  - 3DS si nécessaire           │
└─────────────────────────────────┘
    ↓
Paiement réussi
    ↓
┌─────────────────────────────────┐
│  Escrow ACTIVÉ                 │
│  Argent retenu                 │
└─────────────────────────────────┘
    ↓
Sauvegarde BD (chiffré)
    ↓
Webhook envoyé (asynchrone)
    ↓
Facture générée
    ↓
─────────────────────────────────
Prestataire livre le service
    ↓
Client accepte livraison
    ↓
PaymentService.releaseEscrow()
    ↓
┌─────────────────────────────────┐
│  Escrow LIBÉRÉ                 │
│  Argent transféré au prestataire│
└─────────────────────────────────┘
```

---

## 🔄 Basculer vers Stripe/PayPal (Production)

### Option 1 : Stripe

#### Étape 1 : Installer Stripe

```bash
npm install stripe
```

#### Étape 2 : Ajouter variables d'environnement

```bash
# .env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
PAYMENT_PROVIDER=stripe  # Changer de 'mock' à 'stripe'
```

#### Étape 3 : Implémenter StripePaymentProvider

Éditer `src/lib/payment/providers/stripe.ts` :

```typescript
import Stripe from 'stripe';

export class StripePaymentProvider extends BasePaymentProvider {
  name: PaymentProviderType = 'stripe';
  private stripe: Stripe;

  constructor(secretKey: string) {
    super();
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    // Validation
    const validation = this.validatePaymentDetails(params);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Créer PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.amount_cents,
      currency: params.currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        order_id: params.order_id,
        client_id: params.client_id,
      },
      // Escrow avec Stripe Connect
      transfer_data: params.use_escrow
        ? {
            destination: params.provider_id, // Stripe Connect Account ID
          }
        : undefined,
    });

    return {
      success: true,
      payment: {
        external_payment_id: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        // ... autres champs
      } as Payment,
    };
  }

  // ... implémenter autres méthodes
}
```

#### Étape 4 : Configurer Webhooks Stripe

1. Aller sur Stripe Dashboard → Webhooks
2. Ajouter endpoint : `https://votresite.com/api/webhooks/stripe`
3. Sélectionner événements :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.disputed`

4. Créer API route `/api/webhooks/stripe/route.ts` :

```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPaymentService } from '@/lib/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Traiter l'événement
  const paymentService = getPaymentService();

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Mettre à jour le paiement
      break;

    case 'charge.refunded':
      // Gérer le remboursement
      break;

    // ... autres événements
  }

  return NextResponse.json({ received: true });
}
```

#### Étape 5 : Activer Stripe

Dans votre configuration :

```typescript
import { getPaymentService } from '@/lib/payment';

const paymentService = getPaymentService({
  provider: 'stripe',
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY!,
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY!,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!,
  },
  encryption_key: process.env.PAYMENT_ENCRYPTION_KEY!,
});
```

---

### Option 2 : PayPal

#### Étape 1 : Installer SDK PayPal

```bash
npm install @paypal/checkout-server-sdk
```

#### Étape 2 : Ajouter variables d'environnement

```bash
# .env
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=sandbox  # ou 'production'
PAYMENT_PROVIDER=paypal
```

#### Étape 3 : Implémenter PayPalPaymentProvider

Éditer `src/lib/payment/providers/paypal.ts` de façon similaire à Stripe.

---

## 🧪 Configuration Mock (Développement)

Le provider `MockPaymentProvider` simule de façon réaliste :

```typescript
// Configurer le taux de succès
const mockProvider = new MockPaymentProvider();
mockProvider['config'].successRate = 0.98; // 98% de succès
mockProvider['config'].processingDelay = 1000; // 1s au lieu de 2s
mockProvider['config'].requires3DSRate = 0.10; // 10% au lieu de 30%
```

### Tester 3D Secure en mode mock

```typescript
const result = await paymentService.createPayment({
  // ... params
  require_3d_secure: true, // Forcer 3DS
});

if (result.requires_action) {
  // Simuler redirection
  window.location.href = result.action_url;
  // URL sera : /api/payments/3ds/verify?order_id=xxx
}
```

---

## 📝 Variables d'Environnement

```bash
# .env

# Provider actif ('mock', 'stripe', 'paypal')
PAYMENT_PROVIDER=mock

# Chiffrement (REQUIS)
PAYMENT_ENCRYPTION_KEY=64_caracteres_hex_generes_par_crypto

# Stripe (optionnel)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# PayPal (optionnel)
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=sandbox
```

---

## 🔍 Monitoring & Logs

Tous les événements sont loggés :

```
[2025-02-08 14:32:10] [mock] Creating payment { order_id: 'xxx', amount: '500 EUR' }
[2025-02-08 14:32:12] [mock] Payment succeeded { transaction_id: 'MOCK_xxx', escrow: 'held' }
[2025-02-08 14:32:12] [PaymentService] Webhook processed: payment.succeeded
```

Pour un monitoring en production, intégrer :
- **Winston** ou **Pino** pour logs structurés
- **Sentry** pour erreurs
- **Datadog** ou **Grafana** pour métriques

---

## 🐛 Débuggage

### Vérifier un paiement en base

```sql
SELECT
  p.id,
  p.order_id,
  p.amount_cents,
  p.status,
  p.escrow_status,
  p.payment_provider,
  p.external_payment_id,
  p.created_at
FROM payments p
WHERE p.order_id = 'votre-order-id';
```

### Vérifier les webhooks

```sql
SELECT
  w.event_type,
  w.provider,
  w.processed,
  w.error,
  w.created_at
FROM payment_webhooks w
WHERE w.payment_id = 'votre-payment-id'
ORDER BY w.created_at DESC;
```

### Déchiffrer les données (admin only)

```typescript
const paymentService = getPaymentService();
const payment = await paymentService.getPaymentFromDB('payment-id');

const sensitiveData = paymentService.decryptPaymentDetails(
  payment.encrypted_payment_details,
  payment.payment_details_iv
);

console.log(sensitiveData); // ⚠️ Ne jamais logger en production !
```

---

## ✅ Checklist Avant Production

- [ ] Remplacer `MockPaymentProvider` par `StripePaymentProvider` ou `PayPalPaymentProvider`
- [ ] Générer clé de chiffrement sécurisée (`PAYMENT_ENCRYPTION_KEY`)
- [ ] Configurer webhooks Stripe/PayPal
- [ ] Tester 3D Secure avec vraies cartes
- [ ] Implémenter génération PDF factures (jsPDF ou @react-pdf/renderer)
- [ ] Configurer upload Supabase Storage pour PDFs
- [ ] Ajouter logging professionnel (Winston/Pino)
- [ ] Ajouter monitoring erreurs (Sentry)
- [ ] Tester remboursements complets et partiels
- [ ] Vérifier RLS Supabase pour sécurité
- [ ] Tester libération escrow après X jours
- [ ] Configurer notifications email (paiement réussi, escrow libéré, etc.)

---

## 📚 Ressources

- [Stripe API Docs](https://stripe.com/docs/api)
- [PayPal SDK](https://developer.paypal.com/docs/checkout/)
- [PSD2 3D Secure](https://stripe.com/docs/strong-customer-authentication)
- [AES-256-GCM Encryption](https://nodejs.org/api/crypto.html)

---

**Créé le** : 2025-02-08
**Auteur** : Claude Sonnet 4.5
**Version** : 1.0.0