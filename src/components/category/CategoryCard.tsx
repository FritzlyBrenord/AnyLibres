// ============================================================================
// Component: CategoryCard - Carte de catégorie avec traduction automatique
// ============================================================================

'use client';

import Link from "next/link";
import { Folder } from "lucide-react";
import type { Category } from "@/types";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const { t } = useSafeLanguage();
  const categoryName = useAutoTranslate(category.name);

  return (
    <Link
      href={`/categories/${category.key}`}
      className="group relative p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 text-center"
    >
      {/* Icône simple */}
      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-slate-200 transition-colors">
        <Folder className="w-6 h-6 text-slate-600" />
      </div>

      {/* Nom de la catégorie */}
      <h3 className="font-semibold text-sm text-slate-900 mb-1 line-clamp-2">
        {categoryName}
      </h3>

      {/* Nombre de services */}
      <p className="text-xs text-slate-500 font-medium">
        {category.services_count} {t.home.categories.servicesCount}
      </p>
    </Link>
  );
}
