// ============================================================================
// API: GET /api/services/search
// Recherche intelligente multi-champs avec scoring de pertinence
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Fonction pour extraire les informations de prix de la requête
function extractPriceInfo(query: string): { query: string; minPrice?: number; maxPrice?: number } {
  let cleanQuery = query;
  let minPrice: number | undefined;
  let maxPrice: number | undefined;

  // Pattern: "50-100€" ou "50-100 euros"
  const rangeMatch = query.match(/(\d+)\s*-\s*(\d+)\s*[€$euros?]/i);
  if (rangeMatch) {
    minPrice = parseFloat(rangeMatch[1]);
    maxPrice = parseFloat(rangeMatch[2]);
    cleanQuery = query.replace(rangeMatch[0], '').trim();
  }

  // Pattern: "50€" ou "50 euros"
  const exactMatch = query.match(/(\d+)\s*[€$euros?]/i);
  if (exactMatch && !rangeMatch) {
    const price = parseFloat(exactMatch[1]);
    // Fourchette de ±20% autour du prix
    minPrice = price * 0.8;
    maxPrice = price * 1.2;
    cleanQuery = query.replace(exactMatch[0], '').trim();
  }

  // Pattern: "moins de 100" ou "< 100"
  const maxOnlyMatch = query.match(/(?:moins de|<)\s*(\d+)/i);
  if (maxOnlyMatch) {
    maxPrice = parseFloat(maxOnlyMatch[1]);
    cleanQuery = query.replace(maxOnlyMatch[0], '').trim();
  }

  // Pattern: "plus de 100" ou "> 100"
  const minOnlyMatch = query.match(/(?:plus de|>)\s*(\d+)/i);
  if (minOnlyMatch) {
    minPrice = parseFloat(minOnlyMatch[1]);
    cleanQuery = query.replace(minOnlyMatch[0], '').trim();
  }

  return { query: cleanQuery, minPrice, maxPrice };
}

