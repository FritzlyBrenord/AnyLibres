import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    console.log('📦 API Order Deliveries - Début pour:', id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de commande manquant' },
        { status: 400 }
      );
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer les livraisons
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('order_deliveries')
      .select('*')
      .eq('order_id', id)
      .order('delivered_at', { ascending: false });

    if (deliveriesError) {
      console.error('❌ Erreur récupération livraisons:', deliveriesError);
      return NextResponse.json(
        { success: false, error: 'Erreur base de données' },
        { status: 500 }
      );
    }

    console.log(`✅ ${deliveries?.length || 0} livraisons trouvées`);

    return NextResponse.json({
      success: true,
      data: {
        deliveries: deliveries || []
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