// app/api/services/category/route.ts - VERSION CORRIGÉE
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    // Paramètres
    const categoryKey = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort') || 'popular';
    const offset = (page - 1) * limit;

    if (!categoryKey) {
      return NextResponse.json(
        { success: false, error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Filtering services by category:', categoryKey);

    // 1. D'abord, récupérer l'ID de la catégorie depuis la clé
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, key')
      .eq('key', categoryKey)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // 2. Maintenant, récupérer les services qui contiennent cet ID dans le array categories
    let query = supabase
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
      `, { count: 'exact' })
      .eq('visibility', 'public');

    // Filtrer par catégorie - le champ categories est un array d'UUID
    query = query.contains('categories', [category.id]);

    // Appliquer le tri
    switch (sort) {
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('base_price_cents', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('base_price_cents', { ascending: false });
        break;
      case 'rating':
        // Note: Le tri par rating sur la table jointe providers nécessite une logique complexe
        // Pour l'instant, on trie par date de création pour éviter l'erreur
        query = query.order('created_at', { ascending: false });
        break;
      default: // 'popular' - si pas de colonne popularity, on utilise created_at
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: services, error: servicesError, count } = await query;

    if (servicesError) {
      console.error('Error fetching services by category:', servicesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch services: ' + servicesError.message },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Formater les données
    const formattedServices = (services || []).map((service: any) => {
      // Helper pour parser JSON en toute sécurité
      const safeParse = (val: any) => {
        if (typeof val !== 'string') return val;
        try { return JSON.parse(val); } catch (e) { return val; }
      };

      return {
        ...service,
        title: safeParse(service.title),
        short_description: safeParse(service.short_description),
        description: safeParse(service.description),
        base_price: service.base_price_cents / 100,
        price_min: service.price_min_cents ? service.price_min_cents / 100 : undefined,
        price_max: service.price_max_cents ? service.price_max_cents / 100 : undefined,
        // Ajouter les informations de catégorie
        category: category
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        services: formattedServices,
        category: category,
        total,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error in category services API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}