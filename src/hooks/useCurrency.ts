"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string;
    is_default: boolean;
    is_active: boolean;
    conversion_mode: "auto" | "manual";
    manual_rate_to_default: number | null;
    auto_rate_to_default: number | null;
    decimal_places: number;
    position: "before" | "after";
}

export function useCurrency() {
    const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDefaultCurrency = useCallback(async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("currencies")
                .select("*")
                .eq("is_default", true)
                .single();

            if (error) throw error;
            setDefaultCurrency(data);
        } catch (err) {
            console.error("[useCurrency] Error fetching default currency:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDefaultCurrency();
    }, [fetchDefaultCurrency]);

    const convertFromUSD = useCallback(
        (amountInUSD: number) => {
            if (!defaultCurrency) return amountInUSD;

            // La base de données est en USD. 
            // Si la devise par défaut est USD, pas de conversion.
            if (defaultCurrency.code === "USD") return amountInUSD;

            const rate =
                defaultCurrency.conversion_mode === "manual"
                    ? defaultCurrency.manual_rate_to_default
                    : defaultCurrency.auto_rate_to_default;

            if (!rate) return amountInUSD;

            // Le taux stocké est : 1 USD = X [Default Currency]
            return amountInUSD * rate;
        },
        [defaultCurrency]
    );

    const formatAmount = useCallback(
        (amount: number) => {
            if (!defaultCurrency) {
                return new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount);
            }

            const formatted = new Intl.NumberFormat("fr-FR", {
                minimumFractionDigits: defaultCurrency.decimal_places,
                maximumFractionDigits: defaultCurrency.decimal_places,
            }).format(amount);

            if (defaultCurrency.position === "before") {
                return `${defaultCurrency.symbol}${formatted}`;
            } else {
                return `${formatted}${defaultCurrency.symbol}`;
            }
        },
        [defaultCurrency]
    );

    return {
        defaultCurrency,
        convertFromUSD,
        formatAmount,
        loading,
    };
}
