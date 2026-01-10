// ============================================================================
// API: Track View - Enregistrer la vue d'un service
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
    const { serviceId, serviceTitle, categoryId, providerId } = body;

    if (!serviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service ID is required',
        },
        { status: 400 }
      );
    }

    // Vérifier si une vue existe déjà pour ce service et cet utilisateur
    const { data: existingView } = await supabase
      .from('user_service_views')
      .select('id, view_count')
      .eq('user_id', user.id)
      .eq('service_id', serviceId)
      .single();

    if (existingView) {
      // Mettre à jour la vue existante
      const { error: updateError } = await supabase
        .from('user_service_views')
        .update({
          viewed_at: new Date().toISOString(),
          view_count: (existingView.view_count || 0) + 1,
          category_id: categoryId,
          provider_id: providerId,
        })
        .eq('id', existingView.id);

      if (updateError) {
        console.error('Error updating view:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to update view',
          },
          { status: 500 }
        );
      }
    } else {
      // Créer une nouvelle vue
      const { error: insertError } = await supabase
        .from('user_service_views')
        .insert({
          user_id: user.id,
          service_id: serviceId,
          category_id: categoryId,
          provider_id: providerId,
          viewed_at: new Date().toISOString(),
          view_count: 1,
        });

      if (insertError) {
        console.error('Error inserting view:', insertError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create view',
          },
          { status: 500 }
        );
      }
    }

    // Incrémenter le compteur de vues du service
    const { error: serviceUpdateError } = await supabase.rpc(
      'increment_service_views',
      {
        service_id: serviceId,
      }
    );

    if (serviceUpdateError) {
      console.error('Error incrementing service views:', serviceUpdateError);
      // Ne pas retourner d'erreur, la vue utilisateur est enregistrée
    }

    return NextResponse.json({
      success: true,
      message: 'View tracked successfully',
    });
  } catch (error) {
    console.error('Error in track-view API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
