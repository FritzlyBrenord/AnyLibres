// ============================================================================
// API: New Providers
// Route: /api/providers/new
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Force dynamic rendering (no cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  console.log('🔍 [API /api/providers/new] Starting request...');
  try {
    const supabase = await createClient();

    const { data: providers, error } = await supabase
      .from('providers')
      .select('*, profile:profiles(*)')
      .eq('verification_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ [API /api/providers/new] Error fetching providers:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('📊 [API /api/providers/new] Found', providers?.length || 0, 'providers');

    // Enrichir avec le rating calculé
    console.log('🔄 [API /api/providers/new] Enriching providers with ratings...');
    const providersWithRating = await Promise.all(
      (providers || []).map(async (provider) => {
        try {
          const providerUserId = provider.profile?.user_id;
          console.log('👤 [Provider', provider.id.substring(0, 8) + '...] User ID:', providerUserId);

          if (!providerUserId) {
            console.log('⚠️ [Provider', provider.id.substring(0, 8) + '...] No user_id found');
            return { ...provider, rating: 0, total_reviews: 0, stats: { average_rating: 0, total_reviews: 0 } };
          }

          const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('rating_overall')
            .eq('reviewee_id', providerUserId)
            .eq('reviewer_type', 'client');

          if (reviewsError) {
            console.error('❌ [Provider', provider.id.substring(0, 8) + '...] Error fetching reviews:', reviewsError);
          }

          console.log('⭐ [Provider', provider.id.substring(0, 8) + '...] Found', reviews?.length || 0, 'reviews');

          if (!reviews || reviews.length === 0) {
            return {
              ...provider,
              rating: 0,
              total_reviews: 0,
              stats: { average_rating: 0, total_reviews: 0 }
            };
          }

          const total = reviews.reduce((acc, r) => acc + (r.rating_overall || 0), 0);
          const avg = total / reviews.length;

          console.log('✅ [Provider', provider.id.substring(0, 8) + '...] Calculated rating:', avg.toFixed(2), 'from', reviews.length, 'reviews');

          return {
            ...provider,
            rating: avg,
            total_reviews: reviews.length,
            stats: {
              average_rating: avg,
              total_reviews: reviews.length
            }
          };
        } catch (e) {
          console.error('❌ [Provider enrichment] Error:', e);
          return { ...provider, rating: 0, total_reviews: 0, stats: { average_rating: 0, total_reviews: 0 } };
        }
      })
    );

    console.log('✨ [API /api/providers/new] Returning', providersWithRating.length, 'enriched providers');
    console.log('📋 [API /api/providers/new] Sample data:', providersWithRating[0] ? {
      id: providersWithRating[0].id.substring(0, 8) + '...',
      rating: providersWithRating[0].rating,
      total_reviews: providersWithRating[0].total_reviews,
      stats: providersWithRating[0].stats
    } : 'No providers');

    return NextResponse.json({ success: true, data: providersWithRating });
  } catch (error) {
    console.error('❌ [API /api/providers/new] Fatal error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}