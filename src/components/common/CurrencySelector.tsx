"use client";

import React, { useState, useEffect, useRef } from "react";
import { Coins, ChevronDown, Check } from "lucide-react";

// Interface pour les devises
interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

// Props du composant
interface CurrencySelectorProps {
  variant?: "default" | "compact" | "minimal";
  theme?: "light" | "dark" | "auto";
  showIcon?: boolean;
  showName?: boolean;
  position?: "left" | "right";
  onChange?: (currency: Currency) => void;
  className?: string;
  active?: boolean;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  variant = "default",
  theme = "light",
  showIcon = true,
  showName = false,
  position = "right",
  onChange,
  className = "",
  active = true,
}) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null
  );
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");

  const menuRef = useRef<HTMLDivElement>(null);

  // Déterminer le thème actuel basé sur la préférence ou le système
  useEffect(() => {
    if (theme === "auto") {
      const darkModeMediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );
      setCurrentTheme(darkModeMediaQuery.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) => {
        setCurrentTheme(e.matches ? "dark" : "light");
      };

      darkModeMediaQuery.addEventListener("change", handler);
      return () => darkModeMediaQuery.removeEventListener("change", handler);
    } else {
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Charger les devises depuis l'API
  useEffect(() => {
    if (!active) return;

    const fetchCurrencies = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/currencies?isAdmin=true");
        const data = await response.json();

        if (data.success) {
          const activeCurrencies = data.data.currencies.filter(
            (c: Currency) => c.is_active
          );
          setCurrencies(activeCurrencies);

          // Charger la devise depuis localStorage ou utiliser USD par défaut
          const savedCurrencyCode = localStorage.getItem("selectedCurrency");
          const savedCurrency = activeCurrencies.find(
            (c: Currency) => c.code === savedCurrencyCode
          );

          if (savedCurrency) {
            setSelectedCurrency(savedCurrency);
          } else {
            const defaultCurrency =
              activeCurrencies.find((c: Currency) => c.code === "USD") ||
              activeCurrencies[0];
            if (defaultCurrency) {
              setSelectedCurrency(defaultCurrency);
              localStorage.setItem("selectedCurrency", defaultCurrency.code);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des devises:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, [active]);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gérer le changement de devise
  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem("selectedCurrency", currency.code);
    setShowCurrencyMenu(false);

    // Déclencher l'événement personnalisé
    window.dispatchEvent(
      new CustomEvent("currencyChanged", { detail: currency })
    );

    // Appeler le callback si fourni
    if (onChange) {
      onChange(currency);
    }
  };

  // Classes CSS conditionnelles
  const themeClasses = {
    light: {
      button:
        "text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200",
      buttonActive: "text-slate-900 bg-slate-50",
      menu: "bg-white border-slate-200 text-slate-900",
      menuItem: "hover:bg-slate-50 text-slate-700",
      menuItemActive: "bg-emerald-50 border-emerald-200 text-emerald-700",
      header: "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100",
      icon: "text-slate-600",
      iconHover: "group-hover:text-slate-900",
    },
    dark: {
      button:
        "text-slate-300 hover:text-white hover:bg-white/10 border-slate-700",
      buttonActive: "text-white bg-white/10",
      menu: "bg-slate-900 border-slate-700 text-white",
      menuItem: "hover:bg-white/5 text-slate-300",
      menuItemActive: "bg-emerald-900/30 border-emerald-800 text-emerald-300",
      header:
        "bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border-emerald-800",
      icon: "text-slate-400",
      iconHover: "group-hover:text-white",
    },
  };

  const currentThemeClass = themeClasses[currentTheme];

  // Rendu différent selon la variante
  const renderButton = () => {
    if (!active || loading || !selectedCurrency) {
      return (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border opacity-50 cursor-not-allowed ${
            currentTheme === "light"
              ? "bg-slate-100 text-slate-400 border-slate-200"
              : "bg-slate-800 text-slate-500 border-slate-700"
          }`}
        >
          {showIcon && <Coins className="w-4 h-4" />}
          <span className="font-medium text-sm">
            {loading ? "Chargement..." : "Devise"}
          </span>
          {variant !== "minimal" && <ChevronDown className="w-4 h-4" />}
        </div>
      );
    }

    const buttonClasses = [
      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 group",
      showCurrencyMenu
        ? currentThemeClass.buttonActive
        : currentThemeClass.button,
      variant === "compact" ? "px-2 py-1.5 text-sm" : "",
      variant === "minimal" ? "border-transparent" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
        className={buttonClasses}
        title={`Devise: ${selectedCurrency.name}`}
      >
        {showIcon && (
          <Coins
            className={`w-4 h-4 transition-colors ${currentThemeClass.icon} ${currentThemeClass.iconHover}`}
          />
        )}

        {variant !== "minimal" && (
          <>
            <span className="font-medium text-sm">
              {selectedCurrency.symbol} {selectedCurrency.code}
              {showName && variant === "default" && (
                <span className="ml-1 text-xs opacity-60 truncate max-w-[60px]">
                  {selectedCurrency.name}
                </span>
              )}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-all duration-200 ${
                showCurrencyMenu ? "rotate-180" : ""
              } ${
                currentTheme === "light"
                  ? "text-slate-500 group-hover:text-slate-700"
                  : "text-slate-400 group-hover:text-slate-300"
              }`}
            />
          </>
        )}
      </button>
    );
  };

  const renderMenu = () => {
    if (!showCurrencyMenu || !selectedCurrency || !active) return null;

    const menuClasses = [
      "absolute top-full mt-2 z-50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200",
      position === "left" ? "left-0" : "right-0",
      currentThemeClass.menu,
      variant === "compact" ? "w-56" : "w-64",
      variant === "minimal" ? "w-72" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={menuClasses} ref={menuRef}>
        {/* Header du menu */}
        <div className={`p-3 border-b ${currentThemeClass.header}`}>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">Choisir une devise</h3>
          </div>
          <p className="text-xs mt-1 opacity-80">
            Tous les montants seront affichés dans cette devise
          </p>
        </div>

        {/* Liste des devises */}
        <div
          className={`max-h-80 overflow-y-auto p-2 ${
            currentTheme === "dark" ? "scrollbar-dark" : ""
          }`}
        >
          {currencies.map((currency) => {
            const isActive = selectedCurrency.code === currency.code;
            const itemClasses = [
              "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              isActive
                ? currentThemeClass.menuItemActive
                : currentThemeClass.menuItem,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency)}
                className={itemClasses}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                      isActive
                        ? currentTheme === "light"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-emerald-900/50 text-emerald-300"
                        : currentTheme === "light"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {currency.symbol}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">{currency.code}</div>
                    <div className="text-xs opacity-70">{currency.name}</div>
                  </div>
                </div>
                {isActive && <Check className="w-4 h-4 text-emerald-500" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative inline-block">
      {renderButton()}
      {renderMenu()}
    </div>
  );
};

export default CurrencySelector;
