// ============================================================================
// API: Services Trending - Services populaires/tendances
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    // Récupérer les services avec le plus de vues/commandes récentes
    // On utilise une combinaison de : nombre de vues, notes, et date de création
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        provider:providers (
          id,
          business_name,
          avatar_url,
          rating,
          total_reviews
        ),
        category:categories (
          id,
          name,
          slug,
          icon
        )
      `)
      .eq('status', 'published')
      .gte('rating', 4.0)
      .order('views_count', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trending services:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch trending services',
          data: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: services || [],
      total: services?.length || 0,
    });
  } catch (error) {
    console.error('Error in trending API:', error);
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
