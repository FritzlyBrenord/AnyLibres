import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    console.log('🎯 API Order Complete - Début pour:', id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de commande manquant' },
        { status: 400 }
      );
    }

    // Récupérer la commande de base
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      console.error('❌ Commande non trouvée:', orderError);
      return NextResponse.json(
        { success: false, error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si c'est un accès admin (vérifier dans les headers ou query params)
    const isAdmin = request.headers.get('x-is-admin') === 'true' ||
      new URL(request.url).searchParams.get('isAdmin') === 'true';

    let userId: string | null = null;
    let isAuthorized = false;

    if (isAdmin) {
      // Accès admin - autorisé sans aucune vérification d'authentification
      console.log('🔑 Accès admin détecté - bypass complet authentification');
      isAuthorized = true;
      // On ne récupère pas l'utilisateur, on passe directement
    } else {
      // Vérifier l'authentification normale
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Non authentifié' },
          { status: 401 }
        );
      }

      userId = user.id;

      // Vérifier les permissions normales - autoriser client ET prestataire
      isAuthorized = order.client_id === userId || order.provider_id === userId;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer toutes les données en parallèle
    const [
      { data: orderItems },
      { data: deliveries },
      { data: revisions },
      { data: providerProfile },
      { data: payment },
      { data: serviceInfo }
    ] = await Promise.all([
      // Order Items
      supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id),

      // Livraisons
      supabase
        .from('order_deliveries')
        .select('*')
        .eq('order_id', id)
        .order('delivered_at', { ascending: false }),

      // Révisions
      supabase
        .from('order_revisions')
        .select('*')
        .eq('order_id', id)
        .order('requested_at', { ascending: false }),

      // Profil du provider
      supabase
        .from('providers')
        .select(`
          id,
          profession,
          rating,
          completed_orders_count,
          profile:profiles!inner(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', order.provider_id)
        .single(),

      // Informations de paiement
      supabase
        .from('payments')
        .select(`
          id,
          amount_cents,
          currency,
          status,
          payment_method,
          payment_provider,
          escrow_status,
          escrow_released_at,
          requires_3d_secure,
          is_3d_secure_completed,
          display_details,
          created_at,
          succeeded_at,
          failed_at
        `)
        .eq('order_id', id)
        .single(),

      // Informations du service (pour révisions incluses)
      Promise.resolve({ data: null })
    ]);

    // Récupérer les informations du service si orderItems existe
    let actualServiceInfo = null;
    if (orderItems && orderItems.length > 0) {
      const { data } = await supabase
        .from('services')
        .select('id, revisions_included, max_revisions')
        .eq('id', orderItems[0].service_id)
        .single();
      actualServiceInfo = data;
    }

    console.log('📊 Données récupérées:', {
      orderItems: orderItems?.length || 0,
      deliveries: deliveries?.length || 0,
      revisions: revisions?.length || 0,
      provider: !!providerProfile,
      payment: !!payment,
      service: !!actualServiceInfo,
      isAdmin
    });

    // Transformer les données
    const completeOrder = {
      ...order,
      order_items: orderItems || [],
      order_deliveries: deliveries || [],
      order_revisions: revisions || [],
      provider_profile: providerProfile ? {
        id: providerProfile.profile.id,
        first_name: providerProfile.profile.first_name,
        last_name: providerProfile.profile.last_name,
        avatar_url: providerProfile.profile.avatar_url,
        occupations: providerProfile.profession,
        rating: providerProfile.rating,
        completed_orders: providerProfile.completed_orders_count
      } : null,
      payment_info: payment || null,
      service_info: actualServiceInfo ? {
        revisions_included: actualServiceInfo.revisions_included || 0,
        max_revisions: actualServiceInfo.max_revisions || actualServiceInfo.revisions_included || 0
      } : null
    };

    return NextResponse.json({
      success: true,
      data: {
        order: completeOrder,
        isAdmin: isAdmin // Optionnel: retourner l'info admin pour le frontend
      }
    });

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}