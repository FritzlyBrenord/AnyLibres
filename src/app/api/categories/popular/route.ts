// ============================================================================
// API: Categories Popular - Catégories populaires
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');

    // Récupérer les catégories avec le nombre de services
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        services:services(count)
      `)
      .order('services(count)', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular categories:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch popular categories',
          data: [],
        },
        { status: 500 }
      );
    }

    // Transformer les données pour ajouter services_count
    const categoriesWithCount = categories?.map((category: any) => ({
      ...category,
      services_count: category.services?.[0]?.count || 0,
      services: undefined, // Retirer l'objet services pour nettoyer
    })) || [];

    return NextResponse.json({
      success: true,
      data: categoriesWithCount,
      total: categoriesWithCount.length,
    });
  } catch (error) {
    console.error('Error in popular categories API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: [],
      },
      { status: 500 }
    );
  }
}
