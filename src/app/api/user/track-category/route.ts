// ============================================================================
// API: Track Category - Enregistrer les catégories consultées
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
    const { categoryId, categoryName } = body;

    if (!categoryId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category ID is required',
        },
        { status: 400 }
      );
    }

    // Vérifier si une entrée existe déjà
    const { data: existingView } = await supabase
      .from('user_category_views')
      .select('id, view_count')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .single();

    if (existingView) {
      // Mettre à jour l'entrée existante
      const { error: updateError } = await supabase
        .from('user_category_views')
        .update({
          viewed_at: new Date().toISOString(),
          view_count: (existingView.view_count || 0) + 1,
        })
        .eq('id', existingView.id);

      if (updateError) {
        console.error('Error updating category view:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to update category view',
          },
          { status: 500 }
        );
      }
    } else {
      // Créer une nouvelle entrée
      const { error: insertError } = await supabase
        .from('user_category_views')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          viewed_at: new Date().toISOString(),
          view_count: 1,
        });

      if (insertError) {
        console.error('Error inserting category view:', insertError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create category view',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Category view tracked successfully',
    });
  } catch (error) {
    console.error('Error in track-category API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
