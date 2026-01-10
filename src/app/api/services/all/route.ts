// ============================================================================
// API: GET /api/services/popular
// Retourne les services les plus populaires
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const supabase = await createClient();

    
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        provider:providers!inner(
          id,
          company_name,
          rating,
          profile:profiles!inner(
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('visibility', 'public')
      .order('popularity', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error fetching popular services:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: services || [],
    });
  } catch (error) {
    console.error('Error in popular services API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}