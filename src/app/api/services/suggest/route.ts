// ============================================================================
// API: GET /api/services/suggest
// Suggestions intelligentes pour la recherche avancée
// Analyse par lettre, chiffre, mots-clés, services et providers
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('🔍 Suggest API called:', { query, limit });

    const supabase = await createClient();

    // Si la requête est vide, retourner des suggestions populaires
    if (!query.trim()) {
      const { data: popularServices } = await supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          base_price_cents,
          tags,
          provider:providers!inner(
            id,
            company_name,
            profile:profiles!inner(
              id,
              display_name
            )
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);

      return NextResponse.json({
        success: true,
        services: popularServices || [],
        providers: [],
        keywords: [],
      });
    }

    const queryLower = query.toLowerCase();
    const results: any = {
      services: [],
      providers: [],
      keywords: [],
    };

    // 1. Recherche de services
    // Recherche multi-champs avec scoring
    const { data: services } = await supabase
      .from('services')
      .select(`
        id,
        title,
        description,
        base_price_cents,
        tags,
        categories,
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
      .or(`title.ilike.%${queryLower}%,description.ilike.%${queryLower}%,tags.cs.{"${queryLower}"}`)
      .limit(limit);

    if (services) {
      // Calculer un score de pertinence pour chaque service
      const scoredServices = services.map(service => {
        let score = 0;
        const titleStr = service.title?.toString().toLowerCase() || '';
        const descStr = service.description?.toString().toLowerCase() || '';

        // Score basé sur la position de la correspondance
        if (titleStr.startsWith(queryLower)) score += 100;
        else if (titleStr.includes(queryLower)) score += 50;

        if (descStr.includes(queryLower)) score += 25;

        // Score basé sur les tags
        if (Array.isArray(service.tags)) {
          const tagMatch = service.tags.some((tag: string) =>
            tag.toLowerCase().includes(queryLower)
          );
          if (tagMatch) score += 30;
        }

        // Bonus pour correspondance exacte
        if (titleStr === queryLower) score += 200;

        return { ...service, _score: score };
      });

      // Trier par score et prendre les meilleurs
      results.services = scoredServices
        .sort((a, b) => b._score - a._score)
        .slice(0, limit);
    }

    // 2. Recherche de providers
    const { data: providers } = await supabase
      .from('providers')
      .select(`
        id,
        company_name,
        rating,
        profession,
        profile:profiles!inner(
          id,
          display_name,
          avatar_url,
          first_name,
          last_name
        )
      `)
      .or(`company_name.ilike.%${queryLower}%,profession.ilike.%${queryLower}%,profile.display_name.ilike.%${queryLower}%`)
      .limit(5);

    if (providers) {
      results.providers = providers;
    }

    // 3. Générer des suggestions de mots-clés basées sur la requête
    const keywords = generateKeywordSuggestions(query, services || []);
    results.keywords = keywords;

    console.log('✅ Suggestions generated:', {
      services: results.services.length,
      providers: results.providers.length,
      keywords: results.keywords.length,
    });

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('💥 Error in suggest API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      services: [],
      providers: [],
      keywords: [],
    }, { status: 500 });
  }
}

// Fonction pour générer des suggestions de mots-clés intelligentes
function generateKeywordSuggestions(query: string, services: any[]): string[] {
  const keywords = new Set<string>();
  const queryLower = query.toLowerCase();

  // Extraire les tags des services trouvés
  services.forEach(service => {
    if (Array.isArray(service.tags)) {
      service.tags.forEach((tag: string) => {
        if (tag.toLowerCase().includes(queryLower)) {
          keywords.add(tag);
        }
      });
    }
  });

  // Suggestions basées sur des patterns courants
  const commonPatterns = [
    `${query} professionnel`,
    `${query} premium`,
    `${query} rapide`,
    `${query} personnalisé`,
    `${query} sur mesure`,
  ];

  commonPatterns.forEach(pattern => {
    if (keywords.size < 10) {
      keywords.add(pattern);
    }
  });

  return Array.from(keywords).slice(0, 10);
}
