// ============================================================================
// API: Admin Provider Withdrawals - Récupérer l'historique des retraits d'un prestataire
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');
    const isAdmin = searchParams.get('isAdmin');

    // Vérifier les permissions admin
    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: 'ID du profil requis' },
        { status: 400 }
      );
    }

    // 1. Récupérer le user_id à partir du profile_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { success: false, error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    const userId = profileData.user_id;

    console.log('[API PROVIDER-WITHDRAWALS] Fetching withdrawals for user_id:', userId);

    // 2. Récupérer l'historique des retraits depuis provider_withdrawals
    const { data: withdrawalsData, error: withdrawalsError } = await supabase
      .from('provider_withdrawals')
      .select('*')
      .eq('provider_id', userId)
      .order('created_at', { ascending: false });

    console.log('[API PROVIDER-WITHDRAWALS] Query result:', {
      count: withdrawalsData?.length || 0,
      withdrawalsError,
      withdrawals: withdrawalsData
    });

    if (withdrawalsError) {
      console.error('[API PROVIDER-WITHDRAWALS] Error fetching withdrawals:', withdrawalsError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des retraits' },
        { status: 500 }
      );
    }

    // Si aucun retrait trouvé, vérifier s'il y a un solde retiré dans provider_balance
    if (!withdrawalsData || withdrawalsData.length === 0) {
      const { data: balanceData } = await supabase
        .from('provider_balance')
        .select('withdrawn_cents')
        .eq('provider_id', userId)
        .single();

      console.log('[API PROVIDER-WITHDRAWALS] No withdrawals found, but balance shows withdrawn_cents:', balanceData?.withdrawn_cents);
    }

    return NextResponse.json({
      success: true,
      data: {
        withdrawals: withdrawalsData || [],
      },
    });

  } catch (error) {
    console.error('Error in provider withdrawals API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}
