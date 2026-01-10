// ============================================================================
// Currency Conversion Utilities
// ============================================================================

import { createClient } from '@/lib/supabase/client';

/**
 * Récupère le taux de change entre deux devises depuis la base de données
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  try {
    // Même devise = taux 1
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const supabase = createClient();

    // Récupérer les informations des deux devises
    const { data: currencies, error } = await supabase
      .from('currencies')
      .select('code, conversion_mode, manual_rate_to_default, auto_rate_to_default')
      .in('code', [fromCurrency, toCurrency])
      .eq('is_active', true);

    if (error || !currencies || currencies.length !== 2) {
      console.error('[Currency] Error fetching currencies:', error);
      return null;
    }

    const fromCurr = currencies.find(c => c.code === fromCurrency);
    const toCurr = currencies.find(c => c.code === toCurrency);

    if (!fromCurr || !toCurr) {
      console.error('[Currency] One or both currencies not found');
      return null;
    }

    // Sélectionner le taux approprié selon le mode
    const fromRate = fromCurr.conversion_mode === 'manual'
      ? fromCurr.manual_rate_to_default
      : fromCurr.auto_rate_to_default;

    const toRate = toCurr.conversion_mode === 'manual'
      ? toCurr.manual_rate_to_default
      : toCurr.auto_rate_to_default;

    if (!fromRate || !toRate) {
      console.error('[Currency] Exchange rates not available');
      return null;
    }

    // Conversion: from -> USD -> to
    // auto_rate_to_default signifie: "combien d'unités de cette devise pour 1 unité de USD"
    // Exemple: auto_rate_to_default pour HTG = 132 signifie 1 USD = 132 HTG

    // Pour convertir FROM vers USD: diviser par fromRate
    // Pour convertir USD vers TO: multiplier par toRate
    const rate = toRate / fromRate;

    return rate;
  } catch (error) {
    console.error('[Currency] Error getting exchange rate:', error);
    return null;
  }
}

/**
 * Convertit un montant d'une devise vers USD
 */
export async function convertToUSD(
  amount: number,
  fromCurrency: string
): Promise<number | null> {
  try {
    // Déjà en USD
    if (fromCurrency === 'USD') {
      return amount;
    }

    const supabase = createClient();

    // Essayer d'abord de récupérer le taux depuis exchange_rates_history
    const { data: historyRate, error: historyError } = await supabase
      .from('exchange_rates_history')
      .select('rate, from_currency_code, to_currency_code')
      .eq('from_currency_code', fromCurrency)
      .eq('to_currency_code', 'USD')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!historyError && historyRate) {
      const rate = historyRate.rate;
      const amountInUSD = amount * rate;

      console.log('[Currency] 💱 Conversion ' + fromCurrency + ' → USD (depuis history):', {
        amount,
        rate,
        amountInUSD,
        calculation: `${amount} × ${rate} = ${amountInUSD}`
      });

      return amountInUSD;
    }

    // Sinon essayer depuis USD vers fromCurrency et inverser
    const { data: reverseRate, error: reverseError } = await supabase
      .from('exchange_rates_history')
      .select('rate, from_currency_code, to_currency_code')
      .eq('from_currency_code', 'USD')
      .eq('to_currency_code', fromCurrency)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!reverseError && reverseRate) {
      const rate = reverseRate.rate;
      const amountInUSD = amount / rate;

      console.log('[Currency] 💱 Conversion ' + fromCurrency + ' → USD (inverse depuis history):', {
        amount,
        rate,
        amountInUSD,
        calculation: `${amount} / ${rate} = ${amountInUSD}`
      });

      return amountInUSD;
    }

    // Si pas de taux dans l'historique, essayer depuis currencies
    const { data: currency, error } = await supabase
      .from('currencies')
      .select('code, conversion_mode, manual_rate_to_default, auto_rate_to_default')
      .eq('code', fromCurrency)
      .eq('is_active', true)
      .single();

    if (error || !currency) {
      console.error('[Currency] Error fetching currency:', error);
      return null;
    }

    // Sélectionner le taux approprié
    const rate = currency.conversion_mode === 'manual'
      ? currency.manual_rate_to_default
      : currency.auto_rate_to_default;

    if (!rate) {
      console.error('[Currency] Exchange rate not available for', fromCurrency);
      return null;
    }

    // Convertir vers USD: diviser par le taux
    // Exemple: 132 HTG -> USD: 132 / 132 = 1 USD
    const amountInUSD = amount / rate;

    console.log('[Currency] 💱 Conversion ' + fromCurrency + ' → USD (depuis currencies):', {
      amount,
      rate,
      amountInUSD,
      calculation: `${amount} / ${rate} = ${amountInUSD}`
    });

    return amountInUSD;
  } catch (error) {
    console.error('[Currency] Error converting to USD:', error);
    return null;
  }
}

