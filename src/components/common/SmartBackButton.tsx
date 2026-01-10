// components/common/SmartBackButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Home, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/utils";

interface SmartBackButtonProps {
  variant?: "default" | "minimal" | "floating" | "outline";
  label?: string;
  fallbackUrl?: string;
  showIcon?: boolean;
  className?: string;
  autoDetect?: boolean;
  theme?: "light" | "dark" | "auto";
}

// Pages où on veut un comportement spécifique
const specificBackRoutes: Record<string, string> = {
  "/auth/signin": "/",
  "/auth/signup": "/",
  "/profile/edit": "/profile",
  "/order/confirmation": "/orders",
  "/checkout": "/cart",
  "/service/create": "/services",
  "/message/thread": "/messages",
};

// Pages où on ne veut PAS afficher le bouton
const hiddenRoutes = ["/", "/home", "/explorer"];

// Classes CSS pour les thèmes
const themeClasses = {
  light: {
    default: {
      button:
        "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
      minimal: "text-slate-600 hover:text-slate-900",
      floating:
        "bg-white/90 border-slate-200 text-slate-700 hover:bg-white shadow-lg",
      outline:
        "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400",
    },
    icon: "text-slate-600 group-hover:text-slate-900",
  },
  dark: {
    default: {
      button: "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white",
      minimal: "text-slate-300 hover:text-white",
      floating:
        "bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800 shadow-lg",
      outline:
        "border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500",
    },
    icon: "text-slate-400 group-hover:text-white",
  },
};

export function SmartBackButton({
  variant = "default",

  label,
  fallbackUrl = "/",
  showIcon = true,
  className,
  autoDetect = true,
  theme = "auto",
}: SmartBackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");

  // Détection du thème (auto ou fixe)
  useEffect(() => {
    setIsBrowser(true);

    if (theme === "auto" && isBrowser) {
      // Détecter le thème système
      const darkModeMediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );
      setCurrentTheme(darkModeMediaQuery.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) => {
        setCurrentTheme(e.matches ? "dark" : "light");
      };

      darkModeMediaQuery.addEventListener("change", handler);
      return () => darkModeMediaQuery.removeEventListener("change", handler);
    } else if (theme !== "auto") {
      setCurrentTheme(theme);
    }
  }, [theme, isBrowser]);

  useEffect(() => {
    if (!isBrowser) return;

    // Vérifier si on peut revenir en arrière
    setCanGoBack(window.history.length > 1);

    // Récupérer la page précédente depuis sessionStorage
    const storedPreviousPath = sessionStorage.getItem("previousPath");
    const currentPath = sessionStorage.getItem("currentPath");

    // Mettre à jour l'historique
    if (currentPath !== pathname) {
      sessionStorage.setItem("previousPath", currentPath || "/");
      sessionStorage.setItem("currentPath", pathname);
      setPreviousPath(currentPath);
    } else {
      setPreviousPath(storedPreviousPath);
    }
  }, [pathname, isBrowser]);

  // Ne pas afficher sur certaines pages
  const shouldHide =
    hiddenRoutes.includes(pathname) || pathname === fallbackUrl;
  if (shouldHide) return null;

  const getBackDestination = () => {
    if (specificBackRoutes[pathname]) {
      return specificBackRoutes[pathname];
    }

    if (!autoDetect) {
      return fallbackUrl;
    }

    if (previousPath && previousPath !== pathname && previousPath !== "/") {
      return previousPath;
    }

    if (canGoBack) {
      return null;
    }

    return fallbackUrl;
  };

  const handleGoBack = () => {
    const destination = getBackDestination();

    if (destination === null) {
      router.back();
    } else {
      router.push(destination);
    }
  };

  const getButtonLabel = () => {
    if (label) return label;

    // Détecter le contexte pour un label adapté
    const contextLabels: Record<string, string> = {
      "/auth/": "Retour à l'accueil",
      "/profile/": "Retour au profil",
      "/order/": "Retour aux commandes",
      "/checkout": "Retour au panier",
      "/service/": "Retour aux services",
      "/message/": "Retour aux messages",
      "/settings/": "Retour aux paramètres",
    };

    for (const [prefix, contextLabel] of Object.entries(contextLabels)) {
      if (pathname.startsWith(prefix)) {
        return contextLabel;
      }
    }

    return "Retour";
  };

  const getButtonIcon = () => {
    if (!showIcon) return null;

    const destination = getBackDestination();

    if (destination === "/") {
      return <Home className="w-4 h-4" />;
    }

    return <ArrowLeft className="w-4 h-4" />;
  };

  // Styles selon la variante et le thème
  const getButtonClasses = () => {
    const themeClass = themeClasses[currentTheme];

    switch (variant) {
      case "minimal":
        return cn(
          "group inline-flex items-center gap-2 text-sm font-medium transition-all duration-200",
          themeClass.minimal,
          className
        );

      case "floating":
        return cn(
          "group fixed top-4 left-4 z-40 rounded-full p-2.5 transition-all duration-200 backdrop-blur-sm border shadow-lg hover:shadow-xl",
          themeClass.floating,
          "lg:hidden",
          className
        );

      case "outline":
        return cn(
          "group inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200",
          themeClass.outline,
          className
        );

      default:
        return "";
    }
  };

  const getIconClasses = () => {
    return cn(
      "transition-colors duration-200",
      themeClasses[currentTheme].icon
    );
  };

  const renderButton = () => {
    const buttonClasses = getButtonClasses();
    const iconClasses = getIconClasses();

    switch (variant) {
      case "floating":
        return (
          <button
            onClick={handleGoBack}
            className={buttonClasses}
            aria-label={getButtonLabel()}
          >
            <ChevronLeft className={cn("w-5 h-5", iconClasses)} />
          </button>
        );

      case "minimal":
        return (
          <button onClick={handleGoBack} className={buttonClasses}>
            {showIcon && <ArrowLeft className={iconClasses} />}
            <span>{getButtonLabel()}</span>
          </button>
        );

      case "outline":
        return (
          <button onClick={handleGoBack} className={buttonClasses}>
            {showIcon && <ArrowLeft className={iconClasses} />}
            <span>{getButtonLabel()}</span>
          </button>
        );

      default:
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className={cn(
              "gap-2 transition-all duration-200 group",
              themeClasses[currentTheme].default.button,
              className
            )}
          >
            {showIcon && <ArrowLeft className={iconClasses} />}
            {getButtonLabel()}
          </Button>
        );
    }
  };

  if (!isBrowser) return null;

  return renderButton();
}

