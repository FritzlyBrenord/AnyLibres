// ============================================================================
// UTILS: Fonctions utilitaires générales
// ============================================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine les classes Tailwind de manière intelligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Récupère la valeur d'un objet multilingue selon la locale
 */
export function getLocalizedValue(
  obj: { fr?: string; en?: string; es?: string } | undefined,
  locale: string = 'fr'
): string {
  if (!obj) return '';
  return obj[locale as keyof typeof obj] || obj.fr || obj.en || obj.es || '';
}

/**
 * Tronque un texte à une longueur donnée
 */
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Sleep fonction pour les tests
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}