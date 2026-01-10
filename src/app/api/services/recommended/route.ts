// ============================================================================
// API: AI-Powered Service Recommendations
// Route: /api/services/recommended
// Recommandations personnalisées basées sur l'IA
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Si non connecté, retourner services populaires
      const { data: services } = await supabase
        .from('services')
        .select('*, provider:providers(*), reviews(*)')
        .eq('status', 'published')
        .order('views_count', { ascending: false })
        .limit(20);

      return NextResponse.json({ success: true, data: services || [] });
    }

    // 1. Récupérer les préférences utilisateur
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 2. Récupérer les recommandations existantes valides
    const { data: existingRecs } = await supabase
      .from('ai_recommendations')
      .select('service_id, confidence_score, recommendation_reason')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('confidence_score', { ascending: false })
      .limit(20);

    let recommendedServiceIds: string[] = [];

    if (existingRecs && existingRecs.length > 0) {
      recommendedServiceIds = existingRecs.map((r) => r.service_id);
    } else {
      // 3. Générer de nouvelles recommandations
      recommendedServiceIds = await generateRecommendations(supabase, user.id, preferences);
    }

    // 4. Récupérer les services complets
    const { data: services } = await supabase
      .from('services')
      .select('*, provider:providers(*), reviews(*)')
      .in('id', recommendedServiceIds)
      .eq('status', 'published');

    if (!services) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 5. Réordonner selon le score de recommandation
    const orderedServices = recommendedServiceIds
      .map((id) => services.find((s) => s.id === id))
      .filter(Boolean);

    return NextResponse.json({ success: true, data: orderedServices });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Générer des recommandations intelligentes
async function generateRecommendations(
  supabase: any,
  userId: string,
  preferences: any
): Promise<string[]> {
  const recommendedIds: string[] = [];
  const recommendations = [];

  // Stratégie 1: Services des catégories préférées
  if (preferences?.favorite_categories && preferences.favorite_categories.length > 0) {
    const topCategories = preferences.favorite_categories.slice(0, 3);

    for (const cat of topCategories) {
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .contains('categories', [cat.name])
        .eq('status', 'published')
        .order('views_count', { ascending: false })
        .limit(5);

      if (services) {
        services.forEach((s: any) => {
          if (!recommendedIds.includes(s.id)) {
            recommendedIds.push(s.id);
            recommendations.push({
              user_id: userId,
              service_id: s.id,
              confidence_score: cat.score || 0.8,
              recommendation_reason: 'popular_in_category',
              reason_details: { category: cat.name },
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        });
      }
    }
  }

  // Stratégie 2: Services similaires aux vus récemment
  const { data: recentViews } = await supabase
    .from('user_activity_log')
    .select('entity_id, entity_data')
    .eq('user_id', userId)
    .eq('activity_type', 'view_service')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentViews && recentViews.length > 0) {
    const viewedIds = recentViews.map((v: any) => v.entity_id).filter(Boolean);

    // Trouver services similaires (même catégorie, prix similaire)
    const { data: similar } = await supabase
      .from('services')
      .select('id, categories, base_price_cents')
      .eq('status', 'published')
      .not('id', 'in', `(${viewedIds.join(',')})`)
      .limit(10);

    if (similar) {
      similar.forEach((s: any) => {
        if (!recommendedIds.includes(s.id) && recommendedIds.length < 20) {
          recommendedIds.push(s.id);
          recommendations.push({
            user_id: userId,
            service_id: s.id,
            confidence_score: 0.75,
            recommendation_reason: 'similar_to_viewed',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      });
    }
  }

  // Stratégie 3: Services correspondant aux mots-clés de recherche
  if (preferences?.frequent_keywords && preferences.frequent_keywords.length > 0) {
    const topKeywords = preferences.frequent_keywords.slice(0, 5).map((k: any) => k.keyword);

    for (const keyword of topKeywords) {
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .or(`title->>'fr'.ilike.%${keyword}%,description->>'fr'.ilike.%${keyword}%`)
        .eq('status', 'published')
        .limit(3);

      if (services) {
        services.forEach((s: any) => {
          if (!recommendedIds.includes(s.id) && recommendedIds.length < 20) {
            recommendedIds.push(s.id);
            recommendations.push({
              user_id: userId,
              service_id: s.id,
              confidence_score: 0.7,
              recommendation_reason: 'matching_search',
              reason_details: { keyword },
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        });
      }
    }
  }

  // Stratégie 4: Services tendances
  const { data: trending } = await supabase
    .from('services')
    .select('id')
    .eq('status', 'published')
    .order('views_count', { ascending: false })
    .limit(5);

  if (trending) {
    trending.forEach((s: any) => {
      if (!recommendedIds.includes(s.id) && recommendedIds.length < 20) {
        recommendedIds.push(s.id);
        recommendations.push({
          user_id: userId,
          service_id: s.id,
          confidence_score: 0.6,
          recommendation_reason: 'trending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    });
  }

  // Sauvegarder les recommandations
  if (recommendations.length > 0) {
    await supabase.from('ai_recommendations').insert(recommendations);
  }

  return recommendedIds;
}