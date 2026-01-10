import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { order_id } = await request.json();

    console.log('🚀 API Start Order - Début pour:', order_id);

    if (!order_id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Order ID requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
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

    console.log('📦 Statut actuel de la commande:', order.status);

    // Vérifier que la commande peut être démarrée (doit être "paid")
    if (order.status !== 'paid') {
      return NextResponse.json(
        { 
          success: false,
          error: `La commande ne peut pas être démarrée. Statut actuel: ${order.status}` 
        },
        { status: 400 }
      );
    }

    // Mettre à jour le statut
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Erreur lors du démarrage de la commande' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Commande démarrée avec succès:', updatedOrder.id);

    return NextResponse.json({ 
      success: true,
      order: updatedOrder
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