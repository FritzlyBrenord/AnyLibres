import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    
    // Récupérer les paramètres de filtrage
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const sort_by = url.searchParams.get('sort_by') || 'newest';

    console.log('[API CLIENTS] Fetching ALL profiles (clients tab)...');

    // ÉTAPE 1 : Récupérer TOUS les profils (pas seulement ceux avec commandes)
    let profilesQuery = supabase
      .from('profiles')
      .select('*');

    // Appliquer le filtre de date si présent (sur la création du profil)
    const date_range = url.searchParams.get('date_range') || 'all';
    if (date_range !== 'all') {
      const now = new Date();
      let startDate = new Date();

      if (date_range === 'today') {
        startDate.setDate(now.getDate() - 1);
      } else if (date_range === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (date_range === 'month') {
        startDate.setDate(now.getDate() - 30);
      }

      profilesQuery = profilesQuery.gte('created_at', startDate.toISOString());
    }

    // Appliquer le filtre de recherche
    if (search) {
      profilesQuery = profilesQuery.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    // Appliquer le filtre de statut
    if (status !== 'all') {
      profilesQuery = profilesQuery.eq('is_active', status === 'active');
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('[API CLIENTS] Error fetching profiles:', profilesError);
      return NextResponse.json(
        { success: false, error: profilesError.message },
        { status: 500 }
      );
    }

    console.log(`[API CLIENTS] Found ${profiles?.length || 0} profiles`);

    // ÉTAPE 2 : Récupérer les statistiques de commandes pour tous les profils
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('client_id, created_at, total_cents, payment_status');

    // Grouper par client_id et calculer les stats
    const clientStats = new Map();

    ordersData?.forEach(order => {
      if (!order.client_id) return;

      if (!clientStats.has(order.client_id)) {
        clientStats.set(order.client_id, {
          order_count: 0,
          total_spent: 0,
          last_order_date: order.created_at
        });
      }

      const stats = clientStats.get(order.client_id);
      stats.order_count += 1;

      // Ajouter au total dépensé seulement si la commande est payée
      if (order.payment_status === 'succeeded') {
        stats.total_spent += (order.total_cents / 100);
      }

      // Garder la date de la commande la plus récente
      if (new Date(order.created_at) > new Date(stats.last_order_date)) {
        stats.last_order_date = order.created_at;
      }
    });

    // ÉTAPE 3 : Combiner les données
    const clientsWithStats = (profiles || []).map(profile => {
      const stats = clientStats.get(profile.user_id) || {
        order_count: 0,
        total_spent: 0,
        last_order_date: null
      };

      return {
        ...profile,
        order_count: stats.order_count,
        total_spent: stats.total_spent,
        last_order_date: stats.last_order_date,
        // Indiquer le rôle réel (peut être 'provider' ou 'client')
        actual_role: profile.role
      };
    });

    // ÉTAPE 4 : Trier les résultats
    let sortedClients = [...clientsWithStats];
    
    if (sort_by === 'newest') {
      sortedClients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort_by === 'oldest') {
      sortedClients.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sort_by === 'most_orders') {
      sortedClients.sort((a, b) => b.order_count - a.order_count);
    } else if (sort_by === 'most_spent') {
      sortedClients.sort((a, b) => b.total_spent - a.total_spent);
    }

    console.log(`[API CLIENTS] Returning ${sortedClients.length} clients with orders`);

    return NextResponse.json({
      success: true,
      data: {
        clients: sortedClients,
        total: sortedClients.length
      }
    });

  } catch (error: any) {
    console.error('[API CLIENTS] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}