// ============================================================================
// API: Provider Earnings - Récupération des gains du prestataire
// ============================================================================
//api\provider\earnings\route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface ProviderBalance {
  available_cents: number;
  pending_cents: number;
  withdrawn_cents: number;
  total_earned_cents: number;
  currency: string;
  completed_orders: number;
  pending_orders: number;
  last_withdrawal_at: string | null;
  Account_gele?: boolean; // 🆕 Statut du compte gelé
}

export interface ProviderEarning {
  id: string;
  order_id: string;
  amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    client_id: string;
    status: string;
    created_at: string;
  };
}

/**
 * GET /api/provider/earnings
 * Récupérer le résumé des gains et l'historique
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const targetProfileId = searchParams.get('profileId');

    let authUserId = '';

    if (targetProfileId) {
      // ADMIN/OVERRIDE MODE
      // We need to find the user_id associated with this profile_id
      // because provider_earnings and provider_balance are linked to user_id (not profile_id directly)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', targetProfileId)
        .single();

      if (profileError || !profileData) {
        return NextResponse.json({ success: false, error: 'Profil introuvable pour cet ID' }, { status: 404 });
      }
      authUserId = profileData.user_id;
      console.log('[EARNINGS API] Admin Mode - Target User ID resolved:', authUserId);

    } else {
      // STANDARD MODE
      // 1. Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Non authentifié' },
          { status: 401 }
        );
      }

      // 2. Récupérer le vrai user_id (auth.users.id)
      authUserId = user.id;
      console.log('[EARNINGS API] Auth User ID:', authUserId);
    }

    const { data: balanceData, error: balanceError } = await supabase
      .from('provider_balance')
      .select('*')
      .eq('provider_id', authUserId);

    console.log('[EARNINGS API] Balance query result:', { balanceData, balanceError });

    // Prendre le premier élément si c'est un tableau
    const balanceRecord = balanceData && balanceData.length > 0 ? balanceData[0] : null;

    // Si pas de solde, créer un solde vide
    let balance: ProviderBalance;
    if (balanceError || !balanceRecord) {
      console.log('[EARNINGS API] No balance found, returning empty balance');
      balance = {
        available_cents: 0,
        pending_cents: 0,
        withdrawn_cents: 0,
        total_earned_cents: 0,
        currency: 'EUR',
        completed_orders: 0,
        pending_orders: 0,
        last_withdrawal_at: null,
        Account_gele: false, // 🆕 Par défaut non gelé
      };
    } else {
      console.log('[EARNINGS API] Balance found:', balanceRecord);
      balance = {
        available_cents: balanceRecord.available_cents || 0,
        pending_cents: balanceRecord.pending_cents || 0,
        withdrawn_cents: balanceRecord.withdrawn_cents || 0,
        total_earned_cents: balanceRecord.total_earned_cents || 0,
        currency: balanceRecord.currency || 'EUR',
        completed_orders: 0,
        pending_orders: 0,
        last_withdrawal_at: balanceRecord.last_withdrawal_at || null,
        Account_gele: balanceRecord.Account_gele || false, // 🆕 Statut du compte gelé
      };
    }

    // 3. Récupérer l'historique des earnings (maintenant on utilise user_id)
    const { data: earnings, error: earningsError } = await supabase
      .from('provider_earnings')
      .select(`
        *,
        order:orders(id, client_id, status, created_at)
      `)
      .eq('user_id', authUserId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (earningsError) {
      console.error('Error fetching earnings:', earningsError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des gains' },
        { status: 500 }
      );
    }

    // 4. Retourner les données
    return NextResponse.json({
      success: true,
      data: {
        balance,
        earnings: earnings || [],
      },
    });

  } catch (error) {
    console.error('Error in provider earnings API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}
