/**
 * API Route de test pour vérifier l'envoi d'emails
 * GET /api/test-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/emailService';
import { notificationService } from '@/lib/email/notificationService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email') || 'brenordfritzly19@gmail.com';
    const type = searchParams.get('type') || 'simple';

    console.log('📧 Test d\'envoi d\'email vers:', email);
    console.log('📧 Type de test:', type);

    let result;

    if (type === 'simple') {
      // Test simple avec emailService
      result = await emailService.sendEmail({
        to: email,
        subject: 'Test Email - AnyLibre',
        html: `
          <h1>Test d'envoi d'email</h1>
          <p>Ceci est un email de test envoyé depuis AnyLibre.</p>
          <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement !</p>
          <p>Date: ${new Date().toLocaleString()}</p>
        `,
      });
    } else if (type === 'order') {
      // Test avec template de commande
      result = await notificationService.sendNewOrderNotification(email, {
        orderId: 'TEST-123',
        serviceTitle: 'Service de test',
        clientName: 'Client Test',
        providerName: 'Provider Test',
        amount: 100,
        orderUrl: 'http://localhost:3000/orders/test',
      });
    } else if (type === 'delivery') {
      // Test avec template de livraison
      result = await notificationService.sendDeliveryNotification(email, {
        orderId: 'TEST-123',
        serviceTitle: 'Service de test',
        clientName: 'Client Test',
        deliveryMessage: 'Votre commande est prête !',
        orderUrl: 'http://localhost:3000/orders/test',
      });
    }

    if (result && result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email envoyé avec succès !',
        to: email,
        type,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result?.error || 'Erreur inconnue',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur lors du test d\'email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur',
    }, { status: 500 });
  }
}
