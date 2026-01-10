// ============================================================================
// CALCUL DYNAMIQUE DES FRAIS DE PLATEFORME
// ============================================================================

import { PlatformFeeConfig, DEFAULT_PLATFORM_FEE } from '@/types/service';

/**
 * Résultat du calcul des frais
 */
export interface FeeCalculationResult {
  /**
   * Montant des frais en centimes
   */
  fee_cents: number;

  /**
   * Sous-total (montant avant frais) en centimes
   */
  subtotal_cents: number;

  /**
   * Total (sous-total + frais si paid_by = 'client') en centimes
   */
  total_cents: number;

  /**
   * Montant reçu par le prestataire en centimes
   */
  provider_receives_cents: number;

  /**
   * Configuration utilisée pour le calcul
   */
  fee_config: PlatformFeeConfig;

  /**
   * Détails du calcul (pour debug/affichage)
   */
  breakdown: {
    base_fee: number;
    min_applied: boolean;
    max_applied: boolean;
    formula: string;
  };
}

/**
 * Calculer les frais de plateforme pour un montant donné
 *
 * @param subtotal_cents - Montant du service + extras en centimes
 * @param customFeeConfig - Configuration personnalisée (optionnel)
 * @returns Résultat détaillé du calcul
 *
 * @example
 * // Service à 100€ avec frais par défaut (5%)
 * const result = calculatePlatformFees(10000);
 * // result.fee_cents = 500 (5€)
 * // result.total_cents = 10500 (105€)
 *
 * @example
 * // Service à 20€ avec frais personnalisés (10%)
 * const result = calculatePlatformFees(2000, { fee_percentage: 10 });
 * // result.fee_cents = 200 (2€)
 * // result.total_cents = 2200 (22€)
 */
export function calculatePlatformFees(
  subtotal_cents: number,
  customFeeConfig?: Partial<PlatformFeeConfig>
): FeeCalculationResult {
  // Fusionner avec la config par défaut
  const feeConfig: PlatformFeeConfig = {
    ...DEFAULT_PLATFORM_FEE,
    ...customFeeConfig,
  };

  let baseFee = 0;
  let formula = '';

  // Calculer les frais selon le type
  switch (feeConfig.fee_type) {
    case 'percentage':
      baseFee = Math.round(subtotal_cents * (feeConfig.fee_percentage / 100));
      formula = `${subtotal_cents} × ${feeConfig.fee_percentage}% = ${baseFee}`;
      break;

    case 'fixed':
      baseFee = feeConfig.fixed_amount_cents || 0;
      formula = `Fixed: ${baseFee} centimes`;
      break;

    case 'hybrid':
      const percentageFee = Math.round(subtotal_cents * (feeConfig.fee_percentage / 100));
      const fixedFee = feeConfig.fixed_amount_cents || 0;
      baseFee = percentageFee + fixedFee;
      formula = `${percentageFee} (${feeConfig.fee_percentage}%) + ${fixedFee} (fixed) = ${baseFee}`;
      break;
  }

  // Appliquer les limites min/max
  let finalFee = baseFee;
  let minApplied = false;
  let maxApplied = false;

  if (feeConfig.min_fee_cents !== undefined && finalFee < feeConfig.min_fee_cents) {
    finalFee = feeConfig.min_fee_cents;
    minApplied = true;
    formula += ` → min: ${finalFee}`;
  }

  if (feeConfig.max_fee_cents !== undefined && finalFee > feeConfig.max_fee_cents) {
    finalFee = feeConfig.max_fee_cents;
    maxApplied = true;
    formula += ` → max: ${finalFee}`;
  }

  // Calculer les montants finaux selon qui paie
  let totalCents: number;
  let providerReceivesCents: number;

  switch (feeConfig.paid_by) {
    case 'client':
      // Client paie les frais (ajouté au total)
      totalCents = subtotal_cents + finalFee;
      providerReceivesCents = subtotal_cents;
      break;

    case 'provider':
      // Prestataire paie les frais (déduit de son paiement)
      totalCents = subtotal_cents;
      providerReceivesCents = subtotal_cents - finalFee;
      break;

    case 'split':
      // Frais partagés 50/50
      const halfFee = Math.round(finalFee / 2);
      totalCents = subtotal_cents + halfFee;
      providerReceivesCents = subtotal_cents - halfFee;
      break;

    default:
      totalCents = subtotal_cents + finalFee;
      providerReceivesCents = subtotal_cents;
  }

  return {
    fee_cents: finalFee,
    subtotal_cents,
    total_cents: totalCents,
    provider_receives_cents: providerReceivesCents,
    fee_config: feeConfig,
    breakdown: {
      base_fee: baseFee,
      min_applied: minApplied,
      max_applied: maxApplied,
      formula,
    },
  };
}

/**
 * Formater un montant en centimes vers une chaîne lisible
 *
 * @example
 * formatCents(10000) // "100.00"
 * formatCents(10050) // "100.50"
 */
export function formatCents(cents: number, currency: string = 'EUR'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Obtenir un label descriptif de la configuration des frais
 *
 * @example
 * getFeeLabel({ fee_percentage: 5, fee_type: 'percentage' })
 * // "Frais de service (5%)"
 */
export function getFeeLabel(feeConfig: PlatformFeeConfig): string {
  switch (feeConfig.fee_type) {
    case 'percentage':
      return `Frais de service (${feeConfig.fee_percentage}%)`;

    case 'fixed':
      return `Frais de service (${formatCents(feeConfig.fixed_amount_cents || 0)})`;

    case 'hybrid':
      return `Frais de service (${feeConfig.fee_percentage}% + ${formatCents(feeConfig.fixed_amount_cents || 0)})`;

    default:
      return 'Frais de service';
  }
}
