// ============================================================================
// API: AI User Analysis & Insights
// Route: /api/ai/analyze
// Analyse comportementale IA de l'utilisateur (Basée sur 30 jours + Historique complet)
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

    // 0. Récupérer le Profil complet (pour le role et la date de création)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, created_at, currency')
      .eq('id', user.id)
      .single();

    // 0b. Récupérer les mapping de catégories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, key, name');

    const categoryNameMap: Record<string, string> = {};
    if (categoriesData) {
      categoriesData.forEach((cat) => {
        let finalName = cat.key;
        if (typeof cat.name === 'object' && cat.name !== null) {
          finalName = cat.name.fr || cat.name.en || cat.key;
        } else if (typeof cat.name === 'string') {
          finalName = cat.name;
        }
        categoryNameMap[cat.id] = finalName;
        categoryNameMap[cat.key] = finalName;
      });
    }

    // 1. Récupérer les données "Activité" (30 jours)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activities } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });

    // 2. Récupérer les COMMANDES (En tant que client) - Historique complet pour profilage
    const { data: clientOrders } = await supabase
      .from('orders')
      .select('*, order_items(*, service:services(categories))')
      .eq('client_id', user.id)
      .in('status', ['paid', 'completed', 'delivered']); // On compte les commandes "réelles"

    // 3. Récupérer les COMMANDES (En tant que prestataire) - Si applicable
    const isProvider = profile?.role === 'provider';
    let providerOrders: any[] = [];
    if (isProvider) {
      const { data: pOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('provider_id', user.id)
        .in('status', ['completed', 'delivered']);
      providerOrders = pOrders || [];
    }

    // 4. Récupérer les AVIS (Donnés et Reçus)
    const { data: reviewsGiven } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id);

    // ========================================================================
    // ANALYSE DES DONNÉES
    // ========================================================================

    const categoryScores: Record<string, number> = {}; // Pour le tri (Pondéré)
    const categoryRealViews: Record<string, number> = {}; // Vues réelles
    const categoryRealPurchases: Record<string, number> = {}; // Commandes réelles

    const searchKeywords: Record<string, number> = {};
    const dateActivity: Record<string, number> = {}; // YYYY-MM-DD -> count
    const hourActivity: Record<number, number> = {}; // 0-23 -> count

    // A. Traitement des Activités (Poids faible: 1)
    if (activities) {
      activities.forEach((act) => {
        // Temps
        const date = new Date(act.created_at);
        const dayKey = date.toISOString().split('T')[0];
        dateActivity[dayKey] = (dateActivity[dayKey] || 0) + 1;
        hourActivity[date.getHours()] = (hourActivity[date.getHours()] || 0) + 1;

        // Catégories vues
        if (act.entity_data?.category) {
          const cat = act.entity_data.category;
          // Score +1 pour le tri
          categoryScores[cat] = (categoryScores[cat] || 0) + 1;
          // Compteur réel +1
          categoryRealViews[cat] = (categoryRealViews[cat] || 0) + 1;
        }

        // Mots clés
        if (act.search_query) {
          const words = act.search_query.toLowerCase().split(/\s+/);
          words.forEach((w) => {
            if (w.length > 3) searchKeywords[w] = (searchKeywords[w] || 0) + 1;
          });
        }
      });
    }

    // B. Traitement des Commandes (Poids fort: 20)
    let totalSpent = 0;
    let categoriesPurchased = new Set<string>();

    if (clientOrders) {
      clientOrders.forEach((order) => {
        totalSpent += order.total_cents;

        // Poids sur les dates des commandes (elles démontrent une activité forte)
        const date = new Date(order.created_at);
        const dayKey = date.toISOString().split('T')[0];
        // Une commande vaut comme 1 action réelle (avant c'était 10, on simplifie pour le "Total Activités" affiché)
        dateActivity[dayKey] = (dateActivity[dayKey] || 0) + 1;

        // Analyser les catégories achetées
        if (order.order_items) {
          order.order_items.forEach((item: any) => {
            const serviceCats = item.service?.categories;
            if (Array.isArray(serviceCats)) {
              serviceCats.forEach((cat: string) => {
                // Score +20 pour le tri
                categoryScores[cat] = (categoryScores[cat] || 0) + 20;
                // Compteur réel +1
                categoryRealPurchases[cat] = (categoryRealPurchases[cat] || 0) + 1;
                categoriesPurchased.add(cat);
              });
            }
          });
        }
      });
    }

    // C. Calcul des Métriques Globales (RÉELLES)
    // Somme simple des actions (sans les multiplicateurs artificiels)
    // totalActivities = (Log entries) + (Orders count)
    const totalActivities = (activities?.length || 0) + (clientOrders?.length || 0);
    const uniqueDays = Object.keys(dateActivity).length;

    // ========================================================================
    // PROFIL COMPORTEMENTAL
    // ========================================================================

    let behavioralProfile = 'new_user';
    const orderCount = clientOrders?.length || 0;
    const reviewCount = reviewsGiven?.length || 0;
    const daysSinceJoin = profile ? Math.ceil((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    if (orderCount > 10 || totalSpent > 500000) { // > 5000$ (approx)
      behavioralProfile = 'decisive'; // "VIP" ou "Gros acheteur" -> Décisif
    } else if (orderCount > 2 && categoriesPurchased.size > 3) {
      behavioralProfile = 'explorer'; // Achète un peu de tout
    } else if (activities && activities.length > 50 && orderCount === 0) {
      behavioralProfile = 'researcher'; // Cherche beaucoup mais n'achète pas
    } else if (orderCount > 0 && reviewCount === orderCount) {
      behavioralProfile = 'comparison_shopper'; // Laisse des avis -> Impliqué/Critique
    } else if (daysSinceJoin < 7 && totalActivities < 10) {
      behavioralProfile = 'new_user';
    } else if (orderCount > 0) {
      behavioralProfile = 'impulsive'; // Acheté rapidement sans trop d'activité (fallback)
    }

    // ========================================================================
    // SCORE D'ENGAGEMENT
    // ========================================================================
    // Score sur 1.0
    // Facteurs: Achat (50%), Rétention (Jours uniques/30) (30%), Volume d'activité (20%)

    const purchaseScore = Math.min(orderCount * 0.1, 0.5); // Max 0.5 si 5 commandes
    const retentionScore = Math.min(uniqueDays / 15, 0.3); // Max 0.3 si 15 jours actifs / 30
    const volumeScore = Math.min(totalActivities / 200, 0.2); // Max 0.2 si 200 actions

    let engagementScore = purchaseScore + retentionScore + volumeScore;
    if (engagementScore > 1) engagementScore = 1;

    // ========================================================================
    // INSIGHTS & PATTERNS
    // ========================================================================

    // Top Catégories
    const topCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key, score]) => {
        // On renvoie les vrais compteurs
        const realViews = categoryRealViews[key] || 0;

        return {
          name: categoryNameMap[key] || key,
          count: realViews, // VRAI nombre de vues, sans pondération
          score: score / (Math.max(...Object.values(categoryScores)) || 1), // Relatif au max (pour la barre de progression)
          id: key
        };
      });

    // Top Keywords
    const topKeywords = Object.entries(searchKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // Time Patterns
    const peakHourEntry = Object.entries(hourActivity).sort(([, a], [, b]) => b - a)[0];
    const peakHour = peakHourEntry ? parseInt(peakHourEntry[0]) : 12;
    const formattedTime = `${peakHour.toString().padStart(2, '0')}h00`;

    // Génération des Insights textuels
    const insights = [];

    // Insight Achat
    if (clientOrders && clientOrders.length > 0) {
      insights.push({
        insight_type: 'financial',
        title: 'Investisseur Actif 💳',
        description: `Vous avez réalisé ${clientOrders.length} commande${clientOrders.length > 1 ? 's' : ''} récemment.`,
        priority: 'high'
      });
    } else if (activities && activities.length > 20) {
      insights.push({
        insight_type: 'window_shopping',
        title: 'En repérage 👀',
        description: "Vous consultez beaucoup de services. Besoin d'aide pour choisir?",
        priority: 'medium'
      });
    }

    // Insight Vendeur (si applicable)
    if (isProvider && providerOrders.length > 0) {
      insights.push({
        insight_type: 'provider_success',
        title: 'Business Maker 🚀',
        description: `Bravo! Vous avez complété ${providerOrders.length} commandes pour vos clients.`,
        priority: 'high'
      });
    }

    // Insight Catégorie
    if (topCategories.length > 0) {
      insights.push({
        insight_type: 'interest',
        title: `Fan de ${topCategories[0].name}`,
        description: "C'est clairement votre domaine de prédilection.",
        priority: 'medium'
      });
    }

    // Insight Avis
    if (reviewsGiven && reviewsGiven.length > 0) {
      insights.push({
        insight_type: 'reviewer',
        title: 'Critique Avisé ⭐',
        description: `Merci d'avoir laissé ${reviewsGiven.length} avis à la communauté.`,
        priority: 'low'
      });
    }

    // Sauvegarde en DB (optionnel mais bon pour le cache)
    // On met à jour user_preferences si nécessaire...

    return NextResponse.json({
      success: true,
      analysis: {
        behavioralProfile,
        engagementScore: Math.round(engagementScore * 100) / 100,
        totalActivities, // Mix d'activités web et d'actions réelles
        uniqueDays,
        topCategories,
        topKeywords,
        timePatterns: {
          peak_hour: peakHour,
          peak_day: 'Calculer...', // Simplification pour l'instant
          most_active_time: formattedTime
        },
        insights,
        // Champs extra pour l'UI améliorée
        stats: {
          totalSpentCents: totalSpent,
          ordersCount: orderCount,
          reviewsCount: reviewCount,
          providerSales: providerOrders.length
        }
      },
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}