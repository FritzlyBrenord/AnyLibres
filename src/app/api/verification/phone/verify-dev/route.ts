/**
 * API Route: Verify Phone OTP (DEV MODE)
 * POST /api/verification/phone/verify-dev
 *
 * Mode développement : accepte le code 123456 sans vérifier avec Supabase Auth
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

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code requis' },
        { status: 400 }
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
      .select('phone')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || !profile.phone) {
      return NextResponse.json(
        { success: false, error: 'Profil ou téléphone introuvable' },
        { status: 404 }
      );
    }

    console.log('📱 DEV MODE - Vérification OTP:', {
      phone: profile.phone,
      code: code.trim(),
      userId: user.id
    });

    // Code OTP fixe en mode DEV
    const DEV_OTP_CODE = '123456';

    if (code.trim() !== DEV_OTP_CODE) {
      return NextResponse.json(
        { success: false, error: `Code invalide. En mode DEV, utilisez: ${DEV_OTP_CODE}` },
        { status: 400 }
      );
    }

    console.log('✅ DEV MODE - Code OTP correct');

    // Mettre à jour le profil
    console.log('📱 DEV MODE - Mise à jour du profil pour user:', user.id);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ DEV MODE - Erreur mise à jour profil:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      });
      return NextResponse.json(
        { success: false, error: `Erreur lors de la mise à jour du profil: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ DEV MODE - Profil mis à jour avec succès, téléphone vérifié');

    return NextResponse.json({
      success: true,
      message: '🔧 MODE DEV : Téléphone vérifié avec succès (sans SMS réel) !',
      devMode: true
    });

  } catch (error) {
    console.error('Error in DEV phone verification verify:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
