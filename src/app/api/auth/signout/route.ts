import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Déconnecter l'utilisateur
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[SIGNOUT] Erreur:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error: any) {
    console.error('[SIGNOUT] Erreur:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
