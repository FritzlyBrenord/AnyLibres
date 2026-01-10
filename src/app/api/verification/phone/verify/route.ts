/**
 * API Route: Verify Phone OTP
 * POST /api/verification/phone/verify
 *
 * Verifies the OTP code using Supabase Auth and marks phone as verified
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code requis' },
        { status: 400 }
      );
    }

    // Get user from session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Get user profile
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

    console.log('📱 DEBUG PHONE - Tentative de vérification OTP:', {
      phone: profile.phone,
      code: code.trim(),
      userId: user.id
    });

    // Verify OTP using Supabase Auth
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: profile.phone,
      token: code.trim(),
      type: 'sms'
    });

    if (verifyError) {
      console.error('❌ PHONE - Erreur vérification OTP:', {
        message: verifyError.message,
        status: verifyError.status,
        name: verifyError.name,
        fullError: JSON.stringify(verifyError)
      });

      // Provide more specific error messages
      if (verifyError.message.includes('expired')) {
        return NextResponse.json(
          { success: false, error: 'Code expiré. Demandez un nouveau code.' },
          { status: 400 }
        );
      }

      if (verifyError.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, error: 'Code invalide. Vérifiez et réessayez.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Code OTP invalide ou expiré (${verifyError.message})` },
        { status: 400 }
      );
    }

    console.log('✅ PHONE - OTP vérifié avec succès:', data);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Vérification échouée' },
        { status: 400 }
      );
    }

    // Update profile - mark phone as verified
    console.log('📱 DEBUG PHONE - Mise à jour du profil pour user:', user.id);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ PHONE - Erreur mise à jour profil:', {
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

    console.log('✅ PHONE - Profil mis à jour avec succès, téléphone vérifié');

    return NextResponse.json({
      success: true,
      message: 'Téléphone vérifié avec succès!'
    });

  } catch (error) {
    console.error('Error in phone verification verify:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
