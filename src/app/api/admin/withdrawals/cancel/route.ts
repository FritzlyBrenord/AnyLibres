// ============================================================================
// API: Admin Cancel Withdrawal - Annuler un retrait en cours
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { withdrawal_id, reason } = body;

    console.log('🚫 Requête d\'annulation de retrait:', { withdrawal_id, reason });

    // Validation
    if (!withdrawal_id) {
      return NextResponse.json(
        { success: false, error: 'withdrawal_id requis' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'La raison de l\'annulation est obligatoire' },
        { status: 400 }
      );
    }

    // Récupérer le retrait
    const { data: withdrawal, error: fetchError } = await supabase
      .from('provider_withdrawals')
      .select('*')
      .eq('id', withdrawal_id)
      .single();

    if (fetchError || !withdrawal) {
      console.error('❌ Retrait introuvable:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Retrait introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que le retrait peut être annulé
    if (!['pending', 'processing'].includes(withdrawal.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible d'annuler un retrait avec le statut "${withdrawal.status}". Seuls les retraits "pending" ou "processing" peuvent être annulés.`
        },
        { status: 400 }
      );
    }

    // Annuler le retrait
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from('provider_withdrawals')
      .update({
        status: 'cancelled',
        admin_notes: `Annulé par admin. Raison: ${reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', withdrawal_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur lors de l\'annulation:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Si le retrait était en mode "completed" en simulation, on doit restaurer le solde
    // Mais comme on vérifie que le statut est 'pending' ou 'processing', pas besoin

    console.log(`✅ Retrait ${withdrawal_id} annulé avec succès`);

    return NextResponse.json({
      success: true,
      message: `Retrait annulé avec succès. Raison: ${reason}`,
      data: updatedWithdrawal,
    });

  } catch (error: any) {
    console.error('💥 Erreur API cancel withdrawal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
