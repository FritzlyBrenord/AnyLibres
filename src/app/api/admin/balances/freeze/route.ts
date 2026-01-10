// ============================================================================
// API: Admin Freeze/Unfreeze - Geler ou dégeler un compte provider
// Utilise le champ Account_gele dans provider_balance
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { provider_id, freeze, reason } = body;

    console.log('🔒 Requête de gel/dégel:', { provider_id, freeze, reason });

    // Validation
    if (!provider_id) {
      return NextResponse.json(
        { success: false, error: 'provider_id requis' },
        { status: 400 }
      );
    }

    // Déterminer l'action (freeze = true pour geler, freeze = false pour dégeler)
    const shouldFreeze = freeze !== false; // Par défaut: geler si non spécifié

    if (shouldFreeze && !reason) {
      return NextResponse.json(
        { success: false, error: 'La raison du gel est obligatoire' },
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
      // Mettre à jour le champ Account_gele
      console.log(`📝 Mise à jour Account_gele = ${shouldFreeze} pour provider ${provider_id}`);

      const { data, error } = await supabase
        .from('provider_balance')
        .update({
          Account_gele: shouldFreeze,
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
      // Créer un nouveau solde avec Account_gele
      console.log(`📝 Création nouveau solde avec Account_gele = ${shouldFreeze}`);

      const { data, error } = await supabase
        .from('provider_balance')
        .insert({
          provider_id,
          Account_gele: shouldFreeze,
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

    console.log(`✅ Compte ${shouldFreeze ? 'gelé' : 'dégelé'} avec succès`);
    if (shouldFreeze && reason) {
      console.log(`📋 Raison: ${reason}`);
    }

    return NextResponse.json({
      success: true,
      message: shouldFreeze
        ? `Compte gelé avec succès. Raison: ${reason}`
        : 'Compte dégelé avec succès',
      data: result,
      frozen: shouldFreeze,
      reason: shouldFreeze ? reason : null,
    });

  } catch (error: any) {
    console.error('💥 Erreur API freeze:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

