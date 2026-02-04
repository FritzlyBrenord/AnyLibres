import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: orderId } = await params;

    console.log('🔍 API Provider Order Detail - Récupération pour:', orderId);

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer le profile du user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    console.log('👤 Profile trouvé:', profile?.id, 'Erreur:', profileError);

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile non trouvé' },
        { status: 404 }
      );
    }

    // Trouver le provider associé via profile_id
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    console.log('🏢 Provider trouvé:', provider?.id, 'Erreur:', providerError);

    if (providerError || !provider) {
      return NextResponse.json(
        { success: false, error: 'Vous n\'êtes pas un prestataire' },
        { status: 403 }
      );
    }

    // Récupérer la commande avec toutes les relations
    console.log('🔍 Recherche de la commande:', orderId, 'pour provider:', provider.id);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          service:services (
            id,
            title,
            cover_image,
            requirements,
            revisions_included,
            max_revisions
          )
        ),
        order_deliveries (*),
        order_revisions (*),
        dispute:disputes!order_id (*)
      `)
      .eq('id', orderId)
      .eq('provider_id', provider.id)
      .single();

    if (orderError || !order) {
      console.error('❌ Commande non trouvée:', orderError);
      console.error('📊 Tentative de recherche avec - Order ID:', orderId, '| Provider ID:', provider.id);
      return NextResponse.json(
        { success: false, error: 'Commande non trouvée ou accès non autorisé' },
        { status: 404 }
      );
    }

    // Récupérer les informations du client séparément via profiles
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .eq('user_id', order.client_id)
      .single();

    // Extraire le service du premier order_item
    const service = order.order_items && order.order_items.length > 0
      ? order.order_items[0].service
      : null;

    // Ajouter le client et le service au résultat
    // IMPORTANT: Convertir dispute d'un array à un objet unique
    const enrichedOrder = {
      ...order,
      dispute: Array.isArray(order.dispute) && order.dispute.length > 0
        ? order.dispute[0]
        : order.dispute,
      service: service,
      service_info: service ? {
        revisions_included: service.revisions_included || 0,
        max_revisions: service.max_revisions || service.revisions_included || 0
      } : undefined,
      client: clientProfile || {
        id: order.client_id,
        first_name: 'Client',
        last_name: 'Inconnu',
        email: '',
        avatar_url: null
      }
    };

    console.log('✅ Commande récupérée avec succès');
    console.log('🔍 Dispute transformé:', {
      wasArray: Array.isArray(order.dispute),
      isNowObject: !Array.isArray(enrichedOrder.dispute),
      hasSessionStatus: !!enrichedOrder.dispute?.session_status,
      sessionStatus: enrichedOrder.dispute?.session_status
    });

    return NextResponse.json({
      success: true,
      data: {
        order: enrichedOrder
      }
    });

  } catch (error: any) {
    console.error('💥 Erreur inattendue:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
