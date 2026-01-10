// ============================================================================
// API: Favorites (Add/Remove/Count/List)
// Route: /api/favorites
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Ajouter aux favoris
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { serviceId } = await request.json();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Get user's profile to get profile id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    console.log('POST /api/favorites - User ID:', user.id);
    console.log('POST /api/favorites - Profile data:', profile);
    console.log('POST /api/favorites - Profile error:', profileError);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    console.log('POST /api/favorites - Will use client_id:', profile.id);

    // Vérifier si le favori existe déjà
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('client_id', profile.id)
      .eq('service_id', serviceId)
      .single();

    if (existing) {
      console.log('POST /api/favorites - Already exists:', existing);
      return NextResponse.json({
        success: true,
        message: 'Already in favorites',
        data: existing,
      });
    }

    // Ajouter aux favoris
    const { data: favorite, error: favoriteError } = await supabase
      .from('favorites')
      .insert({
        client_id: profile.id,
        service_id: serviceId,
      })
      .select()
      .single();

    console.log('POST /api/favorites - Inserted favorite:', favorite);
    console.log('POST /api/favorites - Insert error:', favoriteError);

    if (favoriteError) {
      console.error('Error adding to favorites:', favoriteError);
      return NextResponse.json(
        { success: false, error: 'Failed to add to favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Added to favorites',
      data: favorite,
    });

  } catch (error) {
    console.error('Error in favorites API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

// DELETE - Retirer des favoris
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Retirer des favoris
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('client_id', profile.id)
      .eq('service_id', serviceId);

    if (deleteError) {
      console.error('Error removing from favorites:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove from favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites',
    });

  } catch (error) {
    console.error('Error in favorites API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

// GET - Multi-fonction: Vérifier un favori, lister tous les favoris, ou compter
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const action = searchParams.get('action'); // 'check', 'list', 'count'

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      // Pour les actions qui nécessitent une authentification
      if (action === 'list' || action === 'count') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // Pour 'check', on retourne simplement false si non authentifié
      return NextResponse.json({
        success: true,
        data: { isFavorite: false },
      });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      if (action === 'list' || action === 'count') {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { isFavorite: false },
      });
    }

    // ACTION: Compter les favoris
    if (action === 'count') {
      const { count, error: countError } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', profile.id);

      if (countError) {
        console.error('Error counting favorites:', countError);
        return NextResponse.json(
          { success: false, error: 'Failed to count favorites' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          count: count || 0,
          client_id: profile.id
        },
      });
    }

    // ACTION: Lister tous les favoris
    if (action === 'list') {
      const { data: rawFavorites, error: rawError } = await supabase
        .from('favorites')
        .select('*')
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });

      if (rawError) {
        console.error('Error fetching favorites:', rawError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch favorites' },
          { status: 500 }
        );
      }

      if (!rawFavorites || rawFavorites.length === 0) {
        return NextResponse.json({
          success: true,
          data: { favorites: [], count: 0 },
        });
      }

      // Récupérer les services complets
      const serviceIds = rawFavorites.map(f => f.service_id);

      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          providers (
            *,
            profiles (
              *
            )
          )
        `)
        .in('id', serviceIds);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch services' },
          { status: 500 }
        );
      }

      // Combiner les données
      const favorites = rawFavorites.map(favorite => {
        const service = services?.find(s => s.id === favorite.service_id);
        
        return {
          id: favorite.id,
          created_at: favorite.created_at,
          service_id: favorite.service_id,
          client_id: favorite.client_id,
          service: service || null,
        };
      });

      return NextResponse.json({
        success: true,
        data: { 
          favorites,
          count: favorites.length 
        },
      });
    }

    // ACTION PAR DÉFAUT: Vérifier si un service est en favori
    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required for check action' },
        { status: 400 }
      );
    }

    const { data: favorite } = await supabase
      .from('favorites')
      .select('id')
      .eq('client_id', profile.id)
      .eq('service_id', serviceId)
      .single();

    return NextResponse.json({
      success: true,
      data: { isFavorite: !!favorite },
    });

  } catch (error) {
    console.error('Error in favorites GET API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// FONCTION EXPORTÉE: Obtenir le compte des favoris
// ============================================================================

export async function getFavoritesCount() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized', status: 401 };
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: 'Profile not found', status: 404 };
    }

    // Compter le nombre exact de favoris
    const { count, error: countError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', profile.id);

    if (countError) {
      console.error('Error counting favorites:', countError);
      return { success: false, error: 'Failed to count favorites', status: 500 };
    }

    return {
      success: true,
      data: {
        count: count || 0,
        client_id: profile.id
      }
    };
  } catch (error: any) {
    console.error('Error in getFavoritesCount:', error);
    return { 
      success: false, 
      error: error.message || 'Internal server error', 
      status: 500 
    };
  }
}