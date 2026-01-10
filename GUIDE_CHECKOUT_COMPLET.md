# 🛒 Guide Complet - Système de Checkout & Paiement

## ✅ Ce Qui Est Déjà Fait

1. ✅ **Tables SQL** créées dans `supabase/schema_orders_v2.sql`
2. ✅ **Types TypeScript** créés dans `src/types/order.ts`
3. ✅ Types exportés dans `src/types/index.ts`

---

## 📋 Fichiers à Créer

### **ÉTAPE 1: APIs Backend**

#### 1. `/api/orders/create/route.ts`

```typescript
// ============================================================================
// API: Create Order with Items
// Route: POST /api/orders/create
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { CreateOrderDTO } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body: CreateOrderDTO = await request.json();

    // 1. Vérifier auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Valider les données
    if (!body.provider_id || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Données invalides' },
        { status: 400 }
      );
    }

    // 3. Calculer le total
    const totalCents = body.items.reduce((sum, item) => {
      const itemTotal = item.unit_price_cents * item.quantity;
      const extrasTotal = item.selected_extras.reduce(
        (extraSum, extra) => extraSum + extra.price_cents,
        0
      );
      return sum + itemTotal + extrasTotal;
    }, 0);

    // 4. Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        client_id: user.id,
        provider_id: body.provider_id,
        total_cents: totalCents,
        currency: 'EUR',
        status: 'pending',
        payment_status: 'pending',
        message: body.message || null,
        delivery_deadline: body.delivery_deadline || null,
        metadata: {
          created_via: 'web',
          items_count: body.items.length,
        },
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Erreur création commande' },
        { status: 500 }
      );
    }

    // 5. Créer les order_items
    const orderItems = body.items.map((item) => ({
      order_id: order.id,
      service_id: item.service_id,
      title: item.title,
      unit_price_cents: item.unit_price_cents,
      quantity: item.quantity,
      subtotal_cents:
        item.unit_price_cents * item.quantity +
        item.selected_extras.reduce((sum, e) => sum + e.price_cents, 0),
      selected_extras: item.selected_extras,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      // Rollback: supprimer la commande
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { success: false, error: 'Erreur création items' },
        { status: 500 }
      );
    }

    // 6. Recharger la commande avec les items
    const { data: fullOrder } = await supabase
      .from('orders')
      .select(`
        *,
        client:profiles!orders_client_id_fkey(user_id, username, avatar_url),
        provider:profiles!orders_provider_id_fkey(user_id, company_name, avatar_url),
        order_items(*)
      `)
      .eq('id', order.id)
      .single();

    return NextResponse.json({
      success: true,
      data: { order: fullOrder || order },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

#### 2. `/api/orders/update-status/route.ts`

```typescript
// ============================================================================
// API: Update Order Status
// Route: PATCH /api/orders/update-status
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { UpdateOrderStatusDTO } from '@/types';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body: UpdateOrderStatusDTO = await request.json();

    // 1. Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérifier que l'order existe et appartient à l'user
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', body.order_id)
      .single();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // 3. Vérifier permissions
    const isClient = order.client_id === user.id;
    const isProvider = order.provider_id === user.id;

    if (!isClient && !isProvider) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // 4. Préparer l'update
    const updateData: any = {};

    if (body.status) updateData.status = body.status;
    if (body.payment_status) updateData.payment_status = body.payment_status;
    if (body.payment_intent_id) updateData.payment_intent_id = body.payment_intent_id;

    // Si payment succeeded, mettre à jour status
    if (body.payment_status === 'succeeded') {
      updateData.status = 'paid';
    }

    // Si order completed
    if (body.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Merger metadata
    if (body.metadata) {
      updateData.metadata = {
        ...order.metadata,
        ...body.metadata,
      };
    }

    // 5. Update
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', body.order_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Erreur update' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { order: updatedOrder },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

#### 3. `/api/services/[id]/route.ts` (vérifier si existe)

Si n'existe pas, créer:

```typescript
// ============================================================================
// API: Get Service by ID
// Route: GET /api/services/[id]
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: service, error } = await supabase
      .from('services')
      .select(`
        *,
        provider:providers(*)
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error || !service) {
      return NextResponse.json(
        { success: false, error: 'Service introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { service },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

---

### **ÉTAPE 2: Composants Checkout**

#### 1. `components/checkout/CheckoutSummary.tsx`

```typescript
'use client';

import { Service, SelectedExtra } from '@/types';
import { DollarSign, Clock, Package } from 'lucide-react';

interface CheckoutSummaryProps {
  service: Service;
  selectedExtras: SelectedExtra[];
  quantity: number;
}

export function CheckoutSummary({
  service,
  selectedExtras,
  quantity,
}: CheckoutSummaryProps) {
  const basePrice = service.base_price_cents / 100;
  const extrasTotal =
    selectedExtras.reduce((sum, extra) => sum + extra.price_cents, 0) / 100;
  const subtotal = (basePrice + extrasTotal) * quantity;
  const fees = subtotal * 0.05; // 5% frais plateforme
  const total = subtotal + fees;

  const totalDeliveryDays =
    (service.delivery_time_days || 7) +
    selectedExtras.reduce((sum, e) => sum + (e.delivery_time_days || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <h3 className="text-xl font-bold text-slate-900">Résumé de commande</h3>

      {/* Service */}
      <div className="flex gap-4">
        {service.images?.[0] && (
          <img
            src={service.images[0]}
            alt={service.title.fr || service.title.en}
            className="w-20 h-20 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">
            {service.title.fr || service.title.en}
          </h4>
          <p className="text-sm text-slate-600">
            Quantité: {quantity}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900">
            {basePrice.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Extras */}
      {selectedExtras.length > 0 && (
        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-semibold text-slate-700">Options:</p>
          {selectedExtras.map((extra) => (
            <div key={extra.id} className="flex justify-between text-sm">
              <span className="text-slate-600">
                {typeof extra.name === 'object' ? extra.name.fr : extra.name}
              </span>
              <span className="text-slate-900 font-medium">
                +{(extra.price_cents / 100).toFixed(2)} €
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Totaux */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Sous-total</span>
          <span className="text-slate-900">{subtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Frais de service (5%)</span>
          <span className="text-slate-900">{fees.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span className="text-slate-900">Total</span>
          <span className="text-purple-600">{total.toFixed(2)} €</span>
        </div>
      </div>

      {/* Infos délai */}
      <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
        <Clock className="w-4 h-4" />
        <span>Livraison estimée: {totalDeliveryDays} jours</span>
      </div>
    </div>
  );
}
```

#### 2. `components/checkout/CheckoutExtrasSelector.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { SelectedExtra } from '@/types';

interface Extra {
  id: string;
  name: string | Record<string, string>;
  description?: string | Record<string, string>;
  price_cents: number;
  delivery_time_days?: number;
}

interface CheckoutExtrasSelectorProps {
  extras: Extra[];
  selected: SelectedExtra[];
  onChange: (selected: SelectedExtra[]) => void;
}

export function CheckoutExtrasSelector({
  extras,
  selected,
  onChange,
}: CheckoutExtrasSelectorProps) {
  const isSelected = (extraId: string) => {
    return selected.some((e) => e.id === extraId);
  };

  const toggleExtra = (extra: Extra) => {
    if (isSelected(extra.id)) {
      onChange(selected.filter((e) => e.id !== extra.id));
    } else {
      onChange([
        ...selected,
        {
          id: extra.id,
          name: extra.name,
          price_cents: extra.price_cents,
          delivery_time_days: extra.delivery_time_days,
        },
      ]);
    }
  };

  if (!extras || extras.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <h3 className="text-lg font-bold text-slate-900">Options supplémentaires</h3>

      <div className="space-y-3">
        {extras.map((extra) => {
          const selected = isSelected(extra.id);
          const name = typeof extra.name === 'object' ? extra.name.fr : extra.name;
          const desc =
            extra.description && typeof extra.description === 'object'
              ? extra.description.fr
              : extra.description;

          return (
            <button
              key={extra.id}
              onClick={() => toggleExtra(extra)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-purple-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 ${
                    selected
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-slate-300'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">{name}</h4>
                    <span className="font-bold text-purple-600">
                      +{(extra.price_cents / 100).toFixed(2)} €
                    </span>
                  </div>
                  {desc && (
                    <p className="text-sm text-slate-600 mt-1">{desc}</p>
                  )}
                  {extra.delivery_time_days && (
                    <p className="text-xs text-slate-500 mt-1">
                      +{extra.delivery_time_days} jours de délai
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

#### 3. `components/checkout/CheckoutMessageBox.tsx`

```typescript
'use client';

interface CheckoutMessageBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CheckoutMessageBox({ value, onChange }: CheckoutMessageBoxProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <h3 className="text-lg font-bold text-slate-900">
        Message au prestataire
      </h3>
      <p className="text-sm text-slate-600">
        Décrivez vos besoins spécifiques, vos attentes, ou posez vos questions.
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: Je souhaite un logo moderne avec des couleurs vives..."
        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        rows={5}
      />

      <p className="text-xs text-slate-500">
        {value.length} / 1000 caractères
      </p>
    </div>
  );
}
```

#### 4. `components/checkout/FakePaymentModal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { X, CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface FakePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
  onFailure: () => void;
}

export function FakePaymentModal({
  isOpen,
  onClose,
  amount,
  onSuccess,
  onFailure,
}: FakePaymentModalProps) {
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async (success: boolean) => {
    setProcessing(true);

    // Simuler délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setProcessing(false);

    if (success) {
      onSuccess();
    } else {
      onFailure();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Paiement Test
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Montant */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl text-center">
          <p className="text-sm text-slate-600 mb-2">Montant à payer</p>
          <p className="text-4xl font-bold text-purple-600">
            {amount.toFixed(2)} €
          </p>
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Mode Test:</strong> Choisissez le résultat du paiement ci-dessous.
            Aucun paiement réel ne sera effectué.
          </p>
        </div>

        {/* Boutons */}
        {processing ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-3 text-slate-600">Traitement en cours...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => handlePayment(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              Simuler Paiement Réussi
            </button>

            <button
              onClick={() => handlePayment(false)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-rose-700 transition-all"
            >
              <XCircle className="w-5 h-5" />
              Simuler Paiement Échoué
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📄 **SUITE DANS LE PROCHAIN MESSAGE**

J'ai créé la première partie. Voulez-vous que je continue avec:
- ✅ Page `/checkout/page.tsx` complète
- ✅ Page `/order-success/page.tsx`
- ✅ Instructions de test complètes

**Dites-moi si je continue !** 🚀
