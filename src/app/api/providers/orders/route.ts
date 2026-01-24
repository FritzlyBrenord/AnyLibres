import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const targetProfileIdParam = searchParams.get('profileId'); // Optional override

    console.log('🔍 API Provider Orders - Début');

    let targetProfileId = '';

    if (targetProfileIdParam) {
      // ADMIN/OVERRIDE MODE
      targetProfileId = targetProfileIdParam;
      console.log('👑 Admin Mode - Profile ID provided:', targetProfileId);
    } else {
      // STANDARD MODE
      // Vérifier l'authentification
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }

      console.log('👤 Utilisateur connecté:', user.id);

      // Récupérer le profil de l'utilisateur connecté
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
      }

      targetProfileId = profile.id;
      console.log('✅ Profil trouvé:', targetProfileId);
    }

    // Récupérer le provider associé à ce profil
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', targetProfileId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({
        error: 'Compte provider non trouvé',
        has_provider_account: false
      }, { status: 404 });
    }

    console.log('✅ Provider trouvé:', provider.id);

    // Récupérer les commandes du provider
    let ordersQuery = supabase
      .from('orders')
      .select('*, dispute:disputes!order_id (*)')
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      ordersQuery = ordersQuery.eq('status', status);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('❌ Erreur commandes:', ordersError);
      return NextResponse.json(
        { error: 'Erreur récupération commandes' },
        { status: 500 }
      );
    }

    console.log(`✅ ${orders?.length || 0} commandes trouvées`);

    // Si pas de commandes, retourner tableau vide
    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        orders: []
      });
    }

    // Récupérer les données supplémentaires en parallèle
    const orderIds = orders.map(order => order.id);

    const [
      { data: orderItems },
      { data: deliveries },
      { data: revisions },
      { data: clientsData },
      { data: servicesData },
      { data: disputesData }
    ] = await Promise.all([
      supabase.from('order_items').select('*').in('order_id', orderIds),
      supabase.from('order_deliveries').select('*').in('order_id', orderIds),
      supabase.from('order_revisions').select('*').in('order_id', orderIds),
      supabase.from('profiles').select('*').in('user_id', orders.map(o => o.client_id)),
      // Récupérer les services pour obtenir revisions_included et max_revisions
      supabase.from('order_items').select('service_id, services(revisions_included, max_revisions)').in('order_id', orderIds),
      // Récupérer les disputes pour les commandes en litige
      supabase.from('disputes').select('*').in('order_id', orderIds).eq('status', 'open')
    ]);

    // Transformer les données
    const transformedOrders = orders.map(order => {
      const clientProfile = clientsData?.find(c => c.user_id === order.client_id);
      const orderItemsForOrder = orderItems?.filter(item => item.order_id === order.id) || [];
      const deliveriesForOrder = deliveries?.filter(d => d.order_id === order.id) || [];
      const revisionsForOrder = revisions?.filter(r => r.order_id === order.id) || [];

      // Récupérer les infos du service pour les révisions
      const firstOrderItem = orderItemsForOrder[0];
      const serviceDataEntry = servicesData?.find((item: any) =>
        item.service_id === firstOrderItem?.service_id
      );

      const services = serviceDataEntry?.services as any;
      const firstService = Array.isArray(services) ? services[0] : services;

      const clientName = clientProfile ?
        `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim() ||
        clientProfile.display_name ||
        'Client'
        : 'Client';

      // Calculer les informations de délai
      const now = new Date();
      const deadline = order.delivery_deadline ? new Date(order.delivery_deadline) : null;
      const timeRemaining = deadline ? deadline.getTime() - now.getTime() : 0;
      const hoursRemaining = deadline ? Math.floor(timeRemaining / (1000 * 60 * 60)) : 0;

      // Statuts actifs qui peuvent être en retard ou urgents
      const activeStatuses = ['pending', 'paid', 'in_progress', 'revision_requested'];
      const isActiveOrder = activeStatuses.includes(order.status);

      const isLate = deadline && timeRemaining < 0 && isActiveOrder;
      const isUrgent = deadline && hoursRemaining < 48 && hoursRemaining > 0 && isActiveOrder;

      // Trouver le dispute pour cette commande
      const orderDispute = disputesData?.find(d => d.order_id === order.id);

      return {
        ...order,
        order_items: orderItemsForOrder,
        order_deliveries: deliveriesForOrder,
        order_revisions: revisionsForOrder,
        dispute: orderDispute || null,  // Ajouter le dispute ici
        client: {
          id: order.client_id,
          email: clientProfile?.email || 'email@inconnu.com',
          full_name: clientName,
          avatar_url: clientProfile?.avatar_url
        },
        service: {
          id: 'service-' + order.id,
          title: {
            fr: orderItemsForOrder[0]?.title || `Commande #${order.id.slice(0, 8)}`,
            en: orderItemsForOrder[0]?.title || `Order #${order.id.slice(0, 8)}`
          },
          cover_image: null
        },
        service_info: firstService ? {
          revisions_included: firstService.revisions_included || 0,
          max_revisions: firstService.max_revisions || firstService.revisions_included || 0
        } : undefined,
        is_priority: calculatePriority(order),
        is_late: isLate,
        is_urgent: isUrgent,
        hours_remaining: hoursRemaining,
        revision_count: revisionsForOrder.length,
        latest_revision: revisionsForOrder.length > 0 ? revisionsForOrder[revisionsForOrder.length - 1] : null
      };
    });

    return NextResponse.json({
      success: true,
      orders: transformedOrders
    });

  } catch (error: unknown) {
    console.error('💥 Erreur API:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

function calculatePriority(order: { delivery_deadline?: string | null; status?: string }): boolean {
  if (!order.delivery_deadline) return false;

  // Seules les commandes actives peuvent être prioritaires
  const activeStatuses = ['pending', 'paid', 'in_progress', 'revision_requested'];
  if (!order.status || !activeStatuses.includes(order.status)) return false;

  const deadline = new Date(order.delivery_deadline);
  const now = new Date();
  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntilDeadline <= 2;
}