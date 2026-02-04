// ============================================================================
// API: GET Provider by ID
// Route: /api/providers/[id]
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    console.log('🔍 GET /api/providers/[id] - Provider ID:', id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Récupérer le provider avec son profil
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select(`
        *,
        profile:profiles(
          id,
          user_id,
          display_name,
          avatar_url,
          bio,
          first_name,
          last_name,
          location
        )
      `)
      .eq('id', id)
      .single();

    if (providerError || !provider) {
      console.error('Error fetching provider:', providerError);
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    console.log('✅ Provider found:', provider.profile?.display_name);

    // Récupérer tous les services du provider
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (servicesError) {
      console.error('Error fetching provider services:', servicesError);
    }

    console.log('📦 Services found:', services?.length || 0);

    // Get provider's user_id for fetching reviews
    const providerUserId = provider.profile?.user_id;

    if (!providerUserId) {
      console.error('❌ Provider user_id not found');
      return NextResponse.json({
        success: true,
        data: {
          provider,
          services: services || [],
          reviews: [],
          stats: {
            total_services: services?.length || 0,
            total_reviews: 0,
            average_rating: 0,
            average_communication: 0,
            average_quality: 0,
            average_deadline: 0,
            rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          },
        },
      });
    }

    // Récupérer les reviews du provider (nouveau système)
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', providerUserId)
      .eq('reviewer_type', 'client')
      .order('created_at', { ascending: false })
      .limit(20);

    console.log('⭐ Reviews found:', reviews?.length || 0);

    if (reviewsError) {
      console.error('Error fetching provider reviews:', reviewsError);
    }

    // Fetch reviewer profiles
    let reviewsWithProfiles = reviews || [];
    if (reviews && reviews.length > 0) {
      const reviewerIds = reviews.map(r => r.reviewer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, first_name, last_name')
        .in('user_id', reviewerIds);

      reviewsWithProfiles = reviews.map(review => ({
        ...review,
        reviewer: profiles?.find(p => p.user_id === review.reviewer_id)
      }));
    }

    // Calculer les statistiques
    const totalReviews = reviewsWithProfiles.length;
    const averageRating = totalReviews > 0
      ? reviewsWithProfiles.reduce((sum, r) => sum + r.rating_overall, 0) / totalReviews
      : 0;

    const averageCommunication = totalReviews > 0
      ? reviewsWithProfiles.reduce((sum, r) => sum + (r.rating_communication || 0), 0) / totalReviews
      : 0;

    const averageQuality = totalReviews > 0
      ? reviewsWithProfiles.reduce((sum, r) => sum + (r.rating_quality || 0), 0) / totalReviews
      : 0;

    const averageDeadline = totalReviews > 0
      ? reviewsWithProfiles.reduce((sum, r) => sum + (r.rating_deadline || 0), 0) / totalReviews
      : 0;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsWithProfiles.forEach((review) => {
      const rating = Math.round(review.rating_overall) as 1 | 2 | 3 | 4 | 5;
      ratingDistribution[rating]++;
    });

    return NextResponse.json({
      success: true,
      data: {
        provider,
        services: services || [],
        reviews: reviewsWithProfiles,
        stats: {
          total_services: services?.length || 0,
          total_reviews: provider.total_reviews || totalReviews,
          average_rating: provider.rating || averageRating,
          average_communication: averageCommunication,
          average_quality: averageQuality,
          average_deadline: averageDeadline,
          rating_distribution: ratingDistribution,
        },
      },
    });

  } catch (error) {
    console.error('Error in provider detail API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}