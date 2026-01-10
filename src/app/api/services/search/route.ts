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
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const categoryId = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'relevance';
    const letter = searchParams.get('letter');
    const startsWith = searchParams.get('startsWith') === 'true';
    const offset = (page - 1) * limit;

    console.log('🔍 Intelligent Search API called:', { rawQuery, categoryId, page, limit, sort, letter, startsWith });

    // Extraction des informations de prix
    const { query, minPrice, maxPrice } = extractPriceInfo(rawQuery);

    if (minPrice || maxPrice) {
      console.log('💰 Price filter detected:', { minPrice, maxPrice, cleanQuery: query });
    }

    const supabase = await createClient();

    // Si pas de query, retourner les services populaires
    if (!query.trim() && !categoryId) {
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

    // Filtre par prix si détecté (prix en USD dans la DB)
    if (minPrice !== undefined || maxPrice !== undefined) {
      if (minPrice !== undefined) {
        const minPriceCents = Math.round(minPrice * 100);
        searchQuery = searchQuery.gte('base_price_cents', minPriceCents);
      }
      if (maxPrice !== undefined) {
        const maxPriceCents = Math.round(maxPrice * 100);
        searchQuery = searchQuery.lte('base_price_cents', maxPriceCents);
      }
    }

    // Filtre par lettre si spécifié
    if (letter) {
      const letterUpper = letter.toUpperCase();
      if (startsWith) {
        // Services commençant par la lettre
        searchQuery = searchQuery.or(`title.ilike.${letterUpper}%,description.ilike.${letterUpper}%`);
      } else {
        // Services contenant la lettre
        searchQuery = searchQuery.or(`title.ilike.%${letterUpper}%,description.ilike.%${letterUpper}%`);
      }
    }
    // Recherche multi-champs si query fourni
    else if (query.trim()) {
      const searchTerms = query.trim().toLowerCase().split(' ').filter(t => t.length > 0);

      // Construire une condition OR pour rechercher dans tous les champs
      const conditions: string[] = [];

      searchTerms.forEach(term => {
        // Recherche dans le titre (priorité haute)
        conditions.push(`title.ilike.%${term}%`);

        // Recherche dans la description
        conditions.push(`description.ilike.%${term}%`);

        // Recherche dans les tags (array JSONB)
        conditions.push(`tags.cs.{"${term}"}`);

        // Recherche dans le nom de l'entreprise du prestataire
        conditions.push(`provider.company_name.ilike.%${term}%`);

        // Recherche dans le nom d'affichage du profil
        conditions.push(`provider.profile.display_name.ilike.%${term}%`);

        // Recherche dans le prénom et nom
        conditions.push(`provider.profile.first_name.ilike.%${term}%`);
        conditions.push(`provider.profile.last_name.ilike.%${term}%`);

        // Recherche dans la profession du prestataire
        conditions.push(`provider.profession.ilike.%${term}%`);
      });

      // Appliquer la condition OR
      if (conditions.length > 0) {
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
        searchQuery = searchQuery.order('provider.rating', { ascending: false });
        break;
      case 'recent':
        searchQuery = searchQuery.order('created_at', { ascending: false });
        break;
      default:
        // Par défaut, tri par pertinence (date récente)
        searchQuery = searchQuery.order('created_at', { ascending: false });
    }

    // Pagination
    searchQuery = searchQuery.range(offset, offset + limit - 1);

    const { data: services, error, count } = await searchQuery;

    if (error) {
      console.error('❌ Error searching services:', error);

      // Fallback: retourner des services populaires si erreur
      const { data: fallbackServices } = await supabase
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
        .limit(limit);

      return NextResponse.json({
        success: true,
        data: fallbackServices || [],
        total: fallbackServices?.length || 0,
        currentPage: 1,
        totalPages: 1,
        query: rawQuery,
        fallback: true,
        message: 'Showing popular services due to search error'
      });
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

    // En cas d'erreur, retourner quand même quelques services
    const supabase = await createClient();
    const { data: fallbackServices } = await supabase
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
      .limit(12);

    return NextResponse.json({
      success: true,
      data: fallbackServices || [],
      total: fallbackServices?.length || 0,
      currentPage: 1,
      totalPages: 1,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Showing popular services'
    });
  }
}