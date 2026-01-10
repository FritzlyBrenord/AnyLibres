/**
 * API Route: Send Email OTP
 * POST /api/verification/email/send
 *
 * Sends a verification OTP to the user's email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { otpManager } from '@/lib/otp/otpManager';
import { emailService } from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

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
      .select('email, email_verified')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (profile.email_verified) {
      return NextResponse.json(
        { success: false, error: 'Email déjà vérifié' },
        { status: 400 }
      );
    }

    // Check if can resend
    const canResendCheck = otpManager.canResend(`email:${user.id}`);
    if (!canResendCheck.canResend) {
      return NextResponse.json(
        { success: false, error: canResendCheck.error },
        { status: 429 }
      );
    }

    // Generate OTP
    const otpResult = otpManager.createOTP(`email:${user.id}`, ip);

    if (!otpResult.success || !otpResult.code) {
      return NextResponse.json(
        { success: false, error: otpResult.error || 'Erreur lors de la génération du code' },
        { status: 429 }
      );
    }

    // Send email
    const emailResult = await emailService.sendOTPEmail(
      profile.email,
      otpResult.code,
      otpResult.expiresIn || 90
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Code de vérification envoyé par email',
      expiresIn: otpResult.expiresIn,
      remainingResends: canResendCheck.remainingResends
    });

  } catch (error) {
    console.error('Error in email verification send:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
