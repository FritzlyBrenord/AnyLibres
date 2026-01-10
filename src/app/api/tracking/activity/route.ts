// ============================================================================
// API: Track User Activity
// Route: /api/tracking/activity
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
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
    const {
      activityType,
      entityType,
      entityId,
      entityData,
      searchQuery,
      filtersApplied,
      durationSeconds,
      scrollDepth,
      pageUrl,
      referrerUrl,
      deviceType,
    } = body;

    // Insérer l'activité
    const { error } = await supabase.from('user_activity_log').insert({
      user_id: user.id,
      activity_type: activityType,
      entity_type: entityType || null,
      entity_id: entityId || null,
      entity_data: entityData || null,
      search_query: searchQuery || null,
      filters_applied: filtersApplied || null,
      duration_seconds: durationSeconds || null,
      scroll_depth: scrollDepth || null,
      page_url: pageUrl || null,
      referrer_url: referrerUrl || null,
      device_type: deviceType || null,
    });

    if (error) {
      console.error('Error inserting activity:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track activity error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}