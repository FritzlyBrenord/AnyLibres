// ============================================================================
// API: Create Order V3 - AVEC NOUVEAU SYSTÈME DE PAIEMENT SÉCURISÉ
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPaymentService } from '@/lib/payment';
import { calculatePlatformFees } from '@/lib/fees/calculateFees';
import { notificationService } from '@/lib/email/notificationService';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      serviceId,
      providerId,
      extras = [],
      message,
      paymentMethod,
      paymentDetails,
      locationType,
      requirementsAnswers,
      onSiteConfirmed,
      contactChoice
    } = body;

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (!serviceId || !providerId) {
      return NextResponse.json(
        { success: false, error: 'Service ID et Provider ID requis' },
        { status: 400 }
      );
    }

    // 2. Récupérer les infos du service avec la config des frais
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, title, base_price_cents, extras, delivery_time_days, platform_fee_config, currency')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { success: false, error: 'Service introuvable' },
        { status: 404 }
      );
    }

    // 3. Calculer le prix de base
    let itemPrice = Number(service.base_price_cents);
    let totalDeliveryDays = Number(service.delivery_time_days) || 7;
    const selectedExtras: any[] = [];

    console.log('--- DEBUG ORDER CALCULATION ---');
    console.log('Base days:', totalDeliveryDays);
    console.log('Received extras indices:', extras);

    // 4. Calculer le prix des extras (Updated to expect indices: number[])
    if (extras.length > 0 && service.extras) {
      // Validate that extras contains numbers (indices)
      const validIndices = extras.filter((idx: any) =>
        typeof idx === 'number' &&
        Number.isInteger(idx) &&
        idx >= 0 &&
        idx < service.extras.length
      );

      validIndices.forEach((index: number) => {
        const extra = service.extras[index];
        if (extra) {
          itemPrice += Number(extra.price_cents) || 0;

          // Debug extra fields
          console.log(`Extra [${index}]:`, extra.title || extra.name);
          console.log('- delivery_additional_days:', extra.delivery_additional_days);
          console.log('- delivery_time_days:', extra.delivery_time_days);

          // Use delivery_additional_days as primary source, fallback to delivery_time_days if needed
          const additionalDays = Number(extra.delivery_additional_days) || Number(extra.delivery_time_days) || 0;

          console.log('- Adding days:', additionalDays);

          totalDeliveryDays += additionalDays;

          selectedExtras.push({
            id: extra.id,
            name: extra.name,
            title: extra.title,
            price_cents: Number(extra.price_cents),
            delivery_time_days: additionalDays, // Store the effective added days
            original_index: index
          });
        }
      });
    }
    console.log('Final Total Days:', totalDeliveryDays);
    console.log('-------------------------------');


    // 5. Récupérer category_id du service pour le calcul des frais
    const { data: serviceWithCategory } = await supabase
      .from('services')
      .select('category_id')
      .eq('id', serviceId)
      .single();

    // 6. Appeler l'API de calcul des frais (prend en compte priorité: catégorie > localisation > pays > global)
    const feeCalcResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/checkout/calculate-fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: serviceId,
        subtotal_cents: itemPrice,
        categoryId: serviceWithCategory?.category_id,
        locationType: locationType,
        country: user.user_metadata?.country,
      }),
    });

    const feeCalcData = await feeCalcResponse.json();

    if (!feeCalcData.success) {
      return NextResponse.json(
        { success: false, error: 'Erreur calcul des frais: ' + feeCalcData.error },
        { status: 500 }
      );
    }

    // Utiliser les montants calculés par la nouvelle API
    const fees = feeCalcData.data.fee_cents;
    const totalAmount = feeCalcData.data.client_pays_cents; // LE CLIENT PAIE CE MONTANT
    const providerReceives = feeCalcData.data.provider_receives_cents;
    const currency = service.currency || 'EUR';

    console.log('💰 Calcul des frais:', {
      subtotal: itemPrice,
      fees: fees,
      client_pays: totalAmount,
      provider_receives: providerReceives,
      source: feeCalcData.data.fee_config.source
    });
// Avant l'insertion dans la base

