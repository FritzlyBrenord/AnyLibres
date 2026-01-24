import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Erreur authentification:', authError);
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'client'; // 'client' ou 'provider'
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    console.log('Paramètres requête:', { role, status, paymentStatus, userId: user.id });

    // Construire la requête de base - commencer simple
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrer selon le rôle
    if (role === 'client') {
      query = query.eq('client_id', user.id);
    } else if (role === 'provider') {
      // Pour les providers, chercher par provider_id
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!providerError && provider) {
        query = query.eq('provider_id', provider.id);
      } else {
        // Fallback: chercher par user_id
        query = query.eq('provider_id', user.id);
      }
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
      console.error('Erreur récupération commandes Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des commandes', details: error.message },
        { status: 500 }
      );
    }

    // Enrichir les commandes avec les détails client et prestataire
    const enrichedOrders = await Promise.all((orders || []).map(async (order: any) => {
      try {
        // Récupérer les infos client
        const { data: client } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, user_id')
          .eq('user_id', order.client_id)
          .single();

        // Récupérer les infos prestataire
        const { data: provider } = await supabase
          .from('providers')
          .select('id, user_id')
          .eq('id', order.provider_id)
          .single();

        // Récupérer le profil du prestataire si besoin
        let providerProfile = null;
        if (provider) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('user_id', provider.user_id)
            .single();
          providerProfile = profile;
        }

        // Récupérer les items de commande
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        // Récupérer les disputes associées
        const { data: dispute } = await supabase
          .from('disputes')
          .select('*')
          .eq('order_id', order.id)
          .single();

        return {
          ...order,
          client,
          provider: providerProfile ? { ...provider, ...providerProfile } : provider,
          order_items: items || [],
          dispute: dispute || null
        };
      } catch (e) {
        console.error('Erreur enrichissement commande:', order.id, e);
        return order;
      }
    }));

    return NextResponse.json({
      success: true,
      data: { orders: enrichedOrders },
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}