// ============================================================================
// API: 3D Secure Verification Redirect
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirige vers la page de vérification 3D Secure
 * (Cette API est appelée par le MockPaymentProvider)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID manquant' },
      { status: 400 }
    );
  }

  // Rediriger vers la page de vérification 3DS
  const redirectUrl = `/payments/3ds-verify?order_id=${orderId}`;
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
