// ============================================================================
// Component: CategoryName - Affiche le nom d'une catégorie avec traduction automatique
// ============================================================================

'use client';

import { useSmartTranslate } from '@/hooks/useSmartTranslate';
import type { Category } from '@/types';

interface CategoryNameProps {
  category: Category;
  className?: string;
}

/**
 * Composant pour afficher le nom d'une catégorie avec traduction automatique
 * Utilise useSmartTranslate pour traduire le nom selon la langue active
 */
export function CategoryName({ category, className = '' }: CategoryNameProps) {
  // Récupérer le nom de la catégorie (priorité: fr > en > name)
  const categoryName = category.name?.fr || category.name?.en || category.name || '';
  
  // Traduire automatiquement le nom de la catégorie
  // On force sourceLang='fr' car les catégories sont en français dans la BD
  const { translatedText } = useSmartTranslate(categoryName, 'fr');

  return <span className={className}>{translatedText}</span>;
}
