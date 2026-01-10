// ============================================================================
// CURRENCY: Gestion des devises et formatage des prix
// ============================================================================

/**
 * Formate un prix en centimes vers une chaîne lisible
 */
export function formatPrice(
  cents: number,
  currency: string = 'USD',
  locale: string = 'fr-FR'
): string {
  const amount = cents / 100;

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Symboles de devises
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  HTG: 'G',
  GBP: '£',
  CAD: 'C$',
};

/**
 * Récupère le symbole d'une devise
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Formate un prix simple avec symbole
 */
export function formatPriceSimple(cents: number, currency: string = 'USD'): string {
  const amount = cents / 100;
  const symbol = getCurrencySymbol(currency);

  return `${symbol}${amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Alias pour formatPriceSimple
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return formatPriceSimple(amount * 100, currency);
}