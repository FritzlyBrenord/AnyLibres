// ============================================================================
// API: Provider Withdrawals - Gestion des demandes de retrait
// Mode Simulation - Prêt pour intégration réelle
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/email/notificationService';

// Configuration des retraits (comme Fiverr)
const WITHDRAWAL_CONFIG = {
  MIN_AMOUNT_CENTS: 2000, // 20 EUR minimum
  MAX_AMOUNT_CENTS: 500000, // 5000 EUR maximum par transaction
  PROCESSING_DELAY_HOURS: 24, // Délai de traitement simulé
};

/**
 * GET /api/provider/withdrawals
 * Récupérer l'historique des retraits du provider
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

    // Récupérer les retraits
    const { data: withdrawals, error } = await supabase
      .from('provider_withdrawals')
      .select('*')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des retraits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: withdrawals || [],
    });

  } catch (error) {
    console.error('Error in withdrawals GET API:', error);
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
 * POST /api/provider/withdrawals
 * Créer une demande de retrait
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
    const { amount_cents, payment_method_id } = body;

    // ========== VALIDATIONS ==========

    // 1. Validation des paramètres
    if (!amount_cents || !payment_method_id) {
      return NextResponse.json(
        { success: false, error: 'Montant et méthode de paiement requis' },
        { status: 400 }
      );
    }

    // 2. Validation du montant minimum
    if (amount_cents < WITHDRAWAL_CONFIG.MIN_AMOUNT_CENTS) {
      return NextResponse.json(
        {
          success: false,
          error: `Le montant minimum est de ${WITHDRAWAL_CONFIG.MIN_AMOUNT_CENTS / 100} EUR`
        },
        { status: 400 }
      );
    }

    // 3. Validation du montant maximum
    if (amount_cents > WITHDRAWAL_CONFIG.MAX_AMOUNT_CENTS) {
      return NextResponse.json(
        {
          success: false,
          error: `Le montant maximum par transaction est de ${WITHDRAWAL_CONFIG.MAX_AMOUNT_CENTS / 100} EUR`
        },
        { status: 400 }
      );
    }

    // 4. Vérifier le solde disponible
    const { data: balance, error: balanceError } = await supabase
      .from('provider_balance')
      .select('available_cents, currency, withdrawn_cents, custom_withdra_qty')
      .eq('provider_id', user.id)
      .single();

    if (balanceError || !balance) {
      return NextResponse.json(
        { success: false, error: 'Solde introuvable' },
        { status: 404 }
      );
    }

    if (balance.available_cents < amount_cents) {
      return NextResponse.json(
        {
          success: false,
          error: `Solde insuffisant. Disponible: ${balance.available_cents / 100} EUR`
        },
        { status: 400 }
      );
    }

    // 5. Vérifier la méthode de paiement
    const { data: paymentMethod, error: methodError } = await supabase
      .from('provider_payment_methods')
      .select('*')
      .eq('id', payment_method_id)
      .eq('provider_id', user.id)
      .is('deleted_at', null)
      .single();

    if (methodError || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Méthode de paiement invalide' },
        { status: 400 }
      );
    }

    // 6. Récupérer les paramètres de la plateforme (frais + limite de retraits)
    const { data: platformSettings } = await supabase
      .from('platform_settings')
      .select('withdrawal_fee_percentage, withdra_qty')
      .single();

    const withdrawalFeePercentage = platformSettings?.withdrawal_fee_percentage || 2.5;
    const globalWithdrawalLimit = platformSettings?.withdra_qty || 1;

    // 6b. Vérifier si le provider a une limite personnalisée
    const customLimit = balance.custom_withdra_qty;
    const maxWithdrawalsPerDay = customLimit !== null && customLimit !== undefined
      ? customLimit
      : globalWithdrawalLimit;

    // 7. Vérifier le nombre de retraits effectués dans les dernières 24h
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const { data: recentWithdrawals, error: recentError } = await supabase
      .from('provider_withdrawals')
      .select('id, status, created_at, admin_notes')
      .eq('provider_id', user.id)
      .gte('created_at', oneDayAgo.toISOString())
      .in('status', ['pending', 'processing', 'completed']);

    if (recentError) {
      console.error('Error checking recent withdrawals:', recentError);
    }

    // Filtrer les retraits qui ont été réinitialisés par l'admin
    const validWithdrawals = recentWithdrawals?.filter(w => {
      // Exclure les retraits avec admin_notes contenant "Timer réinitialisé"
      if (w.admin_notes && typeof w.admin_notes === 'string' && w.admin_notes.includes('Timer réinitialisé')) {
        return false;
      }
      return true;
    }) || [];

    const withdrawalCount = validWithdrawals.length;

    if (withdrawalCount >= maxWithdrawalsPerDay) {
      return NextResponse.json(
        {
          success: false,
          error: `Limite de retraits atteinte. Vous pouvez effectuer maximum ${maxWithdrawalsPerDay} retrait(s) par période de 24h. Vous avez déjà effectué ${withdrawalCount} retrait(s). Veuillez réessayer plus tard.`
        },
        { status: 400 }
      );
    }

    // ========== CALCUL DES FRAIS ==========
    const fee_cents = Math.round((amount_cents * withdrawalFeePercentage) / 100);
    const net_amount_cents = amount_cents - fee_cents;

    // ========== CRÉATION DE LA DEMANDE DE RETRAIT ==========
    // En mode simulation, on marque directement comme 'completed'
    // pour que le trigger mette à jour le solde immédiatement
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('provider_withdrawals')
      .insert({
        provider_id: user.id,
        payment_method_id: payment_method_id,
        amount_cents,
        fee_cents,
        net_amount_cents,
        currency: balance.currency,
        status: 'completed', // Directement completed en mode simulation
        payment_method_type: paymentMethod.type,
        payment_method_details: paymentMethod.details,
        completed_at: new Date().toISOString(), // Marquer comme complété immédiatement
        metadata: {
          payment_method_label: paymentMethod.label,
          requested_via: 'web_dashboard',
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          simulation_mode: true, // Indicateur que c'est une simulation
        },
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Error creating withdrawal:', withdrawalError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création de la demande' },
        { status: 500 }
      );
    }

    // ========== LE SOLDE EST MIS À JOUR PAR LE TRIGGER ==========
    // Le trigger 'update_balance_after_withdrawal' se déclenche automatiquement
    // quand le status est 'completed' et met à jour provider_balance

    // NOTE: Pour l'intégration réelle, c'est ici qu'on appellerait l'API
    // du système de paiement (PayPal, Stripe, etc.)
    // Exemple:
    // if (paymentMethod.type === 'paypal') {
    //   await processPayPalWithdrawal(withdrawal);
    // }

    // ========== MODE SIMULATION: AUTO-COMPLÉTION APRÈS DÉLAI ==========
    // Dans un environnement réel, cette logique serait dans un worker/cron
    // Pour la simulation, on peut utiliser un setTimeout ou un job programmé

    // Envoyer notification email au prestataire
    try {
      const { data: providerProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name, email')
        .eq('user_id', user.id)
        .single();

      if (providerProfile) {
        const providerName = providerProfile.display_name || `${providerProfile.first_name} ${providerProfile.last_name}`;

        await notificationService.sendWithdrawalNotification(providerProfile.email, {
          amount: net_amount_cents / 100,
          providerName,
          withdrawalId: withdrawal.id,
          status: 'completed',
        });

        console.log('📧 Email de retrait envoyé au prestataire');
      }
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
    }

    return NextResponse.json({
      success: true,
      data: withdrawal,
      message: `Retrait effectué avec succès ! Vous recevrez ${net_amount_cents / 100} ${balance.currency} sous 2-5 jours ouvrables.`,
    });

  } catch (error) {
    console.error('Error in withdrawals POST API:', error);
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
 * PATCH /api/provider/withdrawals
 * Annuler une demande de retrait (si status = pending)
 */
export async function PATCH(request: Request) {
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
    const { withdrawal_id, action } = body;

    if (action !== 'cancel') {
      return NextResponse.json(
        { success: false, error: 'Action non supportée' },
        { status: 400 }
      );
    }

    // Récupérer le retrait
    const { data: withdrawal, error: fetchError } = await supabase
      .from('provider_withdrawals')
      .select('*')
      .eq('id', withdrawal_id)
      .eq('provider_id', user.id)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        { success: false, error: 'Retrait introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que le retrait peut être annulé (seulement si pending)
    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'Seuls les retraits en attente peuvent être annulés'
        },
        { status: 400 }
      );
    }

    // Annuler le retrait
    const { error: updateError } = await supabase
      .from('provider_withdrawals')
      .update({
        status: 'cancelled',
        notes: 'Annulé par le provider',
      })
      .eq('id', withdrawal_id);

    if (updateError) {
      console.error('Error cancelling withdrawal:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'annulation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Retrait annulé avec succès',
    });

  } catch (error) {
    console.error('Error in withdrawals PATCH API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}
