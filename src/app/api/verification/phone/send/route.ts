/**
 * API Route: Send Phone OTP
 * POST /api/verification/phone/send
 *
 * Sends a verification OTP to the user's phone using Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
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
      .select('phone, phone_verified')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (profile.phone_verified) {
      return NextResponse.json(
        { success: false, error: 'Téléphone déjà vérifié' },
        { status: 400 }
      );
    }

    // Validate phone number
    if (!profile.phone || !profile.phone.startsWith('+')) {
      return NextResponse.json(
        { success: false, error: 'Numéro de téléphone invalide. Doit inclure l\'indicatif pays (ex: +509...)' },
        { status: 400 }
      );
    }

    // Sync phone with auth.users if not already synced using Admin API
    if (!user.phone || user.phone !== profile.phone) {
      console.log('Syncing phone to auth.users:', profile.phone);

      // Create admin client with service role key
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Use Admin API to update auth.users
      const { data: adminData, error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { phone: profile.phone }
      );

      if (authUpdateError) {
        console.error('Error syncing phone to auth:', authUpdateError);
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la synchronisation du numéro de téléphone' },
          { status: 500 }
        );
      }
      console.log('Phone successfully synced to auth.users:', adminData);
    }

    console.log('📱 DEBUG PHONE - Envoi OTP vers:', profile.phone);

    // Send OTP using Supabase Auth
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: profile.phone,
      options: {
        channel: 'sms',
      }
    });

    if (otpError) {
      console.error('❌ PHONE - Erreur envoi OTP:', {
        message: otpError.message,
        status: otpError.status,
        name: otpError.name
      });

      // Provide more specific error messages
      if (otpError.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' },
          { status: 429 }
        );
      }

      // Check if Phone Auth is not configured
      if (otpError.message.includes('sms_send_failed') || otpError.status === 422) {
        return NextResponse.json(
          {
            success: false,
            error: 'Phone Auth n\'est pas encore configuré dans Supabase. Veuillez activer Phone Auth dans votre dashboard Supabase: https://supabase.com/dashboard/project/jiizgebxoqzyvxxwmlel/auth/providers'
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi du SMS. Vérifiez votre numéro.' },
        { status: 500 }
      );
    }

    console.log('✅ PHONE - OTP envoyé avec succès vers:', profile.phone);

    return NextResponse.json({
      success: true,
      message: 'Code de vérification envoyé par SMS',
      expiresIn: 60, // Supabase OTP expires in 60 seconds
      phone: profile.phone
    });

  } catch (error) {
    console.error('Error in phone verification send:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
