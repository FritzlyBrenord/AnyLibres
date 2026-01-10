// ============================================================================
// API: Services New Arrivals - Nouveaux services
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    // Récupérer les services les plus récents (créés dans les derniers jours)
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
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching new arrivals:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch new arrivals',
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
    console.error('Error in new-arrivals API:', error);
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
