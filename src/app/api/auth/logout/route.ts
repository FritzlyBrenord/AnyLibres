// ============================================================================
// API: Logout - Déconnexion utilisateur
// Route: /api/auth/logout
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Déconnexion avec Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la déconnexion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur lors de la déconnexion',
      },
      { status: 500 }
    );
  }
}