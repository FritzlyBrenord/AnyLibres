import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'client'; // 'client' ou 'provider'
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    // Construire la requête
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          service_id,
          title,
          unit_price_cents,
          quantity,
          subtotal_cents,
          selected_extras
        )
      `)
      .order('created_at', { ascending: false });

    // Filtrer selon le rôle
    if (role === 'client') {
      query = query.eq('client_id', user.id);
    } else if (role === 'provider') {
      query = query.eq('provider_id', user.id);
    }

    // Filtres optionnels
    if (status) {
      query = query.eq('status', status);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Erreur récupération commandes:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des commandes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { orders },
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}