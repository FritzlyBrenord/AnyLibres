// ============================================================================
// API: Calcul des frais de checkout
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

interface CalculateFeesRequest {
  serviceId: string;
  subtotal_cents: number; // Service + extras
  categoryId?: string;
  locationType?: string; // 'remote' | 'on-site' | 'hybrid'
  country?: string; // Code pays (ex: 'FR', 'US')
}

interface FeeCalculationResponse {
  success: boolean;
  data?: {
    // Montants
    subtotal_cents: number;
    fee_cents: number;
    client_pays_cents: number; // Ce que le client paie
    provider_receives_cents: number; // Ce que le prestataire reçoit
    platform_receives_cents: number; // Ce que la plateforme reçoit

    // Configuration appliquée
    fee_config: {
      fee_percentage: number;
      fee_type: 'percentage' | 'fixed';
      paid_by: 'client' | 'provider' | 'split';
      min_fee_cents: number;
      source: 'category' | 'location_type' | 'country' | 'global'; // D'où vient la config
    };

    // Détails pour affichage
    breakdown: {
      formula: string;
      client_breakdown: string; // Ex: "100€ (service) + 5€ (frais) = 105€"
      provider_breakdown: string; // Ex: "100€ (service) - 0€ (frais) = 100€"
    };
  };
  error?: string;
}

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CalculateFeesRequest = await request.json();

    const { serviceId, subtotal_cents, categoryId, locationType, country } = body;

    console.log('📊 [CALCULATE-FEES] Requête reçue:', {
      serviceId,
      subtotal_cents,
      categoryId,
      locationType,
      country
    });

    // Validation
    if (!serviceId || subtotal_cents === undefined || subtotal_cents < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'serviceId et subtotal_cents sont requis',
        } as FeeCalculationResponse,
        { status: 400 }
      );
    }

    // 1. Récupérer les paramètres de la plateforme
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de récupérer les paramètres de la plateforme',
        } as FeeCalculationResponse,
        { status: 500 }
      );
    }

    // 2. Déterminer quelle configuration de frais utiliser (ORDRE DE PRIORITÉ)
    let feePercentage = settings.global_fee_percentage;
    let feeType: 'percentage' | 'fixed' = settings.global_fee_type;
    let paidBy: 'client' | 'provider' | 'split' = settings.global_fee_paid_by;
    let minFeeCents = settings.min_fee_cents || 0;
    let source: 'category' | 'location_type' | 'country' | 'global' = 'global';

    // PRIORITÉ 1: Frais par catégorie
    if (categoryId && settings.fee_by_category && settings.fee_by_category[categoryId] !== undefined) {
      feePercentage = settings.fee_by_category[categoryId];
      source = 'category';
    }
    // PRIORITÉ 2: Frais par type de localisation
    else if (locationType && settings.fee_by_location_type && settings.fee_by_location_type[locationType] !== undefined) {
      feePercentage = settings.fee_by_location_type[locationType];
      source = 'location_type';
    }
    // PRIORITÉ 3: Frais par pays
    else if (country && settings.fee_by_location && settings.fee_by_location[country] !== undefined) {
      feePercentage = settings.fee_by_location[country];
      source = 'country';
    }
    // PRIORITÉ 4: Frais global (déjà assigné par défaut)

    // 3. Calculer les frais
    let feeCents = 0;

    if (feeType === 'percentage') {
      feeCents = Math.round(subtotal_cents * (feePercentage / 100));
    } else if (feeType === 'fixed') {
      feeCents = Math.round(feePercentage * 100); // feePercentage contient le montant fixe en euros
    }

    // Appliquer le frais minimum
    if (feeCents < minFeeCents) {
      feeCents = minFeeCents;
    }

    // 4. Calculer qui paie quoi
    let clientPaysCents = subtotal_cents;
    let providerReceivesCents = subtotal_cents;
    let platformReceivesCents = feeCents;

    if (paidBy === 'client') {
      // Le client paie le service + les frais
      clientPaysCents = subtotal_cents + feeCents;
      providerReceivesCents = subtotal_cents;
    } else if (paidBy === 'provider') {
      // Le prestataire paie les frais (déduit de ce qu'il reçoit)
      clientPaysCents = subtotal_cents;
      providerReceivesCents = subtotal_cents - feeCents;
    } else if (paidBy === 'split') {
      // Les deux paient 50/50
      const halfFee = Math.round(feeCents / 2);
      clientPaysCents = subtotal_cents + halfFee;
      providerReceivesCents = subtotal_cents - halfFee;
    }

    // 5. Créer les détails pour affichage
    const subtotalEuros = (subtotal_cents / 100).toFixed(2);
    const feeEuros = (feeCents / 100).toFixed(2);
    const clientPaysEuros = (clientPaysCents / 100).toFixed(2);
    const providerReceivesEuros = (providerReceivesCents / 100).toFixed(2);

    let formula = '';
    if (feeType === 'percentage') {
      formula = `${subtotalEuros}€ × ${feePercentage}% = ${feeEuros}€`;
    } else {
      formula = `Frais fixe: ${feeEuros}€`;
    }

    if (feeCents === minFeeCents && minFeeCents > 0) {
      formula += ` (minimum appliqué)`;
    }

    let clientBreakdown = '';
    let providerBreakdown = '';

    if (paidBy === 'client') {
      clientBreakdown = `${subtotalEuros}€ (service) + ${feeEuros}€ (frais) = ${clientPaysEuros}€`;
      providerBreakdown = `${providerReceivesEuros}€ (reçoit le montant du service)`;
    } else if (paidBy === 'provider') {
      clientBreakdown = `${clientPaysEuros}€ (paie le service uniquement)`;
      providerBreakdown = `${subtotalEuros}€ (service) - ${feeEuros}€ (frais) = ${providerReceivesEuros}€`;
    } else {
      const halfFeeEuros = ((feeCents / 2) / 100).toFixed(2);
      clientBreakdown = `${subtotalEuros}€ (service) + ${halfFeeEuros}€ (frais 50%) = ${clientPaysEuros}€`;
      providerBreakdown = `${subtotalEuros}€ (service) - ${halfFeeEuros}€ (frais 50%) = ${providerReceivesEuros}€`;
    }

    // 6. Retourner le résultat
    const result = {
      success: true,
      data: {
        subtotal_cents,
        fee_cents: feeCents,
        client_pays_cents: clientPaysCents,
        provider_receives_cents: providerReceivesCents,
        platform_receives_cents: platformReceivesCents,

        fee_config: {
          fee_percentage: feePercentage,
          fee_type: feeType,
          paid_by: paidBy,
          min_fee_cents: minFeeCents,
          source,
        },

        breakdown: {
          formula,
          client_breakdown: clientBreakdown,
          provider_breakdown: providerBreakdown,
        },
      },
    } as FeeCalculationResponse;

    console.log('✅ [CALCULATE-FEES] Résultat:', {
      subtotal_cents,
      fee_cents: feeCents,
      client_pays_cents: clientPaysCents,
      provider_receives_cents: providerReceivesCents,
      source,
      paid_by: paidBy
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[CALCULATE_FEES] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur serveur',
      } as FeeCalculationResponse,
      { status: 500 }
    );
  }
}
