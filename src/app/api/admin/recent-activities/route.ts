// ============================================================================
// API: Admin Recent Activities - Activités récentes de la plateforme
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Vérifier les permissions admin
    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    console.log('[API RECENT-ACTIVITIES] Fetching recent activities...');

    const activities: any[] = [];

    // 1. Récupérer les dernières commandes créées
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        total_cents,
        client_id,
        provider_id
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 2. Récupérer les nouveaux utilisateurs (clients)
    const { data: newClients } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email, created_at, role')
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .limit(limit);

    // 3. Récupérer les nouveaux prestataires
    const { data: newProviders } = await supabase
      .from('providers')
      .select(`
        id,
        created_at,
        profile:profiles (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // 4. Récupérer les nouveaux services publiés
    const { data: newServices } = await supabase
      .from('services')
      .select(`
        id,
        title,
        created_at,
        provider_id,
        status
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Collecter les IDs pour récupérer les profils
    const clientIds = [...new Set(recentOrders?.map(o => o.client_id).filter(Boolean) || [])];
    const providerIds = [...new Set([
      ...(recentOrders?.map(o => o.provider_id).filter(Boolean) || []),
      ...(newServices?.map(s => s.provider_id).filter(Boolean) || [])
    ])];

    // Récupérer les profils en batch
    const [clientsData, providersData] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, display_name')
        .in('user_id', clientIds),
      supabase
        .from('providers')
        .select(`
          id,
          profile:profiles (
            first_name,
            last_name,
            email,
            display_name
          )
        `)
        .in('id', providerIds)
    ]);

    const clientsMap = new Map(clientsData.data?.map(c => [c.user_id, c]) || []);
    const providersMap = new Map(providersData.data?.map(p => [p.id, p]) || []);

    // Formater les activités - Nouvelles commandes
    recentOrders?.forEach(order => {
      const client = clientsMap.get(order.client_id);
      const provider = providersMap.get(order.provider_id);

      if (client) {
        const userName = client.display_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email;

        activities.push({
          id: `order-${order.id}`,
          user: userName,
          action: order.status === 'completed'
            ? 'a complété une commande premium'
            : 'a créé une nouvelle commande',
          time: getTimeAgo(order.created_at),
          timestamp: new Date(order.created_at).getTime(),
          icon: order.status === 'completed' ? 'award' : 'package',
          color: order.status === 'completed' ? 'text-purple-500' : 'text-blue-500',
          status: 'success'
        });
      }
    });

    // Formater les activités - Nouveaux clients
    newClients?.forEach(client => {
      const userName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email;

      activities.push({
        id: `client-${client.user_id}`,
        user: userName,
        action: 'a rejoint la plateforme',
        time: getTimeAgo(client.created_at),
        timestamp: new Date(client.created_at).getTime(),
        icon: 'user-check',
        color: 'text-green-500',
        status: 'success'
      });
    });

    // Formater les activités - Nouveaux prestataires
    newProviders?.forEach(provider => {
      const profile = provider.profile as any;
      const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.email || 'Provider';

      activities.push({
        id: `provider-${provider.id}`,
        user: userName,
        action: 'est devenu prestataire',
        time: getTimeAgo(provider.created_at),
        timestamp: new Date(provider.created_at).getTime(),
        icon: 'briefcase',
        color: 'text-orange-500',
        status: 'success'
      });
    });

    // Formater les activités - Nouveaux services
    newServices?.forEach(service => {
      const provider = providersMap.get(service.provider_id);
      if (provider && provider.profile) {
        const profile = provider.profile as any;
        const userName = profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email;

        activities.push({
          id: `service-${service.id}`,
          user: userName,
          action: 'a publié un nouveau service',
          time: getTimeAgo(service.created_at),
          timestamp: new Date(service.created_at).getTime(),
          icon: 'zap',
          color: 'text-yellow-500',
          status: 'success'
        });
      }
    });

    // Trier par date et limiter
    const sortedActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(({ timestamp, ...rest }) => rest); // Retirer le timestamp du résultat

    console.log(`[API RECENT-ACTIVITIES] Found ${sortedActivities.length} activities`);

    return NextResponse.json({
      success: true,
      data: { activities: sortedActivities },
    });

  } catch (error) {
    console.error('[API RECENT-ACTIVITIES] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}

// Fonction helper pour calculer le temps écoulé
function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Il y a quelques secondes';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  const days = Math.floor(seconds / 86400);
  return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
}