/**
 * Convertit un montant depuis USD vers une autre devise
 */
export async function convertFromUSD(
  amountInUSD: number,
  toCurrency: string
): Promise<number | null> {
  try {
    // Déjà en USD
    if (toCurrency === 'USD') {
      return amountInUSD;
    }

    const supabase = createClient();

    // Essayer d'abord de récupérer le taux depuis exchange_rates_history
    const { data: historyRate, error: historyError } = await supabase
      .from('exchange_rates_history')
      .select('rate, from_currency_code, to_currency_code')
      .eq('from_currency_code', 'USD')
      .eq('to_currency_code', toCurrency)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!historyError && historyRate) {
      const rate = historyRate.rate;
      const convertedAmount = amountInUSD * rate;

      console.log('[Currency] 💱 Conversion USD → ' + toCurrency + ' (depuis history):', {
        amountInUSD,
        rate,
        convertedAmount,
        calculation: `${amountInUSD} × ${rate} = ${convertedAmount}`
      });

      return convertedAmount;
    }

    // Si pas de taux dans l'historique, essayer depuis currencies
    const { data: currency, error } = await supabase
      .from('currencies')
      .select('code, conversion_mode, manual_rate_to_default, auto_rate_to_default')
      .eq('code', toCurrency)
      .eq('is_active', true)
      .single();

    if (error || !currency) {
      console.error('[Currency] Error fetching currency:', error);
      return null;
    }

    console.log('[Currency] 🔍 Devise récupérée:', {
      code: currency.code,
      mode: currency.conversion_mode,
      manual_rate: currency.manual_rate_to_default,
      auto_rate: currency.auto_rate_to_default
    });

    // Sélectionner le taux approprié
    const rate = currency.conversion_mode === 'manual'
      ? currency.manual_rate_to_default
      : currency.auto_rate_to_default;

    if (!rate) {
      console.error('[Currency] ❌ Exchange rate not available for', toCurrency);
      console.error('[Currency] Currency data:', currency);
      return null;
    }

    // Convertir depuis USD: multiplier par le taux
    // Exemple: 1 USD -> HTG: 1 * 132 = 132 HTG
    const convertedAmount = amountInUSD * rate;

    console.log('[Currency] 💱 Conversion USD → ' + toCurrency + ' (depuis currencies):', {
      amountInUSD,
      rate,
      convertedAmount,
      calculation: `${amountInUSD} × ${rate} = ${convertedAmount}`
    });

    return convertedAmount;
  } catch (error) {
    console.error('[Currency] Error converting from USD:', error);
    return null;
  }
}

/**
 * Convertit un montant d'une devise vers une autre
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  try {
    // Même devise
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await getExchangeRate(fromCurrency, toCurrency);

    if (rate === null) {
      return null;
    }

    return amount * rate;
  } catch (error) {
    console.error('[Currency] Error converting currency:', error);
    return null;
  }
}

/**
 * Formate un montant avec la devise appropriée
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string,
  locale: string = 'fr-FR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error('[Currency] Error formatting currency:', error);
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}
