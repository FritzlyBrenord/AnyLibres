/**
 * API Route: Verify Email OTP
 * POST /api/verification/email/verify
 *
 * Verifies the OTP code and marks email as verified
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { otpManager } from '@/lib/otp/otpManager';

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

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

    // Verify OTP
    const verifyResult = otpManager.verifyOTP(`email:${user.id}`, code.trim(), ip);

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 400 }
      );
    }

    // Update profile - mark email as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email vérifié avec succès!'
    });

  } catch (error) {
    console.error('Error in email verification verify:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
