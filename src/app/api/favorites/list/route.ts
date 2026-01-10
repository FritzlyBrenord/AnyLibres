// app/api/favorites/list/route.ts - VERSION COMPLÈTE AVEC TOUTES LES INFORMATIONS
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Récupérer les favoris
    const { data: rawFavorites, error: rawError } = await supabase
      .from('favorites')
      .select('*')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false });

    if (rawError) {
      console.error('Error fetching favorites:', rawError);
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    if (!rawFavorites || rawFavorites.length === 0) {
      return NextResponse.json({
        success: true,
        data: { favorites: [] },
      });
    }

    // Récupérer les services avec TOUTES les informations du prestataire
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
        { error: 'Failed to fetch services: ' + servicesError.message },
        { status: 500 }
      );
    }

    // Combiner les favoris avec les services - TOUTES LES INFORMATIONS SONT INCLUSES
    const favorites = rawFavorites.map(favorite => {
      const service = services?.find(s => s.id === favorite.service_id);
      
      // Retourner toutes les données sans filtrage
      return {
        id: favorite.id,
        created_at: favorite.created_at,
        service_id: favorite.service_id,
        client_id: favorite.client_id,
        service: service || null, // Inclut toutes les colonnes du service
      };
    });

    console.log('Favorites found:', favorites.length);
    console.log('Sample favorite service:', favorites[0]?.service);
    console.log('Sample favorite provider:', favorites[0]?.service?.providers);

    return NextResponse.json({
      success: true,
      data: { favorites },
    });
  } catch (error: any) {
    console.error('Error in favorites list API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}