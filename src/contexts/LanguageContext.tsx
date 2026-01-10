// ============================================================================
// Context: LanguageContext - Gestion globale de la langue
// ============================================================================

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation } from '@/i18n/translations';
import { MultiLangText } from '@/types';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: ReturnType<typeof getTranslation>;
  getText: (text: MultiLangText | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Vérifier localStorage
    const savedLang = localStorage.getItem('anylibre-lang') as Language;
    if (savedLang && ['fr', 'en', 'es'].includes(savedLang)) {
      setLanguage(savedLang);
    } else {
      // Détecter la langue du navigateur
      const browserLang = navigator.language.split('-')[0] as Language;
      if (['fr', 'en', 'es'].includes(browserLang)) {
        setLanguage(browserLang);
      }
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('anylibre-lang', lang);
  };

  const getText = (text: MultiLangText | string): string => {
    if (typeof text === 'string') return text;
    return text[language] || text.fr || text.en || text.es || '';
  };

  const t = getTranslation(language);

  // IMPORTANT: Toujours rendre le Provider, même lors du premier rendu
  // pour éviter l'erreur "useLanguage must be used within a LanguageProvider"
  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, getText }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook pour utiliser le contexte de manière sûre (ne lance pas d'erreur)
export function useLanguageContextSafe() {
  const context = useContext(LanguageContext);
  return context;
}
