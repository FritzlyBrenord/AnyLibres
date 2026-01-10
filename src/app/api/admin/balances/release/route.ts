// ============================================================================
// API: Admin Release Funds - Libérer les fonds pending → available
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { provider_id, amount_cents } = body;

    if (!provider_id) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Utiliser la fonction SQL admin_release_pending_funds
    const { data, error } = await supabase.rpc('admin_release_pending_funds', {
      p_provider_id: provider_id,
      p_amount_cents: amount_cents || null, // null = tout libérer
    });

    if (error) {
      console.error('Error calling admin_release_pending_funds:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const result = data[0];

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    // Logger l'action admin (optionnel)
    try {
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'release_funds',
        target_type: 'provider_balance',
        target_id: provider_id,
        metadata: {
          provider_id,
          released_cents: result.released_cents,
          new_pending: result.new_pending_cents,
          new_available: result.new_available_cents,
        },
        performed_at: new Date().toISOString(),
      });
    } catch (logError) {
      // Ne pas bloquer si le log échoue
      console.warn('Failed to log admin action:', logError);
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        released_amount: result.released_cents,
        new_pending: result.new_pending_cents,
        new_available: result.new_available_cents,
      },
    });
  } catch (error) {
    console.error('Error in release funds API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