// ============================================================================
// Version avec détection automatique du thème via CSS
// ============================================================================

export function SmartBackButtonCSS({
  variant = "default",
  label,
  fallbackUrl = "/",
  showIcon = true,
  className,
  autoDetect = true,
}: Omit<SmartBackButtonProps, "theme">) {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);

    if (!isBrowser) return;

    setCanGoBack(window.history.length > 1);

    const storedPreviousPath = sessionStorage.getItem("previousPath");
    const currentPath = sessionStorage.getItem("currentPath");

    if (currentPath !== pathname) {
      sessionStorage.setItem("previousPath", currentPath || "/");
      sessionStorage.setItem("currentPath", pathname);
      setPreviousPath(currentPath);
    } else {
      setPreviousPath(storedPreviousPath);
    }
  }, [pathname, isBrowser]);

  const shouldHide =
    hiddenRoutes.includes(pathname) || pathname === fallbackUrl;
  if (shouldHide) return null;

  const getBackDestination = () => {
    if (specificBackRoutes[pathname]) {
      return specificBackRoutes[pathname];
    }

    if (!autoDetect) {
      return fallbackUrl;
    }

    if (previousPath && previousPath !== pathname && previousPath !== "/") {
      return previousPath;
    }

    if (canGoBack) {
      return null;
    }

    return fallbackUrl;
  };

  const handleGoBack = () => {
    const destination = getBackDestination();

    if (destination === null) {
      router.back();
    } else {
      router.push(destination);
    }
  };

  const getButtonLabel = () => {
    if (label) return label;

    const contextLabels: Record<string, string> = {
      "/auth/": "Retour à l'accueil",
      "/profile/": "Retour au profil",
      "/order/": "Retour aux commandes",
      "/checkout": "Retour au panier",
      "/service/": "Retour aux services",
      "/message/": "Retour aux messages",
      "/settings/": "Retour aux paramètres",
    };

    for (const [prefix, contextLabel] of Object.entries(contextLabels)) {
      if (pathname.startsWith(prefix)) {
        return contextLabel;
      }
    }

    return "Retour";
  };

  const getButtonIcon = () => {
    if (!showIcon) return null;

    const destination = getBackDestination();

    if (destination === "/") {
      return <Home className="w-4 h-4" />;
    }

    return <ArrowLeft className="w-4 h-4" />;
  };

  // Classes CSS utilisant les variables CSS pour le thème
  const getButtonClasses = () => {
    const baseClasses = "transition-all duration-200";

    switch (variant) {
      case "minimal":
        return cn(
          baseClasses,
          "group inline-flex items-center gap-2 text-sm font-medium",
          "text-slate-600 hover:text-slate-900",
          "dark:text-slate-300 dark:hover:text-white",
          className
        );

      case "floating":
        return cn(
          baseClasses,
          "fixed top-4 left-4 z-40 rounded-full p-2.5 backdrop-blur-sm border shadow-lg hover:shadow-xl",
          "bg-white/90 border-slate-200 text-slate-700 hover:bg-white",
          "dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
          "lg:hidden",
          className
        );

      case "outline":
        return cn(
          baseClasses,
          "group inline-flex items-center gap-2 px-4 py-2 rounded-lg border",
          "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400",
          "dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-500",
          className
        );

      default:
        return "";
    }
  };

  const getIconClasses = () => {
    return cn(
      "transition-colors duration-200",
      "text-slate-600 group-hover:text-slate-900",
      "dark:text-slate-400 dark:group-hover:text-white"
    );
  };

  const renderButton = () => {
    const buttonClasses = getButtonClasses();
    const iconClasses = getIconClasses();

    switch (variant) {
      case "floating":
        return (
          <button
            onClick={handleGoBack}
            className={buttonClasses}
            aria-label={getButtonLabel()}
          >
            <ChevronLeft className={cn("w-5 h-5", iconClasses)} />
          </button>
        );

      case "minimal":
        return (
          <button onClick={handleGoBack} className={buttonClasses}>
            {showIcon && <ArrowLeft className={iconClasses} />}
            <span>{getButtonLabel()}</span>
          </button>
        );

      case "outline":
        return (
          <button onClick={handleGoBack} className={buttonClasses}>
            {showIcon && <ArrowLeft className={iconClasses} />}
            <span>{getButtonLabel()}</span>
          </button>
        );

      default:
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className={cn(
              "gap-2 transition-all duration-200 group",
              "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
              "dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white",
              className
            )}
          >
            {showIcon && <ArrowLeft className={iconClasses} />}
            {getButtonLabel()}
          </Button>
        );
    }
  };

  if (!isBrowser) return null;

  return renderButton();
}

