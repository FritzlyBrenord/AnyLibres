// ============================================================================
// API: GET /api/services/popular
// Retourne les services les plus populaires
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const supabase = await createClient();

    // Récupérer les 8 services les plus populaires
    // Note: provider est optionnel (left join) pour gérer les services sans provider
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        provider:providers(
          id,
          company_name,
          rating,
          profile:profiles(
            id,
            display_name,
            avatar_url,
            first_name,
            last_name
          )
        )
      `)
      .eq('visibility', 'public')
      .eq('status', 'published')
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