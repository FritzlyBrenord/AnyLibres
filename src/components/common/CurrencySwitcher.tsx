// ============================================================================
// Component: CurrencySwitcher - Sélecteur de devise
// ============================================================================

"use client";

import { useState, useEffect } from "react";

interface Currency {
  code: string;
  symbol: string;
  flag: string;
  name: string;
}

export default function CurrencySwitcher() {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les devises disponibles depuis la base de données
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch("/api/currencies/active");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.currencies) {
            setCurrencies(data.currencies);
          }
        }
      } catch (error) {
        console.error("[CurrencySwitcher] Error fetching currencies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();

    // Charger la devise sauvegardée
    const savedCurrency = localStorage.getItem("selectedCurrency");
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
  }, []);

  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    localStorage.setItem("selectedCurrency", currencyCode);

    // Émettre un événement personnalisé pour notifier le changement
    const event = new CustomEvent("currencyChanged", {
      detail: { code: currencyCode },
    });
    window.dispatchEvent(event);
  };

  if (loading) {
    return (
      <div className="relative inline-block">
        <div className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-400 animate-pulse">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (currencies.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-block">
      <select
        value={selectedCurrency}
        onChange={(e) => handleCurrencyChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.flag} {currency.code}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}
