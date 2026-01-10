// ============================================================================
// UTILITAIRES DE CONVERSION DE PRIX
// ============================================================================

/**
 * Convertir des euros en centimes
 *
 * @param euros - Montant en euros (ex: 22.50)
 * @returns Montant en centimes (ex: 2250)
 *
 * @example
 * eurosToCents(22.50) // 2250
 * eurosToCents(100)   // 10000
 * eurosToCents(0.99)  // 99
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convertir des centimes en euros
 *
 * @param cents - Montant en centimes (ex: 2250)
 * @returns Montant en euros (ex: 22.50)
 *
 * @example
 * centsToEuros(2250) // 22.50
 * centsToEuros(10000) // 100
 * centsToEuros(99)   // 0.99
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Formater un montant en centimes vers une chaîne avec symbole monétaire
 *
 * @param cents - Montant en centimes
 * @param currency - Code de devise (défaut: EUR)
 * @param locale - Locale pour le formatage (défaut: fr-FR)
 * @returns Chaîne formatée (ex: "22,50 €")
 *
 * @example
 * formatCentsToMoney(2250)           // "22,50 €"
 * formatCentsToMoney(2250, 'USD')    // "22,50 $"
 * formatCentsToMoney(2250, 'EUR', 'en-US') // "€22.50"
 */
export function formatCentsToMoney(
  cents: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  const euros = centsToEuros(cents);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(euros);
}

/**
 * Parser une chaîne de prix en centimes
 * Accepte différents formats: "22", "22.50", "22,50", "22.5"
 *
 * @param priceString - Prix en string
 * @returns Montant en centimes
 *
 * @example
 * parsePriceToCents("22")      // 2200
 * parsePriceToCents("22.50")   // 2250
 * parsePriceToCents("22,50")   // 2250
 * parsePriceToCents("0.99")    // 99
 */
export function parsePriceToCents(priceString: string): number {
  // Remplacer virgule par point
  const normalized = priceString.replace(',', '.');

  // Convertir en nombre
  const euros = parseFloat(normalized);

  if (isNaN(euros)) {
    throw new Error(`Invalid price string: ${priceString}`);
  }

  return eurosToCents(euros);
}

/**
 * Valider qu'un montant en centimes est valide
 *
 * @param cents - Montant en centimes
 * @returns true si valide, false sinon
 */
export function isValidCents(cents: number): boolean {
  return (
    typeof cents === 'number' &&
    !isNaN(cents) &&
    isFinite(cents) &&
    cents >= 0 &&
    Number.isInteger(cents)
  );
}

/**
 * Arrondir un montant en centimes au centime près
 * Utile après des calculs de pourcentage
 *
 * @param cents - Montant (peut contenir des décimales)
 * @returns Montant arrondi
 *
 * @example
 * roundCents(2250.6) // 2251
 * roundCents(2250.4) // 2250
 */
export function roundCents(cents: number): number {
  return Math.round(cents);
}

/**
 * Calculer un pourcentage d'un montant en centimes
 *
 * @param cents - Montant de base en centimes
 * @param percentage - Pourcentage (ex: 5 pour 5%)
 * @returns Montant du pourcentage en centimes
 *
 * @example
 * calculatePercentage(10000, 5)  // 500 (5% de 100€)
 * calculatePercentage(2000, 10)  // 200 (10% de 20€)
 */
export function calculatePercentage(cents: number, percentage: number): number {
  return roundCents((cents * percentage) / 100);
}

/**
 * Additionner plusieurs montants en centimes de manière sûre
 *
 * @param amounts - Liste de montants en centimes
 * @returns Total en centimes
 *
 * @example
 * sumCents(1000, 500, 250) // 1750
 */
export function sumCents(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Comparer deux montants en centimes
 *
 * @param cents1 - Premier montant
 * @param cents2 - Deuxième montant
 * @returns -1 si cents1 < cents2, 0 si égaux, 1 si cents1 > cents2
 */
export function compareCents(cents1: number, cents2: number): number {
  if (cents1 < cents2) return -1;
  if (cents1 > cents2) return 1;
  return 0;
}

// ============================================================================
// CONSTANTES UTILES
// ============================================================================

/** 1 euro en centimes */
export const ONE_EURO = 100;

/** 10 euros en centimes */
export const TEN_EUROS = 1000;

/** 100 euros en centimes */
export const HUNDRED_EUROS = 10000;

/** 1000 euros en centimes */
export const THOUSAND_EUROS = 100000;
