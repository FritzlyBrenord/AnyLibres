/**
 * API Route: Debug Phone Setup
 * GET /api/debug/phone-setup
 *
 * Vérifie toute la configuration pour la vérification téléphonique
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const checks = {
    authentication: { ok: false, details: '' },
    profile: { ok: false, details: '' },
    phoneColumn: { ok: false, details: '' },
    phoneVerifiedColumn: { ok: false, details: '' },
    authUserPhone: { ok: false, details: '' },
    serviceRoleKey: { ok: false, details: '' },
    phoneAuthEnabled: { ok: false, details: '' },
  };

  try {
    const supabase = await createClient();

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      checks.authentication.details = '❌ Non authentifié';
      return NextResponse.json({
        success: false,
        message: 'Veuillez vous connecter pour tester',
        checks
      });
    }

    checks.authentication.ok = true;
    checks.authentication.details = `✅ Utilisateur: ${user.id}`;

    // 2. Vérifier le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, phone, phone_verified, email, email_verified')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      checks.profile.details = `❌ Erreur: ${profileError.message}`;
    } else if (!profile) {
      checks.profile.details = '❌ Profil non trouvé';
    } else {
      checks.profile.ok = true;
      checks.profile.details = `✅ Profil trouvé: ${profile.id}`;
    }

    // 3. Vérifier la colonne phone
    if (profile) {
      if (profile.phone) {
        checks.phoneColumn.ok = true;
        checks.phoneColumn.details = `✅ Téléphone: ${profile.phone}`;
      } else {
        checks.phoneColumn.details = '⚠️ Aucun téléphone enregistré dans le profil';
      }

      // 4. Vérifier la colonne phone_verified
      if ('phone_verified' in profile) {
        checks.phoneVerifiedColumn.ok = true;
        checks.phoneVerifiedColumn.details = `✅ phone_verified existe: ${profile.phone_verified}`;
      } else {
        checks.phoneVerifiedColumn.details = '❌ Colonne phone_verified manquante';
      }
    }

    // 5. Vérifier auth.users.phone
    if (user.phone) {
      checks.authUserPhone.ok = true;
      checks.authUserPhone.details = `✅ auth.users.phone: ${user.phone}`;
    } else {
      checks.authUserPhone.details = `⚠️ Téléphone non synchronisé dans auth.users (sera synchronisé lors de l'envoi OTP)`;
    }

    // 6. Vérifier SUPABASE_SERVICE_ROLE_KEY
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      checks.serviceRoleKey.ok = true;
      checks.serviceRoleKey.details = '✅ SUPABASE_SERVICE_ROLE_KEY configuré';
    } else {
      checks.serviceRoleKey.details = '❌ SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local';
    }

    // 7. Tester si Phone Auth est activé (test rapide)
    try {
      // On ne peut pas vraiment tester sans envoyer un SMS, donc on suppose que c'est OK
      checks.phoneAuthEnabled.ok = true;
      checks.phoneAuthEnabled.details = '⚠️ Impossible de vérifier sans envoyer un SMS. Testez avec /api/verification/phone/send';
    } catch (e) {
      checks.phoneAuthEnabled.details = '❌ Erreur lors du test Phone Auth';
    }

    // Résumé
    const allOk = Object.values(checks).every(check => check.ok);

    return NextResponse.json({
      success: allOk,
      message: allOk
        ? '✅ Configuration complète pour la vérification téléphonique !'
        : '⚠️ Certaines vérifications ont échoué',
      checks,
      debugInfo: {
        userId: user.id,
        userEmail: user.email,
        userPhone: user.phone,
        profilePhone: profile?.phone,
        phoneVerified: profile?.phone_verified,
        emailVerified: profile?.email_verified,
      },
      nextSteps: allOk
        ? [
            '1. Testez l\'envoi OTP: POST /api/verification/phone/send',
            '2. Vérifiez le code: POST /api/verification/phone/verify avec {code: "123456"}',
            '3. Regardez les logs serveur pour voir les erreurs détaillées'
          ]
        : [
            !checks.phoneColumn.ok ? '1. ❌ Ajoutez un numéro de téléphone dans votre profil (+509...)' : null,
            !checks.phoneVerifiedColumn.ok ? '2. ❌ Exécutez la migration pour ajouter phone_verified' : null,
            !checks.serviceRoleKey.ok ? '3. ❌ Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local' : null,
          ].filter(Boolean),
    });

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      checks,
    }, { status: 500 });
  }
}
