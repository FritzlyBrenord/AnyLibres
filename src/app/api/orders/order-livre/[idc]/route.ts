import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const orderId = params.id;

    console.log('📦 API Order Details - Début pour:', orderId);

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer la commande avec toutes les relations
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          service:service_id(
            id,
            title,
            description,
            cover_image,
            base_price_cents,
            delivery_time_days,
            revisions_included
          )
        ),
        order_deliveries(*),
        order_revisions(*),
        provider:providers!inner(
          id,
          profile_id,
          company_name,
          profession,
          rating,
          completed_orders_count,
          profile:profiles!inner(
            id,
            first_name,
            last_name,
            avatar_url,
            email
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Commande non trouvée:', orderError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Commande non trouvée' 
        },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est bien le client de cette commande
    if (order.client_id !== user.id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Non autorisé à voir cette commande' 
        },
        { status: 403 }
      );
    }

    console.log('✅ Commande trouvée avec', order.order_deliveries?.length || 0, 'livraisons');

    // Transformer les données pour l'UI
    const transformedOrder = {
      ...order,
      provider_profile: order.provider?.profile ? {
        id: order.provider.profile.id,
        first_name: order.provider.profile.first_name,
        last_name: order.provider.profile.last_name,
        avatar_url: order.provider.profile.avatar_url,
        email: order.provider.profile.email,
        occupations: order.provider.profession,
        rating: order.provider.rating,
        completed_orders: order.provider.completed_orders_count
      } : null
    };

    return NextResponse.json({ 
      success: true,
      data: {
        order: transformedOrder
      }
    });

  } catch (error: any) {
    console.error('💥 Erreur inattendue:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}