// ============================================================================
// Types: Languages - Configuration des langues supportées
// Fichier central pour gérer les langues de l'application
// ============================================================================

/**
 * Type pour les codes de langue supportés
 * Ajouter ici de nouvelles langues si nécessaire
 */
export type SupportedLanguage = 'fr' | 'en' | 'es';

/**
 * Configuration d'une langue
 */
export interface LanguageConfig {
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    flag: string;
    enabled: boolean;
}

/**
 * Liste des langues supportées par l'application
 * Pour ajouter une nouvelle langue :
 * 1. Ajouter le code dans SupportedLanguage ci-dessus
 * 2. Ajouter la configuration ici
 * 3. Ajouter les traductions dans src/i18n/translations.ts
 */
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
    {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷',
        enabled: true,
    },
    {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        enabled: true,
    },
    {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
        enabled: true,
    },
    // Pour ajouter une nouvelle langue, décommenter et configurer :
    // {
    //     code: 'de',
    //     name: 'German',
    //     nativeName: 'Deutsch',
    //     flag: '🇩🇪',
    //     enabled: true,
    // },
];

/**
 * Langue par défaut de l'application
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';

/**
 * Obtenir uniquement les langues activées
 */
export function getEnabledLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES.filter(lang => lang.enabled);
}

/**
 * Obtenir la configuration d'une langue par son code
 */
export function getLanguageConfig(code: SupportedLanguage): LanguageConfig | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Vérifier si un code de langue est supporté
 */
export function isSupportedLanguage(code: string): code is SupportedLanguage {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === code && lang.enabled);
}
