// ============================================================================
// API: GET /api/providers/popular
// Retourne les prestataires les mieux notés
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const supabase = await createClient();

    const { data: providers, error } = await supabase
      .from('providers')
      .select(`
        *,
        profile:profiles!inner(
          id,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching popular providers:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch providers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: providers || [],
    });
  } catch (error) {
    console.error('Error in popular providers API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}