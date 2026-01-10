// ============================================================================
// API: AI User Analysis & Insights
// Route: /api/ai/analyze
// Analyse comportementale IA de l'utilisateur
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
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 0. Récupérer les mapping de noms de catégories (ID/Key -> Nom FR)
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, key, name');

    const categoryNameMap: Record<string, string> = {};
    if (categoriesData) {
      categoriesData.forEach((cat) => {
        // Mappe l'ID vers le nom FR, ou EN, ou brut
        // La structure de 'name' est supposée être MultiLangText { fr: string, en: string }
        let finalName = cat.key;
        if (typeof cat.name === 'object' && cat.name !== null) {
          finalName = cat.name.fr || cat.name.en || cat.key;
        } else if (typeof cat.name === 'string') {
          finalName = cat.name;
        }

        categoryNameMap[cat.id] = finalName;
        categoryNameMap[cat.key] = finalName; // Mappe aussi la clé
      });
    }

    // 1. Récupérer toutes les activités des 30 derniers jours
    const { data: activities } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // 1b. Récupérer les favoris réels de l'utilisateur pour pondérer l'analyse
    // On suppose une table 'favorites' avec user_id et service_id
    // On récupère 'categories' (array) du service
    const { data: userFavorites } = await supabase
      .from('favorites')
      .select('*, service:services(categories)')
      .eq('user_id', user.id);

    if ((!activities || activities.length === 0) && (!userFavorites || userFavorites.length === 0)) {
      return NextResponse.json({
        success: true,
        analysis: {
          message: 'Pas assez de données pour une analyse',
          behavioralProfile: 'new_user',
          engagementScore: 0,
        },
      });
    }

    // 2. Analyser les catégories préférées
    const categoryViews: Record<string, number> = {};
    const serviceViews: Record<string, number> = {};
    const providerViews: Record<string, number> = {};
    const searchKeywords: Record<string, number> = {};

    // A. Analyser les activités
    if (activities) {
      activities.forEach((activity) => {
        // Catégories
        if (activity.entity_data?.category) {
          const rawCat = activity.entity_data.category;
          categoryViews[rawCat] = (categoryViews[rawCat] || 0) + 1;
        }

        // Services
        if (activity.activity_type === 'view_service' && activity.entity_id) {
          serviceViews[activity.entity_id] = (serviceViews[activity.entity_id] || 0) + 1;
        }

        // Providers
        if (activity.activity_type === 'view_provider' && activity.entity_id) {
          providerViews[activity.entity_id] = (providerViews[activity.entity_id] || 0) + 1;
        }

        // Keywords
        if (activity.search_query) {
          const keywords = activity.search_query.toLowerCase().split(' ');
          keywords.forEach((keyword) => {
            if (keyword.length > 2) {
              searchKeywords[keyword] = (searchKeywords[keyword] || 0) + 1;
            }
          });
        }
      });
    }

    // B. Intégrer les favoris (Pondération forte: +5 points par favori)
    if (userFavorites) {
      userFavorites.forEach((fav: any) => {
        // Supporte structure objet simple ou tableau si jointure one-to-many
        let serviceData = fav.service;
        if (Array.isArray(serviceData)) {
          serviceData = serviceData[0];
        }

        if (serviceData && Array.isArray(serviceData.categories)) {
          serviceData.categories.forEach((catKey: string) => {
            categoryViews[catKey] = (categoryViews[catKey] || 0) + 5;
          });
        }
      });
    }

    // 3. Calculer le profil comportemental
    const activitiesLen = activities?.length || 0;
    const favoritesLen = userFavorites?.length || 0;
    const totalInteractions = activitiesLen + (favoritesLen * 2);

    const uniqueDays = new Set(activities?.map((a) => new Date(a.created_at).toDateString()) || []).size;

    // Total searches
    const searchCount = activities?.filter((a) => a.activity_type === 'search').length || 0;
    // Views
    const viewCount = activities?.filter((a) => a.activity_type.startsWith('view_')).length || 0;

    // Actions (Order, Message, Favorite IN LOGS)
    const actionCountLog = activities?.filter((a) =>
      ['favorite', 'order', 'message'].includes(a.activity_type)
    ).length || 0;

    // Total significant actions (Logs + Real Favorites DB)
    const totalActions = actionCountLog + favoritesLen;

    let behavioralProfile = 'explorer';

    if (totalInteractions > 0) {
      if (searchCount / totalInteractions > 0.4) {
        behavioralProfile = 'researcher';
      } else if (totalActions / totalInteractions > 0.3) {
        behavioralProfile = 'decisive';
      } else if (viewCount > 50 && totalActions / viewCount < 0.1) {
        behavioralProfile = 'comparison_shopper';
      } else if (totalActions / totalInteractions > 0.2 && searchCount / totalInteractions < 0.2) {
        behavioralProfile = 'impulsive';
      }
    }

    // 4. Calculer le score d'engagement
    const engagementScore = Math.min(
      (totalInteractions / 100) * 0.4 +
      (uniqueDays / 30) * 0.3 +
      (totalActions / (totalInteractions || 1)) * 0.3,
      1.0
    );

    // 5. Top catégories (AVEC MAPPING DE NOM)
    const topCategories = Object.entries(categoryViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([rawKey, count]) => {
        // Tenter de trouver le nom lisible
        const readableName = categoryNameMap[rawKey] || rawKey;
        return {
          name: readableName, // On renvoie le nom lisible
          count,
          score: count / (totalInteractions || 1),
          // On garde l'ID original si besoin de lien
          id: rawKey
        };
      });

    // 6. Top keywords
    const topKeywords = Object.entries(searchKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // 7. Patterns de temps
    const timePatterns = analyzeTimePatterns(activities || []);

    // 8. Insights générés
    const insights = generateInsights({
      behavioralProfile,
      engagementScore,
      topCategories,
      topKeywords,
      searchCount,
      viewCount,
      totalActions,
      totalInteractions,
      uniqueDays,
      timePatterns,
    });

    // 9. Sauvegarder les préférences
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        favorite_categories: topCategories,
        frequent_keywords: topKeywords,
        behavioral_profile: behavioralProfile,
        engagement_score: engagementScore,
        search_patterns: timePatterns,
        last_calculated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      analysis: {
        behavioralProfile,
        engagementScore: Math.round(engagementScore * 100) / 100,
        totalActivities: totalInteractions,
        uniqueDays,
        topCategories,
        topKeywords,
        timePatterns,
        insights,
      },
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Helper: Analyser les patterns de temps
function analyzeTimePatterns(activities: any[]) {
  const hourCounts: Record<number, number> = {};
  const dayOfWeekCounts: Record<number, number> = {};

  if (!activities || activities.length === 0) {
    return {
      peak_hour: 12,
      peak_day: 'N/A',
      most_active_time: 'N/A',
    };
  }

  activities.forEach((activity) => {
    const date = new Date(activity.created_at);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
  });

  const peakHourEntry = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
  const peakDayEntry = Object.entries(dayOfWeekCounts).sort(([, a], [, b]) => b - a)[0];

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Formatage correct de l'heure
  const peakH = peakHourEntry ? parseInt(peakHourEntry[0]) : 12;
  // PadStart pour avoir "09h00" au lieu de "9h00"
  const formattedTime = `${peakH.toString().padStart(2, '0')}h00`;

  const peakDIndex = peakDayEntry ? parseInt(peakDayEntry[0]) : new Date().getDay();

  return {
    peak_hour: peakH,
    peak_day: dayNames[peakDIndex] || dayNames[0] || 'Lundi',
    most_active_time: formattedTime,
  };
}

// Helper: Générer des insights
function generateInsights(data: any) {
  const insights = [];

  // Insight 1: Catégorie favorite
  if (data.topCategories.length > 0) {
    insights.push({
      insight_type: 'category_interest',
      title: `Vous adorez ${data.topCategories[0].name}`, // name est maintenant lisible
      description: `${data.topCategories[0].count} intéractions (vues et favoris) avec cette catégorie. Nous avons des nouveautés pour vous!`,
      priority: 'high',
      suggested_action: 'Voir les nouveaux services',
      // Pour l'URL, on préfère utiliser la Key/ID si dispo, ou le nom en lowercase safe
      action_url: `/categories/${(data.topCategories[0].id || data.topCategories[0].name).toLowerCase().replace(/\s+/g, '-')}`,
    });
  }

  // Insight 2: Pattern de recherche
  if (data.searchCount > 5) {
    insights.push({
      insight_type: 'search_behavior',
      title: 'Vous recherchez activement',
      description: `${data.searchCount} recherches effectuées. Affinez vos filtres pour trouver plus rapidement!`,
      priority: 'medium',
    });
  }

  // Insight 3: Engagement
  if (data.engagementScore > 0.6) {
    insights.push({
      insight_type: 'engagement_trend',
      title: 'Utilisateur très actif! 🎉',
      description: `Vous êtes dans le top ${(100 - Math.round(data.engagementScore * 100)) < 10 ? 10 : 20}% des utilisateurs les plus engagés. Continuez!`,
      priority: 'high',
    });
  }

  // Insight 4: Temps d'activité
  if (data.timePatterns.most_active_time !== 'N/A') {
    insights.push({
      insight_type: 'spending_pattern',
      title: `Vous êtes plus actif vers ${data.timePatterns.most_active_time}`,
      description: `La plupart de vos activités ont lieu le ${data.timePatterns.peak_day}.`,
      priority: 'low',
    });
  }

  return insights;
}