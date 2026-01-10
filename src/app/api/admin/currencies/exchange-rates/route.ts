// ============================================================================
// API: Exchange Rates - Gérer les taux de change
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// API gratuite pour les taux de change: https://www.exchangerate-api.com/
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY || 'demo'; // Remplacer par votre clé API
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

/**
 * GET - Mettre à jour les taux de change automatiques
 */
export async function GET(request: Request) {
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

    console.log('[API EXCHANGE-RATES] Updating exchange rates...');

    // Récupérer la devise par défaut
    const { data: defaultCurrency, error: defaultError } = await supabase
      .from('currencies')
      .select('code')
      .eq('is_default', true)
      .single();

    if (defaultError || !defaultCurrency) {
      return NextResponse.json(
        { success: false, error: 'Aucune devise par défaut trouvée' },
        { status: 400 }
      );
    }

    const baseCurrency = defaultCurrency.code;

    // Récupérer toutes les devises actives avec mode auto
    const { data: currencies, error: currenciesError } = await supabase
      .from('currencies')
      .select('id, code')
      .eq('is_active', true)
      .eq('conversion_mode', 'auto');

    if (currenciesError || !currencies) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des devises' },
        { status: 500 }
      );
    }

    // Récupérer les taux de change depuis l'API
    const response = await fetch(`${EXCHANGE_RATE_API_URL}/${baseCurrency}`);

    if (!response.ok) {
      console.error('[API EXCHANGE-RATES] API error:', response.statusText);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des taux de change' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rates = data.rates;

    console.log('[API EXCHANGE-RATES] Rates fetched:', Object.keys(rates).length, 'currencies');

    // Mettre à jour chaque devise
    const updates = [];
    const history = [];

    for (const currency of currencies) {
      if (currency.code === baseCurrency) {
        // La devise par défaut a toujours un taux de 1
        updates.push(
          supabase
            .from('currencies')
            .update({
              auto_rate_to_default: 1.0,
              last_rate_update: new Date().toISOString(),
            })
            .eq('id', currency.id)
        );
      } else if (rates[currency.code]) {
        // L'API retourne: rates['HTG'] = 132 signifie 1 USD = 132 HTG
        // C'est exactement ce qu'on veut stocker dans auto_rate_to_default!
        const rateToDefault = rates[currency.code];

        updates.push(
          supabase
            .from('currencies')
            .update({
              auto_rate_to_default: rateToDefault,
              last_rate_update: new Date().toISOString(),
            })
            .eq('id', currency.id)
        );

        // Enregistrer dans l'historique
        history.push({
          from_currency_code: baseCurrency,
          to_currency_code: currency.code,
          rate: rateToDefault,
          source: 'api',
        });
      }
    }

    // Exécuter toutes les mises à jour
    await Promise.all(updates);

    // Enregistrer l'historique
    if (history.length > 0) {
      await supabase
        .from('exchange_rates_history')
        .insert(history);
    }

    console.log('[API EXCHANGE-RATES] Updated', updates.length, 'currencies');

    return NextResponse.json({
      success: true,
      data: {
        updated_count: updates.length,
        base_currency: baseCurrency,
      },
    });

  } catch (error) {
    console.error('[API EXCHANGE-RATES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Convertir un montant d'une devise à une autre
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { amount, from_currency, to_currency } = body;

    if (!amount || !from_currency || !to_currency) {
      return NextResponse.json(
        { success: false, error: 'Montant et devises requis' },
        { status: 400 }
      );
    }

    // Récupérer les informations des devises
    const { data: currencies, error } = await supabase
      .from('currencies')
      .select('*')
      .in('code', [from_currency, to_currency]);

    if (error || !currencies || currencies.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Devises non trouvées' },
        { status: 404 }
      );
    }

    const fromCurr = currencies.find(c => c.code === from_currency);
    const toCurr = currencies.find(c => c.code === to_currency);

    if (!fromCurr || !toCurr) {
      return NextResponse.json(
        { success: false, error: 'Devises invalides' },
        { status: 400 }
      );
    }

    // Calculer le taux de conversion
    let rate;
    if (from_currency === to_currency) {
      rate = 1;
    } else {
      // Utiliser le taux manuel ou automatique selon la configuration
      const fromRate = fromCurr.conversion_mode === 'manual'
        ? fromCurr.manual_rate_to_default
        : fromCurr.auto_rate_to_default;

      const toRate = toCurr.conversion_mode === 'manual'
        ? toCurr.manual_rate_to_default
        : toCurr.auto_rate_to_default;

      if (!fromRate || !toRate) {
        return NextResponse.json(
          { success: false, error: 'Taux de change non disponible' },
          { status: 400 }
        );
      }

      // Conversion: from -> default -> to
      // auto_rate_to_default signifie: "combien d'unités de cette devise pour 1 unité de devise par défaut"
      // Exemple: auto_rate_to_default pour EUR = 0.92 signifie 1 USD = 0.92 EUR
      // Exemple: auto_rate_to_default pour HTG = 132 signifie 1 USD = 132 HTG

      // Pour convertir FROM vers DEFAULT: diviser par fromRate
      // 100 EUR -> USD: 100 / 0.92 = 108.7 USD
      const amountInDefault = amount / fromRate;

      // Pour convertir DEFAULT vers TO: multiplier par toRate
      // 108.7 USD -> HTG: 108.7 * 132 = 14348 HTG
      const convertedAmount = amountInDefault * toRate;
      rate = convertedAmount / amount;
    }

    // Calculer les frais de conversion
    const conversionFee = (amount * rate * toCurr.conversion_fee_percentage) / 100;
    const finalAmount = (amount * rate) - conversionFee;

    return NextResponse.json({
      success: true,
      data: {
        from_amount: amount,
        from_currency: from_currency,
        to_currency: to_currency,
        rate: rate,
        converted_amount: amount * rate,
        conversion_fee: conversionFee,
        final_amount: finalAmount,
      },
    });

  } catch (error) {
    console.error('[API EXCHANGE-RATES] Conversion error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
