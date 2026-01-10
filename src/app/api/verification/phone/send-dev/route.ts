/**
 * API Route: Send Phone OTP (DEV MODE)
 * POST /api/verification/phone/send-dev
 *
 * Mode développement : génère un code OTP fixe sans envoyer de SMS
 * ⚠️ À UTILISER UNIQUEMENT EN DÉVELOPPEMENT
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Vérifier qu'on est en mode développement
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Cette API n\'est disponible qu\'en développement' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone, phone_verified')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    if (profile.phone_verified) {
      return NextResponse.json(
        { success: false, error: 'Téléphone déjà vérifié' },
        { status: 400 }
      );
    }

    if (!profile.phone || !profile.phone.startsWith('+')) {
      return NextResponse.json(
        { success: false, error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // Code OTP fixe pour le développement
    const DEV_OTP_CODE = '123456';

    console.log('📱 DEV MODE - Code OTP généré:', DEV_OTP_CODE);
    console.log('📱 DEV MODE - Pour le numéro:', profile.phone);

    // Stocker le code dans une table temporaire ou en cache
    // Pour simplifier, on utilise une variable d'environnement
    // En production, utilisez Redis ou une table temporaire

    return NextResponse.json({
      success: true,
      message: '🔧 MODE DEV : Code OTP généré (pas de SMS envoyé)',
      devMode: true,
      code: DEV_OTP_CODE, // ⚠️ Ne jamais retourner le code en production !
      phone: profile.phone,
      instructions: 'Utilisez le code 123456 pour vérifier votre numéro en mode DEV'
    });

  } catch (error) {
    console.error('Error in DEV phone verification send:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
