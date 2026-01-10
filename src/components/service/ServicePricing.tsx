// ============================================================================
// Component: ServicePricing - Tarification et actions du service
// ============================================================================

"use client";

import { useState, useEffect, useMemo } from "react";
import { Service, ServiceExtra } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import { formatPrice } from "@/utils/currency";
import { useSmartTranslate } from "@/hooks/useSmartTranslate";
import { convertFromUSD } from "@/utils/lib/currencyConversion";

interface ServicePricingProps {
  service: Service;
  onOrder: (extras: string[]) => void;
  onContact: () => void;
  selectedExtras: number[];
  onToggleExtra: (index: number) => void;
}

function TranslatedText({ text }: { text: string }) {
  const { translatedText } = useSmartTranslate(text, "fr");
  return <>{translatedText}</>;
}

export default function ServicePricing({
  service,
  onOrder,
  onContact,
  selectedExtras,
  onToggleExtra,
}: ServicePricingProps) {
  const { t, getText } = useLanguage();
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [convertedBasePrice, setConvertedBasePrice] = useState<number>(
    service.base_price_cents / 100
  );
  const [convertedPriceMin, setConvertedPriceMin] = useState<number | null>(
    service.price_min_cents ? service.price_min_cents / 100 : null
  );
  const [convertedPriceMax, setConvertedPriceMax] = useState<number | null>(
    service.price_max_cents ? service.price_max_cents / 100 : null
  );
  const [convertedExtras, setConvertedExtras] = useState<Map<number, number>>(
    new Map()
  );

  // Charger la devise sélectionnée et écouter les changements
  useEffect(() => {
    const savedCurrency = localStorage.getItem("selectedCurrency");
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }

    const handleCurrencyChange = (event: CustomEvent) => {
      setSelectedCurrency(event.detail.code);
    };

    window.addEventListener(
      "currencyChanged",
      handleCurrencyChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "currencyChanged",
        handleCurrencyChange as EventListener
      );
    };
  }, []);

  // Convertir les prix quand la devise change
  useEffect(() => {
    const convertPrices = async () => {
      if (selectedCurrency === "USD") {
        setConvertedBasePrice(service.base_price_cents / 100);
        setConvertedPriceMin(
          service.price_min_cents ? service.price_min_cents / 100 : null
        );
        setConvertedPriceMax(
          service.price_max_cents ? service.price_max_cents / 100 : null
        );

        // Convertir les extras
        const extrasMap = new Map<number, number>();
        if (service.extras) {
          service.extras.forEach((extra: any, index: number) => {
            if (extra.price_cents) {
              extrasMap.set(index, extra.price_cents / 100);
            }
          });
        }
        setConvertedExtras(extrasMap);
        return;
      }

      // Convertir base_price
      const convertedBase = await convertFromUSD(
        service.base_price_cents / 100,
        selectedCurrency
      );
      if (convertedBase !== null) {
        setConvertedBasePrice(convertedBase);
      }

      // Convertir price_min
      if (service.price_min_cents) {
        const convertedMin = await convertFromUSD(
          service.price_min_cents / 100,
          selectedCurrency
        );
        if (convertedMin !== null) {
          setConvertedPriceMin(convertedMin);
        }
      }

      // Convertir price_max
      if (service.price_max_cents) {
        const convertedMax = await convertFromUSD(
          service.price_max_cents / 100,
          selectedCurrency
        );
        if (convertedMax !== null) {
          setConvertedPriceMax(convertedMax);
        }
      }

      // Convertir les extras
      const extrasMap = new Map<number, number>();
      if (service.extras) {
        for (let i = 0; i < service.extras.length; i++) {
          const extra = service.extras[i] as any;
          if (extra.price_cents) {
            const converted = await convertFromUSD(
              extra.price_cents / 100,
              selectedCurrency
            );
            if (converted !== null) {
              extrasMap.set(i, converted);
            }
          }
        }
      }
      setConvertedExtras(extrasMap);
    };

    convertPrices();
  }, [
    service.base_price_cents,
    service.price_min_cents,
    service.price_max_cents,
    service.extras,
    selectedCurrency,
  ]);

  const toggleExtra = (index: number) => {
    onToggleExtra(index);
  };

  // Calculer le total converti (en unités, pas en centimes)
  const calculateTotal = () => {
    let total = convertedBasePrice;

    if (service.extras && selectedExtras.length > 0) {
      selectedExtras.forEach((index) => {
        const convertedExtraPrice = convertedExtras.get(index);
        if (convertedExtraPrice !== undefined) {
          total += convertedExtraPrice;
        }
      });
    }

    return total;
  };

  // Formater un montant avec la devise sélectionnée
  const formatAmount = (amount: number) => {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${selectedCurrency}`;
    }
  };

  const calculateDeliveryTime = () => {
    let totalDays = service.delivery_time_days || 7;

    if (service.extras && selectedExtras.length > 0) {
      selectedExtras.forEach((index) => {
        const extra = service.extras?.[index] as any;
        // Use delivery_additional_days as primary source, fallback to delivery_time_days if needed
        const additionalDays =
          extra?.delivery_additional_days ?? extra?.delivery_time_days ?? 0;
        totalDays += additionalDays;
      });
    }

    return totalDays;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
      {/* Prix principal */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">{t.pricing.startingAt}</div>
        <div className="text-3xl font-bold text-gray-900">
          {formatAmount(convertedBasePrice)}
        </div>
        {convertedPriceMin !== null && convertedPriceMax !== null && (
          <div className="text-sm text-gray-500 mt-1">
            ({formatAmount(convertedPriceMin)} -{" "}
            {formatAmount(convertedPriceMax)})
          </div>
        )}
      </div>

      {/* Délai de livraison */}
      <div className="mb-6 pb-6 border-b">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{t.pricing.deliveryTime}</span>
          <span className="font-semibold text-gray-900">
            {calculateDeliveryTime()} {t.pricing.days}
          </span>
        </div>
      </div>

      {/* Prix total */}
      {selectedExtras.length > 0 && (
        <div className="mb-6 pb-6 border-b">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-semibold">
              {t.pricing.totalPrice}
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {formatAmount(calculateTotal())}
            </span>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="space-y-3">
        <button
          onClick={() =>
            onOrder(
              selectedExtras
                .map((i) => (service.extras?.[i] as any)?.id)
                .filter(Boolean)
            )
          }
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {t.pricing.orderNow}
        </button>
        <button
          onClick={onContact}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:border-gray-400 transition-colors"
        >
          {t.pricing.contactProvider}
        </button>
      </div>
    </div>
  );
}
