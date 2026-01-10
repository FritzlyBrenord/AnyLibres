'use client';

import { Header } from "@/components/layout/Header";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface TranslatedHeaderProps {
  variant?: "transparent" | "solid";
  disableScrollEffect?: boolean;
  disableSearchBar?: boolean;
  disableBarSearch?: boolean;
  disableNavigation?: boolean;
  disableAuth?: boolean;
  fixed?: boolean;
  className?: string;
}

export function TranslatedHeader(props: TranslatedHeaderProps) {
  const { t, language } = useSafeLanguage();
  
  // Si la langue est disponible, afficher le LanguageSwitcher
  const showLanguageSwitcher = language !== undefined;

  return (
    <Header
      {...props}
      navTexts={{
        explore: t.navigation.explore,
        about: t.navigation.about,
        login: t.navigation.login,
        register: t.navigation.register,
      }}
      showLanguageSwitcher={showLanguageSwitcher}
    />
  );
}
