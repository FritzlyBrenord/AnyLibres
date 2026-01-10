// ============================================================================
// API: Admin Set Withdrawal Limit - Définir une limite de retraits personnalisée
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { provider_id, custom_limit } = body;

    console.log('⚙️ Requête de configuration de limite:', { provider_id, custom_limit });

    // Validation
    if (!provider_id) {
      return NextResponse.json(
        { success: false, error: 'provider_id requis' },
        { status: 400 }
      );
    }

    // custom_limit peut être null pour réinitialiser à la limite globale
    // ou un nombre entre 1 et 100
    if (custom_limit !== null && (custom_limit < 1 || custom_limit > 100)) {
      return NextResponse.json(
        { success: false, error: 'La limite doit être entre 1 et 100, ou null pour utiliser la limite globale' },
        { status: 400 }
      );
    }

    // Vérifier si le provider_balance existe
    const { data: existingBalance, error: checkError } = await supabase
      .from('provider_balance')
      .select('*')
      .eq('provider_id', provider_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erreur vérification balance:', checkError);
      return NextResponse.json(
        { success: false, error: checkError.message },
        { status: 500 }
      );
    }

    let result;

    if (existingBalance) {
      // Mettre à jour la limite personnalisée
      const { data, error } = await supabase
        .from('provider_balance')
        .update({
          custom_withdra_qty: custom_limit,
          updated_at: new Date().toISOString(),
        })
        .eq('provider_id', provider_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur mise à jour:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Créer un nouveau solde avec la limite personnalisée
      const { data, error } = await supabase
        .from('provider_balance')
        .insert({
          provider_id,
          custom_withdra_qty: custom_limit,
          available_cents: 0,
          pending_cents: 0,
          withdrawn_cents: 0,
          total_earned_cents: 0,
          currency: 'EUR',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      result = data;
    }

    const message = custom_limit === null
      ? 'Limite de retraits réinitialisée à la valeur globale'
      : `Limite de retraits personnalisée définie à ${custom_limit} retrait(s) par jour`;

    console.log(`✅ ${message} pour provider ${provider_id}`);

    return NextResponse.json({
      success: true,
      message,
      data: result,
      custom_limit: custom_limit,
    });

  } catch (error: any) {
    console.error('💥 Erreur API set withdrawal limit:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
