"use client";

import {
  ChevronDown,
  Package,
  User,
  DollarSign,
  Star,
  TrendingUp,
  MessageSquare,
  Bell,
  X,
  LogOut,
  Settings,
  Home,
  BarChart3,
  Users,
  FileText,
  Target,
  Zap,
  Shield,
  Award,
  Menu,
  Search,
  Coins,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MessagesMenu } from "@/components/layout/MessagesMenu";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import ImpersonationBanner from "../ImpersonationBanner";
import SimpleLanguageSwitcher from "../common/LanguageSwitcher";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

// Interface pour les devises
interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

const HeaderProvider = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const { t } = useSafeLanguage();

  // États pour les menus déroulants
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const [showAnalyticsMenu, setShowAnalyticsMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // États pour les devises
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null,
  );
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  // Refs pour détecter les clics extérieurs
  const businessMenuRef = useRef<HTMLDivElement>(null);
  const analyticsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  // Gérer le scroll pour l'effet de header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Charger les devises depuis l'API
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch("/api/admin/currencies?isAdmin=true");
        const data = await response.json();

        if (data.success) {
          const activeCurrencies = data.data.currencies.filter(
            (c: Currency) => c.is_active,
          );
          setCurrencies(activeCurrencies);

          // Charger la devise depuis localStorage ou utiliser USD par défaut
          const savedCurrencyCode = localStorage.getItem("selectedCurrency");
          const savedCurrency = activeCurrencies.find(
            (c: Currency) => c.code === savedCurrencyCode,
          );

          if (savedCurrency) {
            setSelectedCurrency(savedCurrency);
          } else {
            // Par défaut: USD
            const defaultCurrency =
              activeCurrencies.find((c: Currency) => c.code === "USD") ||
              activeCurrencies[0];
            setSelectedCurrency(defaultCurrency);
            if (defaultCurrency) {
              localStorage.setItem("selectedCurrency", defaultCurrency.code);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des devises:", error);
      } finally {
        setLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Fermer les menus lors du clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        businessMenuRef.current &&
        !businessMenuRef.current.contains(event.target as Node)
      ) {
        setShowBusinessMenu(false);
      }
      if (
        analyticsMenuRef.current &&
        !analyticsMenuRef.current.contains(event.target as Node)
      ) {
        setShowAnalyticsMenu(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        currencyMenuRef.current &&
        !currencyMenuRef.current.contains(event.target as Node)
      ) {
        setShowCurrencyMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Données utilisateur
  const getUserName = () => {
    if (user?.display_name) return user.display_name;
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    return "Provider";
  };

  const userData = {
    name: getUserName(),
    email: user?.email || "",
    avatar:
      user?.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${
        user?.username || "default"
      }`,
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/auth/signin");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const switchToClientMode = () => {
    router.push("/home");
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  // Changer la devise sélectionnée
  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem("selectedCurrency", currency.code);
    setShowCurrencyMenu(false);
    // Déclencher un événement personnalisé pour notifier le changement
    window.dispatchEvent(
      new CustomEvent("currencyChanged", { detail: currency }),
    );
  };

  if (loading) {
    return (
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
              <div className="hidden lg:flex gap-4">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Header Premium */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-200"
            : "bg-white border-b border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - Logo & Navigation */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <button
                onClick={() => router.push("/Provider/TableauDeBord")}
                className="flex items-center gap-2 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 rounded-lg">
                    <span className="text-white font-black text-xl tracking-tight">
                      AL
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    AnyLibre
                  </h1>
                  <p className="text-[10px] font-semibold text-emerald-600 -mt-1">
                    {t.headerProvider.role}
                  </p>
                </div>
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {/* Dashboard */}
                <a
                  href="/Provider/TableauDeBord"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    isActive("/Provider/TableauDeBord")
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  {t.headerProvider.nav.dashboard}
                </a>

                {/* Mon Entreprise Dropdown */}
                <div className="relative" ref={businessMenuRef}>
                  <button
                    onClick={() => {
                      setShowBusinessMenu(!showBusinessMenu);
                      setShowAnalyticsMenu(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      showBusinessMenu
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {t.headerProvider.nav.business.title}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        showBusinessMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showBusinessMenu && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2">
                        <a
                          href="/Provider/TableauDeBord/Order"
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 text-sm mb-0.5">
                              {t.headerProvider.nav.business.orders.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {t.headerProvider.nav.business.orders.subtitle}
                            </div>
                          </div>
                        </a>

                        <a
                          href="/Provider/TableauDeBord/Service"
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <Target className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 text-sm mb-0.5">
                              {t.headerProvider.nav.business.services.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {t.headerProvider.nav.business.services.subtitle}
                            </div>
                          </div>
                        </a>

                        <a
                          href="/Provider/TableauDeBord/Profi-Provider/edit"
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                            <User className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 text-sm mb-0.5">
                              {
                                t.headerProvider.nav.business.publicProfile
                                  .title
                              }
                            </div>
                            <div className="text-xs text-slate-500">
                              {
                                t.headerProvider.nav.business.publicProfile
                                  .subtitle
                              }
                            </div>
                          </div>
                        </a>

                        <a
                          href="/Provider/TableauDeBord/Avis"
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                            <Star className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 text-sm mb-0.5">
                              {t.headerProvider.nav.business.reviews.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {t.headerProvider.nav.business.reviews.subtitle}
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <div className="hidden lg:block ml-2 overflow-hidden">
                  <SimpleLanguageSwitcher />
                </div>
                {/* Analytique Dropdown */}
                <div className="relative" ref={analyticsMenuRef}>
                  <button
                    onClick={() => {
                      setShowAnalyticsMenu(!showAnalyticsMenu);
                      setShowBusinessMenu(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      showAnalyticsMenu || pathname?.includes("/Analytique")
                        ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    {t.headerProvider.nav.analytics.title}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        showAnalyticsMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showAnalyticsMenu && (
                    <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2">
                        {/* Section Principale */}
                        <div className="px-3 py-2">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {t.headerProvider.nav.analytics.reportsHeader}
                          </div>
                        </div>

                        <a
                          href="/Provider/TableauDeBord/Analytique/Apercu"
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors group ${
                            isActive(
                              "/Provider/TableauDeBord/Analytique/Apercu",
                            )
                              ? "bg-emerald-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                            <BarChart3 className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 text-sm mb-0.5 flex items-center gap-2">
                              {t.headerProvider.nav.analytics.overview.title}
                              {isActive(
                                "/Provider/TableauDeBord/Analytique/Apercu",
                              ) && (
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {t.headerProvider.nav.analytics.overview.subtitle}
                            </div>
                          </div>
                        </a>

                        <a
                          href="/Provider/TableauDeBord/Analytique/Performance"
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors group ${
                            isActive(
                              "/Provider/TableauDeBord/Analytique/Performance",
                            )
                              ? "bg-emerald-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Zap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 text-sm mb-0.5 flex items-center gap-2">
                              {t.headerProvider.nav.analytics.performance.title}
                              {isActive(
                                "/Provider/TableauDeBord/Analytique/Performance",
                              ) && (
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {
                                t.headerProvider.nav.analytics.performance
                                  .subtitle
                              }
                            </div>
                          </div>
                        </a>

                        <a
                          href="/Provider/TableauDeBord/Analytique/Revenus"
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors group ${
                            isActive(
                              "/Provider/TableauDeBord/Analytique/Revenus",
                            )
                              ? "bg-emerald-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 text-sm mb-0.5 flex items-center gap-2">
                              {t.headerProvider.nav.analytics.earnings.title}
                              {isActive(
                                "/Provider/TableauDeBord/Analytique/Revenus",
                              ) && (
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {t.headerProvider.nav.analytics.earnings.subtitle}
                            </div>
                          </div>
                        </a>

                        <a
                          href="/Provider/TableauDeBord/Analytique/Clients"
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors group ${
                            isActive(
                              "/Provider/TableauDeBord/Analytique/Clients",
                            )
                              ? "bg-emerald-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="p-2 bg-violet-50 rounded-lg group-hover:bg-violet-100 transition-colors">
                            <Users className="w-5 h-5 text-violet-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 text-sm mb-0.5 flex items-center gap-2">
                              {t.headerProvider.nav.analytics.clients.title}
                              {isActive(
                                "/Provider/TableauDeBord/Analytique/Clients",
                              ) && (
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {t.headerProvider.nav.analytics.clients.subtitle}
                            </div>
                          </div>
                        </a>

                        <div className="h-px bg-slate-200 my-2"></div>

                        {/* Section Rapports */}
                        <a
                          href="/Provider/TableauDeBord/Analytique/Rapports"
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors group ${
                            isActive(
                              "/Provider/TableauDeBord/Analytique/Rapports",
                            )
                              ? "bg-emerald-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                            <FileText className="w-5 h-5 text-slate-700" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 text-sm mb-0.5 flex items-center gap-2">
                              {t.headerProvider.nav.analytics.exports.title}
                              {isActive(
                                "/Provider/TableauDeBord/Analytique/Rapports",
                              ) && (
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              )}
                              <Award className="w-3 h-3 text-amber-500 ml-auto" />
                            </div>
                            <div className="text-xs text-slate-500">
                              {t.headerProvider.nav.analytics.exports.subtitle}
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>

              {/* Messages - Visible on Mobile & Desktop */}
              <MessagesMenu />

              {/* Notifications (Desktop only) */}
              <div className="hidden lg:block">
                <NotificationsMenu />
              </div>

              {/* Currency Selector (Desktop only) */}
              {!loadingCurrencies && selectedCurrency && (
                <div className="hidden lg:block relative" ref={currencyMenuRef}>
                  <button
                    onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors group"
                    title={t.headerProvider.currency.title}
                  >
                    <Coins className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
                    <span className="font-semibold text-sm text-slate-700 group-hover:text-slate-900">
                      {selectedCurrency.symbol} {selectedCurrency.code}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                        showCurrencyMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showCurrencyMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-emerald-600" />
                          <h3 className="font-semibold text-sm text-slate-900">
                            {t.headerProvider.currency.choose}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {t.headerProvider.currency.subtitle}
                        </p>
                      </div>

                      <div className="max-h-80 overflow-y-auto p-2">
                        {currencies.map((currency) => (
                          <button
                            key={currency.code}
                            onClick={() => handleCurrencyChange(currency)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                              selectedCurrency.code === currency.code
                                ? "bg-emerald-50 border border-emerald-200"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                  selectedCurrency.code === currency.code
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {currency.symbol}
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-sm text-slate-900">
                                  {currency.code}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {currency.name}
                                </div>
                              </div>
                            </div>
                            {selectedCurrency.code === currency.code && (
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 hover:bg-slate-100 rounded-lg p-1.5 pr-3 transition-colors group"
                >
                  <div className="relative">
                    <img
                      src={userData.avatar}
                      alt={userData.name}
                      className="w-9 h-9 rounded-full border-2 border-emerald-500 ring-2 ring-emerald-100 group-hover:ring-emerald-200 transition-all"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                  <ChevronDown
                    className={`hidden sm:block w-4 h-4 text-slate-600 transition-transform duration-200 ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="p-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <img
                            src={userData.avatar}
                            alt={userData.name}
                            className="w-14 h-14 rounded-full border-3 border-white shadow-md"
                          />
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 text-base truncate">
                            {userData.name}
                          </h3>
                          <p className="text-sm text-slate-600 truncate">
                            {userData.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={switchToClientMode}
                        className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 group"
                      >
                        <User className="w-4 h-4" />
                        {t.headerProvider.userMenu.clientMode}
                        <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <a
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors group"
                      >
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="font-medium text-slate-700 group-hover:text-slate-900">
                          {t.headerProvider.userMenu.profile}
                        </span>
                      </a>

                      <a
                        href="/Parametres"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors group"
                      >
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                          <Settings className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="font-medium text-slate-700 group-hover:text-slate-900">
                          {t.headerProvider.userMenu.settings}
                        </span>
                      </a>

                      <a
                        href="/Facturation"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors group"
                      >
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                          <DollarSign className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="font-medium text-slate-700 group-hover:text-slate-900">
                          {t.headerProvider.userMenu.billing}
                        </span>
                      </a>
                    </div>

                    <div className="h-px bg-slate-200"></div>

                    {/* Logout */}
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-lg transition-colors group"
                      >
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-red-100 transition-colors">
                          <LogOut className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                        </div>
                        <span className="font-medium text-slate-700 group-hover:text-red-600">
                          {t.headerProvider.userMenu.logout}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setShowMobileMenu(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="p-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 rounded-lg">
                    <span className="text-white font-black text-xl">AL</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      AnyLibre
                    </h2>
                    <p className="text-[10px] font-semibold text-emerald-600 -mt-1">
                      PROVIDER
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <div className="space-y-6">
                <a
                  href="/Provider/TableauDeBord"
                  className="flex items-center gap-3 px-4 py-3 bg-slate-100 rounded-lg font-semibold"
                >
                  <Home className="w-5 h-5 text-slate-700" />
                  <span>{t.headerProvider.nav.dashboard}</span>
                </a>

                {/* Mon entreprise */}
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.headerProvider.nav.business.title}
                  </div>
                  <div className="space-y-1">
                    <a
                      href="/Provider/TableauDeBord/Order"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg"
                    >
                      <Package className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">
                        {t.headerProvider.nav.business.orders.title}
                      </span>
                    </a>
                    <a
                      href="/Provider/TableauDeBord/Service"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg"
                    >
                      <Target className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">
                        {t.headerProvider.nav.business.services.title}
                      </span>
                    </a>
                    <a
                      href="/Provider/TableauDeBord/edit"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg"
                    >
                      <User className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">
                        {t.headerProvider.nav.business.profileShort}
                      </span>
                    </a>
                    <a
                      href="/Provider/TableauDeBord/Avis"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg"
                    >
                      <Star className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">
                        {t.headerProvider.nav.business.reviewsShort}
                      </span>
                    </a>
                  </div>
                </div>

                {/* Analytique */}
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.headerProvider.nav.analytics.title}
                  </div>
                  <div className="space-y-1">
                    <a
                      href="/Provider/TableauDeBord/Analytique/Apercu"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg"
                    >
                      <BarChart3 className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">
                        {t.headerProvider.nav.analytics.overviewShort}
                      </span>
                    </a>
                    <a
                      href="/Provider/TableauDeBord/Analytique/Performance"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg"
                    >
                      <Zap className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">
                        {t.headerProvider.nav.analytics.performance.title}
                      </span>
                    </a>
                    <a
                      href="/Provider/TableauDeBord/Analytique/Revenus"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg"
                    >
                      <DollarSign className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">
                        {t.headerProvider.nav.analytics.earnings.title}
                      </span>
                    </a>
                    <a
                      href="/Provider/TableauDeBord/Analytique/Clients"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg"
                    >
                      <Users className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">
                        {t.headerProvider.nav.analytics.clients.title}
                      </span>
                    </a>
                    <a
                      href="/Provider/TableauDeBord/Analytique/Rapports"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg"
                    >
                      <FileText className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">
                        {t.headerProvider.nav.analytics.reportsShort}
                      </span>
                    </a>
                  </div>
                </div>

                {/* Currency Selector - Mobile */}
                {!loadingCurrencies && selectedCurrency && (
                  <div className="pt-6 border-t border-slate-200">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.headerProvider.currency.label}
                    </div>
                    <div className="space-y-1">
                      {currencies.map((currency) => (
                        <button
                          key={currency.code}
                          onClick={() => handleCurrencyChange(currency)}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                            selectedCurrency.code === currency.code
                              ? "bg-emerald-50 border border-emerald-200"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                selectedCurrency.code === currency.code
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {currency.symbol}
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-sm">
                                {currency.code}
                              </div>
                              <div className="text-xs text-slate-500">
                                {currency.name}
                              </div>
                            </div>
                          </div>
                          {selectedCurrency.code === currency.code && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-6 border-t border-slate-200 space-y-2">
                  <button
                    onClick={switchToClientMode}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg font-semibold"
                  >
                    <User className="w-4 h-4" />
                    {t.headerProvider.userMenu.clientMode}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.headerProvider.userMenu.logout}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <ImpersonationBanner />
    </>
  );
};

export default HeaderProvider;
