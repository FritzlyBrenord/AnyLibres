// app/api/orders/[id]/route.ts - VERSION NEXT.JS 16
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // params est une Promise
) {
  try {
    const supabase = await createClient();
    
    // ATTENDRE les params
    const { id } = await params;
    
    console.log('🔍 ID reçu:', id);

    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { success: false, error: 'ID de commande manquant' },
        { status: 400 }
      );
    }

    // Vérifier auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Utilisateur non authentifié');
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    console.log('👤 Utilisateur connecté:', user.id);

    // Récupérer la commande
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Commande introuvable' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Erreur base de données: ' + error.message },
        { status: 500 }
      );
    }

    if (!order) {
      console.log('❌ Commande non trouvée après requête');
      return NextResponse.json(
        { success: false, error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    console.log('✅ Commande trouvée:', {
      id: order.id,
      client_id: order.client_id,
      user_id: user.id,
      status: order.status
    });

    // Vérifier que l'utilisateur a accès à cette commande
    if (order.client_id !== user.id && order.provider_id !== user.id) {
      console.log('❌ Accès non autorisé:', {
        order_client: order.client_id,
        order_provider: order.provider_id,
        currentUser: user.id
      });
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    console.log('✅ Accès autorisé, retour de la commande');
    return NextResponse.json({
      success: true,
      data: { order },
    });

  } catch (error) {
    console.error('💥 Get order error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}