"use client";

import React from "react";
import { useCurrency } from "@/hooks/useCurrency";

interface CurrencyConverterProps {
  amount: number; // Montant en USD (venant de la DB)
  showOriginal?: boolean;
  className?: string;
}

/**
 * Composant pour convertir et afficher un montant USD dans la devise par défaut du système.
 */
export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  amount,
  showOriginal = false,
  className = "",
}) => {
  const { convertFromUSD, formatAmount, loading, defaultCurrency } = useCurrency();

  if (loading) {
    return <span className="animate-pulse opacity-50">...</span>;
  }

  const convertedAmount = convertFromUSD(amount);
  const formattedAmount = formatAmount(convertedAmount);

  return (
    <span className={className}>
      {formattedAmount}
      {showOriginal && defaultCurrency?.code !== "USD" && (
        <span className="ml-1 text-[10px] opacity-50">
          (${amount.toFixed(2)})
        </span>
      )}
    </span>
  );
};

/**
 * Fonction utilitaire pour obtenir la valeur convertie (pour usage hors JSX)
 */
export const getConvertedValue = (amount: number, rate: number | null) => {
  if (!rate) return amount;
  return amount * rate;
};
