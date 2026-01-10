// ============================================================================
// API: GET Similar Services
// Route: /api/services/similar
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    const serviceId = searchParams.get('serviceId');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // 1. Récupérer le service de référence pour obtenir ses catégories
    const { data: referenceService, error: refError } = await supabase
      .from('services')
      .select('categories')
      .eq('id', serviceId)
      .single();

    if (refError || !referenceService) {
      return NextResponse.json(
        { success: false, error: 'Reference service not found' },
        { status: 404 }
      );
    }

    // 2. Trouver des services similaires (même catégorie, excluant le service actuel)
    const { data: similarServices, error: similarError } = await supabase
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
            avatar_url
          )
        )
      `)
      .eq('visibility', 'public')
      .neq('id', serviceId)
      .overlaps('categories', referenceService.categories)
      .order('popularity', { ascending: false })
      .limit(limit);

    if (similarError) {
      console.error('Error fetching similar services:', similarError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch similar services' },
        { status: 500 }
      );
    }

    // Formater les données
    const formattedServices = (similarServices || []).map((service: any) => ({
      ...service,
      title: typeof service.title === 'string' ? JSON.parse(service.title) : service.title,
      short_description: typeof service.short_description === 'string'
        ? JSON.parse(service.short_description)
        : service.short_description,
      description: typeof service.description === 'string'
        ? JSON.parse(service.description)
        : service.description,
      base_price: service.base_price_cents / 100,
      price_min: service.price_min_cents ? service.price_min_cents / 100 : undefined,
      price_max: service.price_max_cents ? service.price_max_cents / 100 : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        services: formattedServices,
        total: formattedServices.length,
      },
    });

  } catch (error) {
    console.error('Error in similar services API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}