// JUSTE AVANT l'insertion, AJOUTEZ :
console.log('🔴 [BUG HUNT] VALEURS ACTUELLES:', {
  // CE QUE VOUS UTILISEZ
  totalAmount: totalAmount,
  itemPrice: itemPrice,
  fees: fees,
  
  // VÉRIFIEZ les calculs
  manual_calc: itemPrice + fees,
  equals_totalAmount: totalAmount === (itemPrice + fees),
  
  // CE QUE VOUS ALLEZ INSÉRER
  will_insert_total_cents: totalAmount,
  will_insert_fees_cents: fees,
  
  // CE QUE VOUS DEVEZ INSÉRER
  should_be_total: itemPrice + fees
});

// ET AUSSI vérifiez d'où vient totalAmount :
console.log('🔴 [BUG HUNT] Source de totalAmount:', {
  from_feeCalcData: feeCalcData.data.client_pays_cents,
  feeCalcData_success: feeCalcData.success,
  api_response: feeCalcData
});
// Test de conversion
const testInsert = {
  total_cents: parseFloat(totalAmount),
  fees_cents: parseInt(fees)
};

console.log('🧪 [TEST CONVERSION]', testInsert);
    // 6. Calculer deadline de livraison
    const deliveryDeadline = new Date();
    deliveryDeadline.setDate(deliveryDeadline.getDate() + totalDeliveryDays);

    // 7. Créer la commande AVANT le paiement (status: pending)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        client_id: user.id,
        provider_id: providerId,
        total_cents: totalAmount,
        fees_cents: fees,
        currency: currency,
        status: 'pending', // En attente de paiement
        payment_status: 'pending',
        payment_method: paymentMethod,
        message: message || null,
        delivery_deadline: deliveryDeadline.toISOString(),
        metadata: {
          created_via: 'web',
          total_delivery_days: totalDeliveryDays,
          // Informations de debug avec le nouveau système
          pricing: {
            base_price_cents: Number(service.base_price_cents),
            item_price_cents: itemPrice,
            subtotal_cents: feeCalcData.data.subtotal_cents,
            fees_cents: fees,
            total_cents: totalAmount,
            provider_receives_cents: providerReceives,
            fee_config: feeCalcData.data.fee_config,
            fee_breakdown: feeCalcData.data.breakdown,
          },
          formula: `Subtotal: ${itemPrice} + Frais: ${fees} = Total: ${totalAmount}`,
          // Service Delivery Details
          location_type: locationType,
          location_details: {
            type: locationType,
            on_site_confirmed: onSiteConfirmed || false,
            contact_choice: contactChoice || null,
            confirmed_at: onSiteConfirmed ? new Date().toISOString() : null,
          },
          // Instructions et réponses du prestataire (QUESTIONS PERSONNALISÉES)
          requirements_answers: requirementsAnswers || {},
          // Informations supplémentaires du checkout
          checkout_details: {
            selected_extras_indices: extras || [],
            selected_extras: selectedExtras,
            client_message: message || null,
          },
        },
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { success: false, error: 'Erreur création commande: ' + orderError.message },
        { status: 500 }
      );
    }

    // 8. Créer l'item de commande
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        service_id: serviceId,
        title: typeof service.title === 'object' ? (service.title.fr || service.title.en) : service.title,
        unit_price_cents: service.base_price_cents,
        quantity: 1,
        subtotal_cents: itemPrice,
        fees_cents: fees,
        selected_extras: selectedExtras,
      });

    if (itemError) {
      console.error('Error creating order item:', itemError);
      // Rollback: supprimer la commande
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { success: false, error: 'Erreur création item: ' + itemError.message },
        { status: 500 }
      );
    }

    // 9. NOUVEAU: Créer le paiement via PaymentService
    const paymentService = getPaymentService();
    const paymentResult = await paymentService.createPayment({
      order_id: order.id,
      client_id: user.id,
      provider_id: providerId,
      amount_cents: totalAmount,
      currency: 'EUR',
      payment_method: paymentMethod as 'card' | 'paypal' | 'bank_transfer',
      payment_details: {
        // Carte bancaire
        card_number: paymentDetails.cardNumber,
        card_cvv: paymentDetails.cvv,
        card_exp_month: paymentDetails.expiryDate?.split('/')[0],
        card_exp_year: paymentDetails.expiryDate?.split('/')[1],
        card_holder_name: paymentDetails.cardHolder,

        // PayPal
        paypal_email: paymentDetails.paypalEmail,

        // Virement bancaire
        bank_iban: paymentDetails.bankAccount,
      },
      use_escrow: true, // Active l'escrow par défaut
      require_3d_secure: false, // Le système décide automatiquement
    });

    // 10. Gérer les différents résultats de paiement
    if (!paymentResult.success) {
      // 10a. Si 3D Secure requis
      if (paymentResult.requires_action) {
        // Mettre à jour la commande en "payment_processing"
        await supabase
          .from('orders')
          .update({
            status: 'payment_processing',
            payment_status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        return NextResponse.json({
          success: false,
          requires_3ds: true,
          action_url: paymentResult.action_url,
          transaction_id: paymentResult.transaction_id,
          order_id: order.id,
          message: 'Vérification 3D Secure requise',
        });
      }

      // 10b. Échec du paiement
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      return NextResponse.json(
        {
          success: false,
          error: paymentResult.error || 'Échec du paiement',
          error_code: paymentResult.error_code,
        },
        { status: 402 }
      );
    }

    // 11. Paiement réussi ! Mettre à jour la commande
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'succeeded',
        payment_intent_id: paymentResult.payment?.id,
        updated_at: new Date().toISOString(),
        // FORCE UPDATE of totals to override any potential DB triggers
        total_cents: totalAmount,
        fees_cents: fees,
      })
      .eq('id', order.id)
      .select()
      .single();

    console.log('✅ Paiement réussi - Commande mise à jour:', order.id);
    console.log('💰 Escrow status:', paymentResult.payment?.escrow_status);
    console.log('💾 [DB-CHECK] Montants stockés après update:', {
      wanted_total_cents: totalAmount,
      stored_total_cents: updatedOrder?.total_cents,
      wanted_fees_cents: fees,
      stored_fees_cents: updatedOrder?.fees_cents,
      match: updatedOrder?.total_cents === totalAmount,
    });

    // 12. Recharger la commande avec l'item
    const { data: fullOrder } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', order.id)
      .single();

    // 13. Envoyer les notifications email
    try {
      // Récupérer les informations du client
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name, email')
        .eq('user_id', user.id)
        .single();

      // Récupérer les informations du prestataire
      const { data: providerProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name, email')
        .eq('user_id', providerId)
        .single();

      if (clientProfile && providerProfile) {
        const clientName = clientProfile.display_name || `${clientProfile.first_name} ${clientProfile.last_name}`;
        const providerName = providerProfile.display_name || `${providerProfile.first_name} ${providerProfile.last_name}`;
        const serviceTitle = typeof service.title === 'object' ? (service.title.fr || service.title.en) : service.title;
        const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}`;

        // Email au prestataire
        await notificationService.sendNewOrderNotification(providerProfile.email, {
          orderId: order.id,
          serviceTitle,
          clientName,
          providerName,
          amount: totalAmount / 100, // Convertir centimes en unités
          orderUrl,
        });

        // Email au client
        await notificationService.sendOrderConfirmationToClient(clientProfile.email, {
          orderId: order.id,
          serviceTitle,
          clientName,
          providerName,
          amount: totalAmount / 100,
          orderUrl,
        });

        console.log('📧 Notifications email envoyées avec succès');
      }
    } catch (emailError) {
      // Ne pas bloquer la commande si l'email échoue
      console.error('❌ Erreur lors de l\'envoi des emails:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Commande créée et payée avec succès',
      data: {
        order: fullOrder || order,
        payment: {
          id: paymentResult.payment?.id,
          status: paymentResult.payment?.status,
          escrow_status: paymentResult.payment?.escrow_status,
          transaction_id: paymentResult.transaction_id,
        },
      },
    });

  } catch (error) {
    console.error('Error in orders API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}