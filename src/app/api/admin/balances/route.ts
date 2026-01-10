// ============================================================================
// API: Admin Balances - Liste tous les soldes providers
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier que l'utilisateur est admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Vérifier le rôle admin
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single();
    //
    // if (profile?.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Forbidden - Admin only' },
    //     { status: 403 }
    //   );
    // }

    // Récupérer tous les soldes
    const { data: balances, error } = await supabase
      .from('provider_balance')
      .select('*')
      .order('total_earned_cents', { ascending: false });

    if (error) {
      console.error('Error fetching balances:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch balances' },
        { status: 500 }
      );
    }

    // Récupérer les infos des profiles et providers pour chaque balance
    const formattedBalances = await Promise.all(
      (balances || []).map(async (balance: any) => {
        // Récupérer le profile via user_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, display_name, id')
          .eq('user_id', balance.provider_id)
          .single();

        // Récupérer le provider via profile_id
        let providerName = profile?.display_name || 'N/A';
        if (profile?.id) {
          const { data: provider } = await supabase
            .from('providers')
            .select('company_name')
            .eq('profile_id', profile.id)
            .single();

          if (provider?.company_name) {
            providerName = provider.company_name;
          }
        }

        return {
          id: balance.id,
          provider_id: balance.provider_id,
          provider_name: providerName,
          provider_email: profile?.email || 'N/A',
          available_cents: balance.available_cents || 0,
          pending_cents: balance.pending_cents || 0,
          withdrawn_cents: balance.withdrawn_cents || 0,
          total_earned_cents: balance.total_earned_cents || 0,
          currency: balance.currency || 'USD',
          last_withdrawal_at: balance.last_withdrawal_at,
          created_at: balance.created_at,
          Account_gele: balance.Account_gele || false, // 🆕 Utilise le nouveau champ
          is_frozen: balance.Account_gele || balance.is_frozen || false, // Garde pour compatibilité
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedBalances,
      total: formattedBalances.length,
    });
  } catch (error) {
    console.error('Error in admin balances API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