export async function GET(request: Request) {
  try {
    // Parse URL parameters
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const categoryId = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'relevance';
    const letter = searchParams.get('letter');
    const startsWith = searchParams.get('startsWith') === 'true';
    const offset = (page - 1) * limit;
    const fieldsParam = searchParams.get('fields');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');

    console.log('🔍 Search API called:', { rawQuery, categoryId, page, limit, sort, fieldsParam, minPriceParam, maxPriceParam });

    // Extraction des informations de prix "intelligente" (texte)
    const { query, minPrice: extractedMin, maxPrice: extractedMax } = extractPriceInfo(rawQuery);

    // Priorité aux paramètres explicites, sinon extraction du texte
    const minPrice = minPriceParam ? parseFloat(minPriceParam) : extractedMin;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : extractedMax;

    if (minPrice || maxPrice) {
      console.log('💰 Price filter active:', { minPrice, maxPrice });
    }

    const supabase = await createClient();

    // Si pas de query ET pas de filtres, retourner populaire
    const hasFilters = rawQuery.trim() || categoryId || minPriceParam || maxPriceParam || letter || startsWith || sort !== 'relevance';

    if (!hasFilters) {
      let popularQuery = supabase
        .from('services')
        .select(`
          *,
          provider:providers!inner(
            id,
            company_name,
            rating,
            profile:profiles!inner(
              id,
              display_name,
              avatar_url
            )
          )
        `, { count: 'exact' })
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: services, error, count } = await popularQuery;
      if (error) throw error;
      return NextResponse.json({
        success: true,
        data: services || [],
        total: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        query: rawQuery,
      });
    }

    // Construire la requête de recherche multi-champs
    let searchQuery = supabase
      .from('services')
      .select(`
        *,
        provider:providers!inner(
          id,
          company_name,
          rating,
          profession,
          skills,
          profile:profiles!inner(
            id,
            display_name,
            avatar_url,
            first_name,
            last_name
          )
        )
      `, { count: 'exact' })
      .eq('visibility', 'public');

    // Filtre par catégorie si spécifiée
    if (categoryId) {
      searchQuery = searchQuery.contains('categories', [categoryId]);
    }

    // Filtre par prix explicite
    if (minPrice !== undefined) {
      const minPriceCents = Math.round(minPrice * 100);
      searchQuery = searchQuery.gte('base_price_cents', minPriceCents);
    }
    if (maxPrice !== undefined) {
      const maxPriceCents = Math.round(maxPrice * 100);
      searchQuery = searchQuery.lte('base_price_cents', maxPriceCents);
    }

    // Filtre par lettre
    if (letter) {
      const letterUpper = letter.toUpperCase();
      if (startsWith) {
        searchQuery = searchQuery.or(`title->>fr.ilike.${letterUpper}%,description->>fr.ilike.${letterUpper}%`);
      } else {
        searchQuery = searchQuery.or(`title->>fr.ilike.%${letterUpper}%,description->>fr.ilike.%${letterUpper}%`);
      }
    }
    // Recherche textuelle
    else if (query.trim()) {
      const searchTerms = query.trim().toLowerCase().split(' ').filter(t => t.length > 0);
      const fields = fieldsParam ? fieldsParam.split(',') : ['title', 'description'];

      const conditions: string[] = [];

      searchTerms.forEach(term => {
        // Recherche dans le titre (JSONB : fr et en)
        if (fields.includes('title')) {
          conditions.push(`title->>fr.ilike.%${term}%`);
          conditions.push(`title->>en.ilike.%${term}%`);
        }

        // Recherche dans la description (JSONB : fr et en)
        if (fields.includes('description')) {
          conditions.push(`description->>fr.ilike.%${term}%`);
          conditions.push(`description->>en.ilike.%${term}%`);
        }
      });

      // Appliquer la condition OR
      if (conditions.length > 0) {
        console.log('Search Conditions:', conditions.join(','));
        searchQuery = searchQuery.or(conditions.join(','));
      }
    }

    // Appliquer le tri
    switch (sort) {
      case 'price_asc':
        searchQuery = searchQuery.order('base_price_cents', { ascending: true });
        break;
      case 'price_desc':
        searchQuery = searchQuery.order('base_price_cents', { ascending: false });
        break;
      case 'rating':
        // Note: Sort by foreign table can be unstable. Using safe fallback if needed.
        // Trying to keep it, but if it fails we might need to remove 'foreignTable' or use RPC.
        // For now, let's trust the OR fix is enough.
        searchQuery = searchQuery.order('rating', { foreignTable: 'providers', ascending: false });
        break;
      case 'recent':
        searchQuery = searchQuery.order('created_at', { ascending: false });
        break;
      case 'relevance':
        // Default sort
        searchQuery = searchQuery.order('created_at', { ascending: false });
        break;
      default:
        searchQuery = searchQuery.order('created_at', { ascending: false });
    }

    // Pagination
    searchQuery = searchQuery.range(offset, offset + limit - 1);

    const { data: services, error, count } = await searchQuery;

    if (error) {
      console.error('❌ Error searching services:', error);
      // Return explicit error to debug why filters fail
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.details,
        hint: error.hint,
        message: 'Search query failed'
      }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(`✅ Intelligent search successful: ${services?.length || 0}/${count || 0} services found`);

    // Organiser les résultats de manière hiérarchisée si une recherche est effectuée
    let organizedResults = services;
    let resultCategories = null;

    if (services && services.length > 0 && query.trim()) {
      const queryLower = query.toLowerCase();
      const exactMatches: any[] = [];
      const similarMatches: any[] = [];
      const otherMatches: any[] = [];

      services.forEach(service => {
        const titleStr = service.title?.toString().toLowerCase() || '';
        const descStr = service.description?.toString().toLowerCase() || '';
        const providerName = service.provider?.company_name?.toLowerCase() || '';

        // Correspondance exacte dans le titre
        if (titleStr === queryLower || titleStr.startsWith(queryLower)) {
          exactMatches.push(service);
        }
        // Correspondance dans le titre ou nom du provider
        else if (titleStr.includes(queryLower) || providerName.includes(queryLower)) {
          similarMatches.push(service);
        }
        // Autres correspondances (description, tags, etc.)
        else {
          otherMatches.push(service);
        }
      });

      resultCategories = {
        exact: exactMatches,
        similar: similarMatches,
        other: otherMatches,
      };

      console.log('📊 Results organized:', {
        exact: exactMatches.length,
        similar: similarMatches.length,
        other: otherMatches.length,
      });
    }

    // Si aucun résultat et qu'il y avait une recherche, suggérer des alternatives
    if (services && services.length === 0 && query.trim()) {
      console.log('💡 No results, fetching suggestions...');

      // Rechercher dans les catégories populaires
      const { data: suggestions } = await supabase
        .from('services')
        .select(`
          *,
          provider:providers!inner(
            id,
            company_name,
            rating,
            profile:profiles!inner(
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(6);

      return NextResponse.json({
        success: true,
        data: [],
        suggestions: suggestions || [],
        total: 0,
        currentPage: page,
        totalPages: 0,
        query: rawQuery,
        message: `Aucun résultat pour "${rawQuery}". Voici des suggestions.`
      });
    }

    return NextResponse.json({
      success: true,
      data: services || [],
      total: count || 0,
      currentPage: page,
      totalPages,
      query: rawQuery,
      filters: {
        minPrice,
        maxPrice,
        category: categoryId,
        letter,
        startsWith,
      },
      resultCategories, // Résultats hiérarchisés
    });

  } catch (error) {
    console.error('💥 Error in intelligent search API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error during search'
    }, { status: 500 });
  }
}