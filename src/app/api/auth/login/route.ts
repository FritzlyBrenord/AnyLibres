// ============================================================================
// API: Login - Connexion utilisateur
// Route: /api/auth/login
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Tentative de connexion pour:', email);

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // 1. Vérification Root Super Admin (Bypass)
    const rootEmail = process.env.ROOT_ADMIN_EMAIL;
    const rootPassword = process.env.ROOT_ADMIN_PASSWORD;

    if (rootEmail && rootPassword && email === rootEmail && password === rootPassword) {
      console.log('👑 Root Super Admin détecté ! Bypass en cours...');

      // On définit un cookie de session Root sécurisé
      const cookieStore = await cookies();
      cookieStore.set('anylibre_root_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 jours
        path: '/',
      });

      return NextResponse.json({
        success: true,
        message: 'Connexion Root réussie',
        isRoot: true,
        user: {
          id: '00000000-0000-0000-0000-000000000000',
          email: rootEmail,
          display_name: 'Root Super Admin',
          role: 'super_admin',
          is_active: true
        }
      });
    }

    // 2. Connexion standard avec Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Erreur de connexion:', {
        message: authError.message,
        status: authError.status,
        code: authError.code,
      });

      // Afficher le message d'erreur réel de Supabase
      let errorMessage = authError.message;

      // Messages personnalisés pour certains cas
      if (authError.message.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
      } else if (authError.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect';
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 401 }
      );
    }

    console.log('✅ Auth réussie pour user ID:', authData.user?.id);

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Échec de la connexion' },
        { status: 500 }
      );
    }

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    // Vérifier si le compte est actif
    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: 'Ce compte a été désactivé' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      isRoot: false,
      user: profile || {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur lors de la connexion',
      },
      { status: 500 }
    );
  }
}