import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/providers/reviews
 * Get all reviews for the authenticated provider
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Get provider profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    // Get provider
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { success: false, error: 'Compte provider non trouvé' },
        { status: 404 }
      );
    }

    // Get all reviews where this provider is the reviewee
    // Note: We show ALL reviews to the provider, even if not yet publicly visible
    // Try both user.id and provider.id to ensure we get all reviews
    console.log('🔍 Searching reviews with:');
    console.log('  - reviewee_id (user.id):', user.id);
    console.log('  - reviewee_id (provider.id):', provider.id);

    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .or(`reviewee_id.eq.${user.id},reviewee_id.eq.${provider.id}`)
      .eq('reviewer_type', 'client')
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des avis' },
        { status: 500 }
      );
    }

    console.log('✅ Reviews found:', reviews?.length || 0);
    console.log('🔍 Provider user_id:', user.id);
    console.log('📦 Provider profile_id:', profile.id);

    // Get all unique order IDs
    const orderIds = reviews?.map(r => r.order_id) || [];

    // Fetch order details with service info
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        order_items (
          id,
          title,
          service_id
        )
      `)
      .in('id', orderIds);

    // Fetch reviewer profiles
    const reviewerIds = reviews?.map(r => r.reviewer_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, first_name, last_name')
      .in('user_id', reviewerIds);

    // Attach additional data to reviews
    const enrichedReviews = reviews?.map(review => {
      const order = orders?.find(o => o.id === review.order_id);
      const reviewer = profiles?.find(p => p.user_id === review.reviewer_id);

      return {
        ...review,
        reviewer,
        order: order ? {
          id: order.id,
          service_title: order.order_items?.[0]?.title || 'Service',
          service_id: order.order_items?.[0]?.service_id
        } : null
      };
    }) || [];

    // Calculate statistics
    const stats = {
      total_reviews: enrichedReviews.length,
      average_rating: enrichedReviews.length > 0
        ? enrichedReviews.reduce((sum, r) => sum + r.rating_overall, 0) / enrichedReviews.length
        : 0,
      average_communication: enrichedReviews.length > 0
        ? enrichedReviews.reduce((sum, r) => sum + (r.rating_communication || 0), 0) / enrichedReviews.length
        : 0,
      average_quality: enrichedReviews.length > 0
        ? enrichedReviews.reduce((sum, r) => sum + (r.rating_quality || 0), 0) / enrichedReviews.length
        : 0,
      average_deadline: enrichedReviews.length > 0
        ? enrichedReviews.reduce((sum, r) => sum + (r.rating_deadline || 0), 0) / enrichedReviews.length
        : 0,
      rating_distribution: {
        5: enrichedReviews.filter(r => r.rating_overall === 5).length,
        4: enrichedReviews.filter(r => r.rating_overall === 4).length,
        3: enrichedReviews.filter(r => r.rating_overall === 3).length,
        2: enrichedReviews.filter(r => r.rating_overall === 2).length,
        1: enrichedReviews.filter(r => r.rating_overall === 1).length,
      },
      with_response: enrichedReviews.filter(r => r.response).length,
      without_response: enrichedReviews.filter(r => !r.response).length,
    };

    return NextResponse.json({
      success: true,
      reviews: enrichedReviews,
      stats
    });

  } catch (error: any) {
    console.error('Error in GET /api/providers/reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
