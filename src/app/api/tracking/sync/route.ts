// ============================================================================
// API: Sync User Data from LocalStorage
// Route: /api/tracking/sync
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { views, searches, favorites, pageViews, sessionDuration } = body;

    // Batch insert activities (limiter à 50 pour éviter surcharge)
    const activities = [];

    // Ajouter les vues récentes
    if (views && Array.isArray(views)) {
      views.slice(-50).forEach((view: any) => {
        activities.push({
          user_id: user.id,
          activity_type: `view_${view.type}`,
          entity_type: view.type,
          entity_id: view.id,
          entity_data: view.data,
          created_at: new Date(view.timestamp).toISOString(),
        });
      });
    }

    // Ajouter les recherches
    if (searches && Array.isArray(searches)) {
      searches.slice(-20).forEach((search: any) => {
        activities.push({
          user_id: user.id,
          activity_type: 'search',
          entity_type: 'search',
          search_query: search.query,
          filters_applied: search.filters,
          created_at: new Date(search.timestamp).toISOString(),
        });
      });
    }

    // Insert activités si présentes
    if (activities.length > 0) {
      const { error: activityError } = await supabase
        .from('user_activity_log')
        .insert(activities);

      if (activityError) {
        console.error('Error syncing activities:', activityError);
      }
    }

    return NextResponse.json({ success: true, synced: activities.length });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}