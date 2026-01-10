import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer tous les retraits
    const { data: withdrawals, error } = await supabase
      .from('provider_withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch withdrawals' },
        { status: 500 }
      );
    }

    // Récupérer les infos des providers pour chaque retrait
    const formattedWithdrawals = await Promise.all(
      (withdrawals || []).map(async (withdrawal) => {
        // Récupérer le profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, id')
          .eq('user_id', withdrawal.provider_id)
          .single();

        // Récupérer le provider name
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

        // L'email est dans payment_method_details (pour PayPal) ou on peut le chercher
        const providerEmail = withdrawal.payment_method_details || 'N/A';

        return {
          id: withdrawal.id,
          provider_id: withdrawal.provider_id,
          provider_name: providerName,
          provider_email: providerEmail,
          amount_cents: withdrawal.amount_cents || 0,
          currency: withdrawal.currency || 'EUR',
          status: withdrawal.status || 'pending',
          payment_method: withdrawal.payment_method_type || 'N/A',
          payment_details: withdrawal.payment_method_details,
          requested_at: withdrawal.created_at,
          processed_at: withdrawal.processed_at,
          completed_at: withdrawal.completed_at,
          notes: withdrawal.notes,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedWithdrawals,
      total: formattedWithdrawals.length,
    });
  } catch (error) {
    console.error('Error in admin withdrawals API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
