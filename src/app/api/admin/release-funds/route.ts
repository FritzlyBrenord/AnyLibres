import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { provider_id, amount_cents } = await request.json();

    if (!provider_id) {
      return NextResponse.json(
        { error: 'provider_id requis' },
        { status: 400 }
      );
    }

    // Appeler la fonction SQL pour libérer les fonds
    const { data, error } = await supabase
      .rpc('admin_release_pending_funds', {
        p_provider_id: provider_id,
        p_amount_cents: amount_cents || null  // NULL = tout libérer
      });

    if (error) {
      console.error('Erreur lors de la libération des fonds:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const result = data[0];

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        released_cents: result.released_cents,
        new_available_cents: result.new_available_cents,
        new_pending_cents: result.new_pending_cents,
        message: result.message
      }
    });

  } catch (error: any) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
