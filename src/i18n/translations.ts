// ============================================================================
// i18n: Translations for Service Detail Page
// ============================================================================

import { fr, en, es } from './locals';

export type Language = 'fr' | 'en' | 'es';

export const translations = {
  fr,
  en,
  es
};

// Fonction utilitaire pour fusionner profondément deux objets
function deepMerge(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function getTranslation(lang: Language) {
  // Si français, retourner directement
  if (lang === 'fr') return translations.fr;

  // Sinon, fusionner avec le français comme base
  const langTranslations = translations[lang];
  if (!langTranslations) return translations.fr;

  // Merge profond : français en base, langue sélectionnée par-dessus
  return deepMerge(translations.fr, langTranslations);
}

/**
 * Retourne une fonction de traduction 't' basée sur l'objet de translations fourni
 * Supporte à la fois t('cle.chemin') et t.cle.chemin
 */
export function getT(translationsObj: any) {
  const tFunc = (path: string, params?: Record<string, any>) => {
    if (!path) return translationsObj;
    const keys = path.split('.');
    let current = translationsObj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback si la clé n'existe pas
        return path;
      }
    }

    // Support de l'interpolation simple : {nomVariable}
    if (typeof current === 'string' && params) {
      let result = current;
      Object.keys(params).forEach(key => {
        result = result.replace(new RegExp(`{${key}}`, 'g'), params[key]);
      });
      return result;
    }

    return current;
  };

  // On attache les propriétés de l'objet à la fonction pour permettre l'accès direct (ex: t.navigation)
  return Object.assign(tFunc, translationsObj);
}