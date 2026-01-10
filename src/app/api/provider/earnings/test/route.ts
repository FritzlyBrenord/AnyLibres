// ============================================================================
// API TEST: Vérifier les earnings du provider
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'Non authentifié',
        authError: authError?.message,
      });
    }

    // 2. Afficher tous les détails de l'utilisateur
    const userInfo = {
      id: user.id,
      email: user.email,
      aud: user.aud,
      role: user.role,
    };

    // 3. Chercher dans provider_balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('provider_balance')
      .select('*')
      .eq('provider_id', user.id);

    // 4. Chercher dans provider_earnings
    const { data: earningsData, error: earningsError } = await supabase
      .from('provider_earnings')
      .select('*')
      .eq('user_id', user.id);

    // 5. Voir tous les balances existants
    const { data: allBalances } = await supabase
      .from('provider_balance')
      .select('*');

    // 6. Voir tous les earnings existants
    const { data: allEarnings } = await supabase
      .from('provider_earnings')
      .select('id, user_id, provider_id, net_amount_cents, status');

    return NextResponse.json({
      success: true,
      user: userInfo,
      balance: {
        data: balanceData,
        error: balanceError?.message,
      },
      earnings: {
        data: earningsData,
        error: earningsError?.message,
      },
      allBalances: allBalances,
      allEarnings: allEarnings,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }, { status: 500 });
  }
}
