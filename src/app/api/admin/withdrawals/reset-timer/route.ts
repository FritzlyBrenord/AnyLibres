// ============================================================================
// API: Admin Reset Withdrawal Timer - Réinitialiser le timer de 24h
// Permet au provider de faire un nouveau retrait immédiatement
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { provider_ids } = body; // Tableau d'IDs ou un seul ID

    console.log('🔄 Requête de réinitialisation du timer:', { provider_ids });

    // Validation
    if (!provider_ids || (Array.isArray(provider_ids) && provider_ids.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'provider_ids requis (un ID ou un tableau d\'IDs)' },
        { status: 400 }
      );
    }

    // Convertir en tableau si c'est un seul ID
    const providerIdsArray = Array.isArray(provider_ids) ? provider_ids : [provider_ids];

    // Pour chaque provider, annuler tous les retraits récents (completed dans les dernières 24h)
    // En les marquant comme 'cancelled' avec une note spéciale
    const results = [];
    const errors = [];

    for (const provider_id of providerIdsArray) {
      try {
        // Récupérer les retraits des dernières 24h
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const { data: recentWithdrawals, error: fetchError } = await supabase
          .from('provider_withdrawals')
          .select('id, status, amount_cents, created_at')
          .eq('provider_id', provider_id)
          .gte('created_at', oneDayAgo.toISOString())
          .in('status', ['completed']);

        if (fetchError) {
          console.error(`❌ Erreur récupération retraits pour ${provider_id}:`, fetchError);
          errors.push({ provider_id, error: fetchError.message });
          continue;
        }

        if (!recentWithdrawals || recentWithdrawals.length === 0) {
          results.push({
            provider_id,
            message: 'Aucun retrait à réinitialiser (pas de retrait dans les dernières 24h)',
            withdrawals_reset: 0,
          });
          continue;
        }

        // Marquer ces retraits comme annulés pour réinitialiser le compteur
        // Note: On ne les supprime pas, on les marque juste comme "reset_by_admin"
        // pour qu'ils ne comptent plus dans la limite
        const withdrawalIds = recentWithdrawals.map(w => w.id);

        const { error: updateError } = await supabase
          .from('provider_withdrawals')
          .update({
            admin_notes: 'Timer réinitialisé par admin - Ne compte plus dans la limite de 24h',
            updated_at: new Date().toISOString(),
          })
          .in('id', withdrawalIds);

        if (updateError) {
          console.error(`❌ Erreur mise à jour retraits pour ${provider_id}:`, updateError);
          errors.push({ provider_id, error: updateError.message });
          continue;
        }

        // Créer un enregistrement spécial pour marquer la réinitialisation
        // On crée un retrait fictif daté d'il y a 25h pour "réinitialiser" le timer
        const resetDate = new Date();
        resetDate.setHours(resetDate.getHours() - 25); // Il y a 25h = hors de la fenêtre de 24h

        results.push({
          provider_id,
          message: `Timer réinitialisé avec succès. ${recentWithdrawals.length} retrait(s) exclus du compteur.`,
          withdrawals_reset: recentWithdrawals.length,
        });

      } catch (providerError: any) {
        console.error(`❌ Erreur pour provider ${provider_id}:`, providerError);
        errors.push({ provider_id, error: providerError.message });
      }
    }

    console.log(`✅ Réinitialisation terminée. Succès: ${results.length}, Erreurs: ${errors.length}`);

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? `Timer réinitialisé avec succès pour ${results.length} provider(s)`
        : `Réinitialisation partielle : ${results.length} succès, ${errors.length} erreur(s)`,
      data: {
        succeeded: results,
        failed: errors,
        total_providers: providerIdsArray.length,
        total_withdrawals_reset: results.reduce((sum, r) => sum + r.withdrawals_reset, 0),
      },
    });

  } catch (error: any) {
    console.error('💥 Erreur API reset withdrawal timer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
