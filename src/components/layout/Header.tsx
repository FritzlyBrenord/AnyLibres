"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Menu, X, ArrowRight, User } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/Button";
import { useScroll } from "@/hooks/useScroll";
import { cn } from "@/utils/utils";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import { MessagesMenu } from "@/components/layout/MessagesMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageContext } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import {
  QuickSearchBar,
  QuickSearchBarMobile,
} from "@/components/search/QuickSearchBar";

interface HeaderProps {
  variant?: "transparent" | "solid";
  disableScrollEffect?: boolean;
  disableSearchBar?: boolean;
  disableBarSearch?: boolean;
  disableNavigation?: boolean;
  disableAuth?: boolean;
  fixed?: boolean;
  className?: string;
  // Textes de navigation (optionnels, valeurs par défaut en français)
  navTexts?: {
    explore?: string;
    about?: string;
    login?: string;
    register?: string;
  };
  showLanguageSwitcher?: boolean;
}

export function Header({
  variant = "transparent",
  disableScrollEffect = false,
  disableSearchBar = false,
  disableBarSearch = false,
  disableNavigation = false,
  disableAuth = false,
  fixed = true,
  className,
  navTexts = {
    explore: "Explorer",
    about: "À propos",
    login: "Connexion",
    register: "S'inscrire",
  },
  showLanguageSwitcher = true,
}: HeaderProps) {
  const scrolled = useScroll(100);
  const { user, loading, checkAuth } = useAuth();
  const { t } = useLanguageContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Textes dynamiques traduits avec fallback pour assurer que quelque chose s'affiche toujours

  const staticTexts = {
    explore: t?.navigation?.explore || navTexts.explore || "Explorer",
    about: t?.navigation?.about || navTexts.about || "À propos",
    login: t?.navigation?.login || navTexts.login || "Connexion",
    register: t?.navigation?.register || navTexts.register || "S'inscrire",
    searchPlaceholder:
      t?.home?.hero?.searchPlaceholder || "Logo, site web, marketing...",
    searchMobilePlaceholder:
      t?.home?.services?.searchService || "Rechercher un service...",
    menu: "Menu", // Pas de traduction explicite dans le fichier actuellement, laisser en fallback ou ajouter
    closeSearch: "Fermer",
    search: t?.home?.hero?.searchButton || "Rechercher",
    close: "Fermer",
    language: "Langue",
  };

  useEffect(() => {
    setMounted(true);
    // Vérifier l'authentification au chargement
    checkAuth?.();
  }, []);

  // Réagir aux changements d'authentification
  useEffect(() => {
    if (mounted && user) {
      // Le composant se met à jour automatiquement quand l'utilisateur se connecte
      console.log("Utilisateur connecté, header mis à jour");
    }
  }, [user, mounted]);

  // Déterminer si le header doit être solide
  const shouldBeSolid =
    variant === "solid" || (scrolled && !disableScrollEffect);
  const isSolid = disableScrollEffect ? variant === "solid" : shouldBeSolid;

  // Déterminer si la barre de recherche doit être affichée
  const showSearchBar = !disableSearchBar && isSolid;

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    // Si on ouvre la recherche mobile, on ferme le menu mobile
    if (!showMobileSearch) {
      setMobileMenuOpen(false);
    }
  };

  const closeMobileSearch = () => {
    setShowMobileSearch(false);
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleRegister = () => {
    window.location.href = "/register";
  };

  // Ne pas afficher pendant le chargement initial pour éviter les flashs
  if (!mounted) {
    return (
      <header
        className={cn(
          fixed ? "fixed top-0 left-0 right-0 z-50" : "relative z-50",
          "h-16 lg:h-20 bg-white/95 backdrop-blur-xl border-b border-slate-200",
          className,
        )}
      />
    );
  }

  return (
    <header
      className={cn(
        fixed ? "fixed top-0 left-0 right-0 z-50" : "relative z-50",
        "transition-all duration-500",
        isSolid
          ? "bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm"
          : "bg-transparent",
        className,
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo - Masqué quand la recherche mobile est ouverte */}
          <div className={cn(showMobileSearch ? "hidden" : "block")}>
            <Logo className={isSolid ? "text-slate-900" : "text-white"} />
          </div>

          {/* Search Bar - Desktop avec suggestions rapides */}
          {showSearchBar && !disableBarSearch && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <QuickSearchBar placeholder={staticTexts.searchPlaceholder} />
            </div>
          )}

          {/* Desktop Navigation */}
          {!disableNavigation && (
            <nav className="hidden lg:flex items-center gap-8">
              {/* Links */}
              <div className="flex items-center gap-8">
                <Link
                  href="/explorer"
                  className={cn(
                    "relative font-semibold transition-all duration-300",
                    "after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-current after:transition-all after:duration-300 hover:after:w-full",
                    isSolid
                      ? "text-slate-700 hover:text-slate-900 after:bg-slate-900"
                      : "text-white/90 hover:text-white after:bg-white",
                  )}
                >
                  {staticTexts.explore}
                </Link>

                <Link
                  href="/about"
                  className={cn(
                    "relative font-semibold transition-all duration-300",
                    "after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-current after:transition-all after:duration-300 hover:after:w-full",
                    isSolid
                      ? "text-slate-700 hover:text-slate-900 after:bg-slate-900"
                      : "text-white/90 hover:text-white after:bg-white",
                  )}
                >
                  {staticTexts.about}
                </Link>

                {/* Language Switcher - Visible partout */}
                {showLanguageSwitcher && <LanguageSwitcher />}
              </div>

              {/* Separator */}
              {(!disableAuth || showLanguageSwitcher) && (
                <div
                  className={cn(
                    "h-6 w-px transition-all duration-300",
                    isSolid ? "bg-slate-300" : "bg-white/30",
                  )}
                />
              )}

              {/* Auth Section */}
              {!disableAuth && !loading && (
                <>
                  {user ? (
                    // Utilisateur connecté - Afficher les menus
                    <div className="flex items-center gap-2">
                      <MessagesMenu />
                      <NotificationsMenu />
                      <UserMenu />
                    </div>
                  ) : (
                    // Utilisateur non connecté - Afficher les boutons
                    <div className="flex items-center gap-3">
                      <Button
                        variant={isSolid ? "ghost" : "outline"}
                        size="sm"
                        onClick={handleLogin}
                        className={cn(
                          "transition-all duration-300 font-semibold",
                          isSolid
                            ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                            : "text-white border-white/40 hover:bg-white/10 hover:border-white/60",
                        )}
                      >
                        {staticTexts.login}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleRegister}
                        className={cn(
                          "font-semibold transition-all duration-300",
                          isSolid
                            ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl"
                            : "bg-white text-slate-900 hover:bg-slate-100 shadow-lg hover:shadow-xl",
                        )}
                      >
                        {staticTexts.register}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </nav>
          )}

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Search Icon - Masqué si search bar désactivée OU si la recherche mobile est déjà ouverte */}
            {!disableSearchBar && (
              <button
                onClick={toggleMobileSearch}
                className={cn(
                  "p-2 rounded-lg transition-all duration-300 hover:bg-slate-100",
                  isSolid ? "text-slate-700" : "text-white",
                  showMobileSearch ? "bg-indigo-100 text-indigo-600" : "",
                )}
                aria-label={
                  showMobileSearch
                    ? staticTexts.closeSearch
                    : staticTexts.search
                }
              >
                {showMobileSearch ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Autres éléments masqués quand la recherche mobile est ouverte */}
            {!showMobileSearch && (
              <>
                {/* Language Switcher - Mobile */}

                {!disableAuth && !loading && user && (
                  <>
                    <MessagesMenu />
                    <NotificationsMenu />
                  </>
                )}

                {/* User Icon or Menu */}
                {!disableAuth &&
                  !loading &&
                  (user ? (
                    <UserMenu />
                  ) : (
                    <button
                      onClick={handleLogin}
                      className={cn(
                        "p-2 rounded-lg transition-all duration-300 hover:bg-slate-100",
                        isSolid ? "text-slate-700" : "text-white",
                      )}
                      aria-label={staticTexts.login}
                    >
                      <User className="w-5 h-5" />
                    </button>
                  ))}

                {/* Menu Button - Masqué si navigation désactivée */}
                {!disableNavigation && (
                  <button
                    className={cn(
                      "p-2 rounded-lg transition-all duration-300 hover:bg-slate-100",
                      isSolid ? "text-slate-700" : "text-white",
                    )}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={
                      mobileMenuOpen ? staticTexts.close : staticTexts.menu
                    }
                  >
                    {mobileMenuOpen ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Menu className="w-6 h-6" />
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Search - Toggle avec version compacte */}
        {!disableSearchBar && showMobileSearch && (
          <div className="md:hidden pb-3 animate-fade-in">
            <QuickSearchBarMobile
              placeholder={staticTexts.searchMobilePlaceholder}
              onSearch={closeMobileSearch}
            />
          </div>
        )}
      </div>

      {/* Mobile Menu - Masqué si navigation désactivée OU si la recherche mobile est ouverte */}
      {!disableNavigation && mobileMenuOpen && !showMobileSearch && (
        <div
          className={cn(
            "lg:hidden border-t backdrop-blur-xl animate-slide-down",
            isSolid
              ? "bg-white/95 border-slate-200"
              : "bg-slate-900/95 border-white/20",
          )}
        >
          <div className="container mx-auto px-4 py-6 space-y-3">
            <Link
              href="/explorer"
              className={cn(
                "block py-3 px-4 rounded-xl font-semibold transition-all duration-300 border",
                isSolid
                  ? "text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  : "text-white border-white/20 hover:bg-white/10",
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {staticTexts.explore}
            </Link>

            <Link
              href="/about"
              className={cn(
                "block py-3 px-4 rounded-xl font-semibold transition-all duration-300 border",
                isSolid
                  ? "text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  : "text-white border-white/20 hover:bg-white/10",
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {staticTexts.about}
            </Link>

            {/* Language Switcher - Mobile */}
            {showLanguageSwitcher && (
              <div className="py-2">
                <LanguageSwitcher />
              </div>
            )}

            {!disableAuth && !loading && !user && (
              <div className="pt-4 space-y-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  className="w-full font-semibold text-white"
                  onClick={handleLogin}
                >
                  {staticTexts.login}
                </Button>
                <Button
                  variant="primary"
                  className={cn(
                    "w-full font-semibold",
                    isSolid
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "bg-white text-slate-900 hover:bg-slate-100",
                  )}
                  onClick={handleRegister}
                >
                  {staticTexts.register}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
