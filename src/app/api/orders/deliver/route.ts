import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { notificationService } from '@/lib/email/notificationService';

export async function POST(request: NextRequest) {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚚 API LIVRAISON - DÉBUT DU TRAITEMENT');
    console.log('═══════════════════════════════════════════════════════');

    const supabase = await createClient();
    const {
      order_id,
      message,
      file_url,
      file_name,
      file_type,
      file_size_bytes,
      external_link
    } = await request.json();

    console.log('📦 Données reçues:', {
      order_id,
      message_length: message?.length,
      file_url: !!file_url,
      external_link
    });

    if (!order_id || !message) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Order ID et message requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier l'authentification
    console.log('🔐 Étape 1: Vérification de l\'authentification...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Échec authentification:', userError);
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    console.log('✅ Utilisateur authentifié:', user.id);

    // Étape 2: Récupérer le profil de l'utilisateur connecté
    console.log('👤 Étape 2: Récupération du profil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Échec récupération profil:', profileError);
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    }
    console.log('✅ Profil trouvé:', profile.id);

    // Étape 3: Récupérer le provider associé
    console.log('🏢 Étape 3: Récupération du provider...');
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (providerError || !provider) {
      console.error('❌ Échec récupération provider:', providerError);
      return NextResponse.json({ error: 'Provider non trouvé' }, { status: 404 });
    }
    console.log('✅ Provider trouvé:', provider.id);

    // Étape 4: Vérifier que la commande existe et appartient à ce provider
    console.log('📋 Étape 4: Vérification de la commande...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('provider_id', provider.id) // Vérifier que la commande appartient au provider
      .single();

    if (orderError || !order) {
      console.error('❌ Commande non trouvée ou non autorisée:', orderError);
      return NextResponse.json(
        {
          success: false,
          error: 'Commande non trouvée ou vous n\'êtes pas autorisé à livrer cette commande'
        },
        { status: 404 }
      );
    }
    console.log('✅ Commande trouvée - Statut:', order.status);

    // Étape 5: Vérifier que la commande peut être livrée
    console.log('✅ Étape 5: Vérification du statut de la commande...');
    const allowedStatuses = ['in_progress', 'delivery_delayed', 'revision_requested'];
    if (!allowedStatuses.includes(order.status)) {
      console.error('❌ Statut invalide pour livraison:', order.status);
      return NextResponse.json(
        {
          success: false,
          error: `La commande ne peut pas être livrée. Statut actuel: ${order.status}`
        },
        { status: 400 }
      );
    }
    console.log('✅ Statut valide pour livraison');

    // Étape 6: Calculer le numéro de livraison
    console.log('🔢 Étape 6: Calcul du numéro de livraison...');
    const { data: existingDeliveries, error: countError } = await supabase
      .from('order_deliveries')
      .select('delivery_number')
      .eq('order_id', order_id)
      .order('delivery_number', { ascending: false })
      .limit(1);

    if (countError) {
      console.error('❌ Erreur comptage livraisons:', countError);
    }

    const deliveryNumber = (existingDeliveries?.[0]?.delivery_number || 0) + 1;
    console.log('✅ Numéro de livraison calculé:', deliveryNumber);

    // Étape 7: Préparer les données de livraison
    console.log('📝 Étape 7: Préparation des données de livraison...');
    const deliveryData = {
      order_id,
      delivery_number: deliveryNumber,
      file_url: file_url || null,
      file_name: file_name || null,
      file_type: file_type || null,
      file_size_bytes: file_size_bytes || null,
      external_link: external_link || null,
      message,
      delivered_at: new Date().toISOString()
    };
    console.log('✅ Données préparées:', deliveryData);

    // Étape 8: Initialiser le client admin Supabase
    console.log('🔑 Étape 8: Initialisation du client admin...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Définie' : '❌ Manquante');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Définie (longueur: ' + supabaseServiceKey?.length + ')' : '❌ Manquante');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE URL not set. Cannot use admin client.');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    console.log('🔧 Création du client admin Supabase...');
    const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Client admin créé avec succès');

    // Étape 9: Insertion de la livraison dans la base de données
    console.log('═══════════════════════════════════════════════════════');
    console.log('💾 Étape 9: INSERTION DE LA LIVRAISON');
    console.log('═══════════════════════════════════════════════════════');
    console.log('⚠️  ATTENTION: Cette étape déclenche le trigger update_order_status_on_delivery()');
    console.log('⚠️  Ce trigger met à jour le statut de la commande vers "delivered"');

    const { data: delivery, error: deliveryError } = await adminSupabase
      .from('order_deliveries')
      .insert(deliveryData)
      .select()
      .single();

    if (deliveryError) {
      console.error('❌ Erreur création livraison:', deliveryError);
      console.error('📊 Détails de l\'erreur:');
      console.error('   - Message:', deliveryError.message);
      console.error('   - Code:', deliveryError.code);
      console.error('   - Details:', deliveryError.details);
      console.error('   - Hint:', deliveryError.hint);
      return NextResponse.json(
        {
          success: false,
          error: `Erreur base de données: ${deliveryError.message}`,
          details: deliveryError.details,
          hint: deliveryError.hint
        },
        { status: 500 }
      );
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ LIVRAISON CRÉÉE AVEC SUCCÈS !');
    console.log('   ID:', delivery.id);
    console.log('   Numéro:', delivery.delivery_number);
    console.log('═══════════════════════════════════════════════════════');

    // Étape 10: Envoyer notification email au client
    console.log('📧 Étape 10: Envoi de notification email...');
    try {
      // Récupérer les informations du client (utiliser admin client pour éviter les triggers)
      console.log('   - Récupération du profil client...');
      const { data: clientProfile, error: profileFetchError } = await adminSupabase
        .from('profiles')
        .select('first_name, last_name, display_name, email')
        .eq('user_id', order.client_id)
        .single();

      if (profileFetchError) {
        console.error('   ❌ Erreur récupération profil client:', profileFetchError);
      } else {
        console.log('   ✅ Profil client récupéré:', clientProfile.email);
      }

      // Récupérer les informations du service
      console.log('   - Récupération des informations du service...');
      const { data: orderItems, error: itemsFetchError } = await adminSupabase
        .from('order_items')
        .select('title')
        .eq('order_id', order_id)
        .limit(1);

      if (itemsFetchError) {
        console.error('   ❌ Erreur récupération order items:', itemsFetchError);
      } else {
        console.log('   ✅ Items récupérés:', orderItems?.length || 0);

      }

      if (clientProfile && orderItems && orderItems.length > 0) {
        const clientName = clientProfile.display_name || `${clientProfile.first_name} ${clientProfile.last_name}`;
        const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order_id}`;

        console.log('   - Envoi de l\'email de notification...');
        await notificationService.sendDeliveryNotification(clientProfile.email, {
          orderId: order_id,
          serviceTitle: orderItems[0].title,
          clientName,
          deliveryMessage: message,
          orderUrl,
        });

        console.log('   ✅ Email de livraison envoyé au client:', clientProfile.email);
      }
    } catch (emailError) {
      console.error('   ❌ Erreur lors de l\'envoi de l\'email:', emailError);
      console.error('   ℹ️  La livraison a quand même été créée avec succès');
      // Ne pas bloquer la livraison si l'email échoue
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 LIVRAISON TERMINÉE AVEC SUCCÈS !');
    console.log('═══════════════════════════════════════════════════════');

    return NextResponse.json({
      success: true,
      delivery,
      message: 'Commande livrée avec succès'
    });

  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('💥 ERREUR INATTENDUE DANS L\'API DE LIVRAISON');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Détails complets:', JSON.stringify(error, null, 2));
    console.error('═══════════════════════════════════════════════════════');

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne du serveur',
        errorMessage: error.message,
        errorType: error.constructor.name
      },
      { status: 500 }
    );
  }
}