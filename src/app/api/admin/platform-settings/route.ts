// ============================================================================
// API: Admin Platform Settings - Gérer les paramètres de la plateforme
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET - Récupérer les paramètres de la plateforme
 * Si isAdmin=false, retourne uniquement withdrawal_fee_percentage (accès public)
 * Si isAdmin=true, retourne tous les paramètres (accès admin uniquement)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin');

    // Récupérer les paramètres globaux
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('[API PLATFORM-SETTINGS] Error:', error);
      console.error('[API PLATFORM-SETTINGS] Error code:', error.code);
      console.error('[API PLATFORM-SETTINGS] Error details:', error.details);

      // Si la table n'existe pas, retourner les paramètres par défaut au lieu d'une erreur
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn('[API PLATFORM-SETTINGS] Table platform_settings does not exist, returning defaults');
        const defaultSettings = {
          global_fee_percentage: 5,
          global_fee_type: 'percentage',
          global_fee_paid_by: 'client',
          withdrawal_fee_percentage: 2.5,
          min_fee_cents: 50,
          fee_by_category: {},
          fee_by_location: {},
          fee_by_location_type: {},
        };

        return NextResponse.json({
          success: true,
          data: { settings: defaultSettings },
        });
      }

      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des paramètres' },
        { status: 500 }
      );
    }

    // Si pas de paramètres, retourner les valeurs par défaut
    const defaultSettings = {
      global_fee_percentage: 5,
      global_fee_type: 'percentage',
      global_fee_paid_by: 'client',
      withdrawal_fee_percentage: 2.5,
      min_fee_cents: 50,
      fee_by_category: {},
      fee_by_location: {},
      fee_by_location_type: {},
    };

    const finalSettings = settings || defaultSettings;

    // Si pas admin, retourner uniquement le withdrawal_fee_percentage (accès public)
    if (isAdmin !== 'true') {
      return NextResponse.json({
        success: true,
        data: {
          settings: {
            withdrawal_fee_percentage: finalSettings.withdrawal_fee_percentage || 2.5
          }
        },
      });
    }

    // Si admin, retourner tous les paramètres
    return NextResponse.json({
      success: true,
      data: { settings: finalSettings },
    });

  } catch (error) {
    console.error('[API PLATFORM-SETTINGS] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Mettre à jour les paramètres de la plateforme
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin');

    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    // Valider les données
    if (settings.global_fee_percentage < 0 || settings.global_fee_percentage > 100) {
      return NextResponse.json(
        { success: false, error: 'Le pourcentage doit être entre 0 et 100' },
        { status: 400 }
      );
    }

    // Upsert les paramètres
    const { data, error } = await supabase
      .from('platform_settings')
      .upsert({
        id: 1, // ID fixe pour les paramètres globaux
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[API PLATFORM-SETTINGS] Error updating:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { settings: data },
    });

  } catch (error) {
    console.error('[API PLATFORM-SETTINGS] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