// ============================================================================
// Hook pour navigation avec thème
// ============================================================================

export function useNavigationHistory() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storeNavigationHistory = () => {
      const currentPath = window.location.pathname;
      const previousPath = sessionStorage.getItem("currentPath");

      if (previousPath !== currentPath) {
        sessionStorage.setItem("previousPath", previousPath || "/");
        sessionStorage.setItem("currentPath", currentPath);
      }
    };

    storeNavigationHistory();
  }, [pathname]);

  const goBackSmart = (fallbackUrl = "/") => {
    const previousPath = sessionStorage.getItem("previousPath");
    const currentPath = sessionStorage.getItem("currentPath");

    if (previousPath && previousPath !== currentPath && previousPath !== "/") {
      router.push(previousPath);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return { goBackSmart };
}

// ============================================================================
// Hook pour ajouter le bouton avec thème
// ============================================================================

export function useAutoBackButton(options?: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  variant?: SmartBackButtonProps["variant"];
  theme?: SmartBackButtonProps["theme"];
  floating?: boolean;
}) {
  const pathname = usePathname();

  // Ne pas afficher sur certaines pages
  const shouldShow = !hiddenRoutes.includes(pathname);
  if (!shouldShow) return null;

  // Positionnement CSS
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  const position = options?.position || "top-left";

  if (options?.floating) {
    return (
      <SmartBackButtonCSS
        variant="floating"
        className={cn(
          positionClasses[position],
          options?.position === "top-right" ||
            options?.position === "bottom-right"
            ? "lg:left-auto"
            : ""
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "container mx-auto px-4 py-4",
        position === "top-right" || position === "bottom-right"
          ? "text-right"
          : ""
      )}
    >
      <SmartBackButtonCSS
        variant={options?.variant}
        className={
          position === "top-right" || position === "bottom-right"
            ? "ml-auto"
            : ""
        }
      />
    </div>
  );
}
