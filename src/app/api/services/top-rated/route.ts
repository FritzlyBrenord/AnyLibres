// ============================================================================
// API: Services Top Rated - Services les mieux notés
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const period = searchParams.get('period') || 'week'; // week, month, all

    // Calculer la date de début selon la période
    let dateFilter = null;
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = weekAgo.toISOString();
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = monthAgo.toISOString();
    }

    // Construire la requête
    let query = supabase
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
      .gte('rating', 4.5)
      .gte('total_reviews', 5);

    // Ajouter le filtre de date si nécessaire
    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data: services, error } = await query
      .order('rating', { ascending: false })
      .order('total_reviews', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top rated services:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch top rated services',
          data: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: services || [],
      total: services?.length || 0,
      period,
    });
  } catch (error) {
    console.error('Error in top-rated API:', error);
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
