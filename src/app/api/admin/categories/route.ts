// ============================================================================
// API: Admin Categories - Récupérer toutes les catégories
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin');

    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name->fr', { ascending: true });

    if (error) {
      console.error('[API CATEGORIES] Error:', error);
      console.error('[API CATEGORIES] Error code:', error.code);
      console.error('[API CATEGORIES] Error details:', error.details);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des catégories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { categories: categories || [] },
    });

  } catch (error) {
    console.error('[API CATEGORIES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
