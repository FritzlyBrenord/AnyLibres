// ============================================================================
// API: Provider Payment Methods - Gestion des méthodes de paiement
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const PAYMENT_METHOD_ICONS: Record<string, string> = {
  paypal: '💳',
  bank: '🏦',
  payoneer: '⚡',
  moncash: '📱',
};

/**
 * GET /api/provider/payment-methods
 * Récupérer les méthodes de paiement du provider
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer les méthodes de paiement (non supprimées)
    const { data: methods, error } = await supabase
      .from('provider_payment_methods')
      .select('*')
      .eq('provider_id', user.id)
      .is('deleted_at', null)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des méthodes' },
        { status: 500 }
      );
    }

    // Formatter les données pour le frontend
    const formattedMethods = (methods || []).map(method => ({
      id: method.id,
      type: method.type,
      label: method.label,
      details: method.details,
      verified: method.verified,
      is_default: method.is_default,
      icon: PAYMENT_METHOD_ICONS[method.type] || '💳',
      created_at: method.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedMethods,
    });

  } catch (error) {
    console.error('Error in payment methods API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/provider/payment-methods
 * Ajouter une nouvelle méthode de paiement
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer les données du body
    const body = await request.json();
    const { type, label, details, is_default } = body;

    // Validation
    if (!type || !label || !details) {
      return NextResponse.json(
        { success: false, error: 'Type, label et details sont requis' },
        { status: 400 }
      );
    }

    const validTypes = ['paypal', 'bank', 'payoneer', 'moncash'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type de méthode invalide' },
        { status: 400 }
      );
    }

    // Validation spécifique selon le type
    if (type === 'paypal' || type === 'payoneer') {
      // Vérifier que c'est un email valide
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(details)) {
        return NextResponse.json(
          { success: false, error: 'Email invalide' },
          { status: 400 }
        );
      }
    }

    if (type === 'moncash') {
      // Vérifier le format du numéro de téléphone
      if (!details.match(/^\+?[0-9\s-()]+$/)) {
        return NextResponse.json(
          { success: false, error: 'Numéro de téléphone invalide' },
          { status: 400 }
        );
      }
    }

    // Insérer la méthode de paiement
    const { data: method, error } = await supabase
      .from('provider_payment_methods')
      .insert({
        provider_id: user.id,
        type,
        label,
        details,
        is_default: is_default || false,
        verified: false, // Par défaut non vérifié (à implémenter plus tard)
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment method:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création de la méthode' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...method,
        icon: PAYMENT_METHOD_ICONS[method.type] || '💳',
      },
    });

  } catch (error) {
    console.error('Error in payment methods POST API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/payment-methods
 * Supprimer une méthode de paiement (soft delete)
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'ID de la méthode à supprimer
    const { searchParams } = new URL(request.url);
    const methodId = searchParams.get('id');

    if (!methodId) {
      return NextResponse.json(
        { success: false, error: 'ID de méthode requis' },
        { status: 400 }
      );
    }

    // Soft delete (marquer comme supprimé)
    const { error } = await supabase
      .from('provider_payment_methods')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', methodId)
      .eq('provider_id', user.id); // Sécurité: vérifier que c'est bien le provider

    if (error) {
      console.error('Error deleting payment method:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Méthode de paiement supprimée',
    });

  } catch (error) {
    console.error('Error in payment methods DELETE API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}
