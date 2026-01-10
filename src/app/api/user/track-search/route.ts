// ============================================================================
// API: Track Search - Enregistrer les recherches de l'utilisateur
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { query, filters } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query is required',
        },
        { status: 400 }
      );
    }

    // Enregistrer la recherche
    const { error: insertError } = await supabase
      .from('user_searches')
      .insert({
        user_id: user.id,
        query: query.trim(),
        filters: filters || null,
        searched_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting search:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to track search',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Search tracked successfully',
    });
  } catch (error) {
    console.error('Error in track-search API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
