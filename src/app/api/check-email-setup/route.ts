/**
 * API Route: Vérifier la Configuration Email
 * GET /api/check-email-setup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const checks = {
    smtp: { configured: false, details: '' },
    profilesEmail: { configured: false, details: '' },
    messageNotificationsTable: { configured: false, details: '' },
    cronSecret: { configured: false, details: '' },
  };

  try {
    // 1. Vérifier configuration SMTP
    checks.smtp.configured = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.EMAIL_FROM
    );
    checks.smtp.details = checks.smtp.configured
      ? `SMTP configuré pour ${process.env.SMTP_USER}`
      : 'Variables SMTP manquantes dans .env.local';

    // 2. Vérifier que la table profiles a une colonne email
    const supabase = await createClient();

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .limit(1);

    checks.profilesEmail.configured = !profileError && profiles !== null;
    checks.profilesEmail.details = profileError
      ? `Erreur: ${profileError.message}`
      : profiles && profiles.length > 0
      ? `✅ Colonne email trouvée`
      : '⚠️ Table vide mais colonne existe';

    // 3. Vérifier que la table pending_message_notifications existe
    const { data: notifications, error: notifError } = await supabase
      .from('pending_message_notifications')
      .select('id')
      .limit(1);

    checks.messageNotificationsTable.configured = !notifError;
    checks.messageNotificationsTable.details = notifError
      ? `❌ Table non trouvée: ${notifError.message}`
      : `✅ Table existe${notifications && notifications.length > 0 ? ` (${notifications.length} notifications)` : ''}`;

    // 4. Vérifier CRON_SECRET
    checks.cronSecret.configured = !!process.env.CRON_SECRET;
    checks.cronSecret.details = checks.cronSecret.configured
      ? '✅ CRON_SECRET configuré'
      : '⚠️ CRON_SECRET non configuré (nécessaire pour le cron job)';

    // Résumé
    const allConfigured = Object.values(checks).every((check) => check.configured);

    return NextResponse.json({
      success: allConfigured,
      message: allConfigured
        ? '✅ Toute la configuration email est correcte !'
        : '⚠️ Configuration incomplète',
      checks,
      nextSteps: allConfigured
        ? [
            '1. Testez avec: curl "http://localhost:3000/api/test-email"',
            '2. Envoyez un message dans une commande',
            '3. Vérifiez les logs du serveur pour voir les emails'
          ]
        : [
            checks.smtp.configured ? null : '1. ❌ Configurez SMTP dans .env.local',
            checks.profilesEmail.configured ? null : '2. ❌ Exécutez sync_profiles_email.sql',
            checks.messageNotificationsTable.configured ? null : '3. ❌ Exécutez create_message_notifications_table.sql',
            checks.cronSecret.configured ? null : '4. ⚠️ Ajoutez CRON_SECRET dans .env.local',
          ].filter(Boolean),
    });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      checks,
    }, { status: 500 });
  }
}
