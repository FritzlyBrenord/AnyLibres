// ============================================================================
// API: Register - Inscription d'un nouvel utilisateur
// Route: /api/auth/register
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, password, confirmPassword, first_name, last_name } = body;

    // Validation
    if (!email || !password || !confirmPassword || !first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Les mots de passe ne correspondent pas' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Créer l'utilisateur avec Supabase Auth (sans confirmation d'email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
        },
        emailRedirectTo: undefined, // Pas de redirection email
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Échec de la création du compte' },
        { status: 500 }
      );
    }

    // Créer le profil utilisateur avec user_id explicite
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: authData.user.id,
      email: email,
      first_name: first_name,
      last_name: last_name,
      display_name: `${first_name} ${last_name}`,
      role: 'client',
      locale: 'fr',
      currency: 'EUR',
      is_verified: false,
      is_active: true,
      notification_settings: {
        emailOrders: true,
        pushEnabled: false,
        emailMessages: true,
        emailPromotions: true,
      },
      preferences: {
        darkMode: false,
        compactView: false,
      },
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Essayer de supprimer l'utilisateur auth si la création du profil échoue
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création du profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur lors de l\'inscription',
      },
      { status: 500 }
    );
  }
}