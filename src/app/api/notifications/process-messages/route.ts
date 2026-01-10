/**
 * API Route: Process Message Notifications
 * GET /api/notifications/process-messages
 *
 * Processus pour vérifier et envoyer les notifications de messages
 * À appeler via un cron job toutes les 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { messageNotificationTracker } from '@/lib/email/messageNotificationTracker';

export async function GET(request: NextRequest) {
  try {
    // Vérifier que la requête vient d'un cron job autorisé
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Traiter les notifications en attente
    await messageNotificationTracker.processPendingNotifications();

    return NextResponse.json({
      success: true,
      message: 'Notifications traitées avec succès',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors du traitement des notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
