import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // 1. Récupérer toutes les catégories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, key');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // 2. Pour chaque catégorie, compter les services
    const updates = [];
    
    for (const category of categories || []) {
      // Compter les services qui contiennent cet ID de catégorie
      const { count, error: countError } = await supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('visibility', 'public')
        .contains('categories', [category.id]);

      if (countError) {
        console.error(`Error counting for category ${category.key}:`, countError);
        continue;
      }

      // Mettre à jour le compteur
      const { error: updateError } = await supabase
        .from('categories')
        .update({ services_count: count || 0 })
        .eq('id', category.id);

      if (updateError) {
        console.error(`Error updating category ${category.key}:`, updateError);
      } else {
        updates.push({
          category: category.key,
          count: count || 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Category counts updated successfully',
      updates,
    });

  } catch (error) {
    console.error('Error in fix-category-counts API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}