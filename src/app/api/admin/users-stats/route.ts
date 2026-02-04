// /api/admin/users-stats/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);

    // Vérifier si c'est un accès admin
    const isAdmin = request.headers.get('x-is-admin') === 'true' ||
      url.searchParams.get('isAdmin') === 'true';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer les statistiques
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Compter les clients
    const { count: totalClients } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client');

    const { count: newClientsToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    // Compter les prestataires
    const { count: totalProviders } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true });

    const { count: newProvidersToday } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    // Calculer le chiffre d'affaires total (somme des commandes payées)
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_cents')
      .eq('payment_status', 'succeeded');

    const totalRevenue = revenueData?.reduce((sum: number, order: any) => sum + (order.total_cents / 100), 0) || 0;

    // Compter les retraits en attente
    const { data: pendingWithdrawals } = await supabase
      .from('withdrawals')
      .select('amount_cents')
      .eq('status', 'pending');

    const totalPendingWithdrawals = pendingWithdrawals?.reduce((sum: number, withdrawal: any) => sum + (withdrawal.amount_cents / 100), 0) || 0;

    // Compter les clients actifs (avec connexion récente)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: activeClients } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .gte('last_login', weekAgo.toISOString());

    // Compter les prestataires actifs
    const { count: activeProviders } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Compter les utilisateurs système
    const { count: totalSystemUsers } = await supabase
      .from('admin_user_roles')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: {
        total_clients: totalClients || 0,
        total_providers: totalProviders || 0,
        total_system_users: totalSystemUsers || 0,
        active_clients: activeClients || 0,
        active_providers: activeProviders || 0,
        new_clients_today: newClientsToday || 0,
        new_providers_today: newProvidersToday || 0,
        total_revenue: totalRevenue,
        pending_withdrawals: totalPendingWithdrawals
      }
    });

  } catch (error) {
    console.error('Erreur statistiques:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}