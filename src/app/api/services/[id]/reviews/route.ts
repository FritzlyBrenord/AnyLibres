import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/services/[id]/reviews
 * Get all visible reviews for a specific service
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const supabase = await createClient();

    console.log('🔍 GET /api/services/[id]/reviews - Service ID:', serviceId);

    // Get all orders for this service
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('service_id', serviceId);

    console.log('📦 Order items found:', orderItems?.length || 0);

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des commandes' },
        { status: 500 }
      );
    }

    const orderIds = orderItems?.map(item => item.order_id) || [];
    console.log('📋 Order IDs:', orderIds);

    if (orderIds.length === 0) {
      console.log('⚠️ No orders found for this service');
      return NextResponse.json({
        success: true,
        reviews: [],
        stats: {
          total_reviews: 0,
          average_rating: 0,
          average_communication: 0,
          average_quality: 0,
          average_deadline: 0,
          rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
      });
    }

    // Get all reviews for these orders (REMOVED is_visible filter for now to debug)
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .in('order_id', orderIds)
      .eq('reviewer_type', 'client')
      .order('created_at', { ascending: false });

    console.log('✅ Reviews found:', reviews?.length || 0);
    if (reviews && reviews.length > 0) {
      console.log('📝 First review:', reviews[0]);
      console.log('👁️ Visibility status:', reviews.map(r => ({ id: r.id, is_visible: r.is_visible })));
    }

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des avis' },
        { status: 500 }
      );
    }

    // Fetch reviewer profiles
    if (reviews && reviews.length > 0) {
      const reviewerIds = reviews.map(r => r.reviewer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, first_name, last_name')
        .in('user_id', reviewerIds);

      // Attach profiles to reviews
      const reviewsWithProfiles = reviews.map(review => ({
        ...review,
        reviewer: profiles?.find(p => p.user_id === review.reviewer_id)
      }));

      // Calculate statistics
      const stats = {
        total_reviews: reviewsWithProfiles.length,
        average_rating: reviewsWithProfiles.length > 0
          ? reviewsWithProfiles.reduce((sum, r) => sum + r.rating_overall, 0) / reviewsWithProfiles.length
          : 0,
        average_communication: reviewsWithProfiles.length > 0
          ? reviewsWithProfiles.reduce((sum, r) => sum + (r.rating_communication || 0), 0) / reviewsWithProfiles.length
          : 0,
        average_quality: reviewsWithProfiles.length > 0
          ? reviewsWithProfiles.reduce((sum, r) => sum + (r.rating_quality || 0), 0) / reviewsWithProfiles.length
          : 0,
        average_deadline: reviewsWithProfiles.length > 0
          ? reviewsWithProfiles.reduce((sum, r) => sum + (r.rating_deadline || 0), 0) / reviewsWithProfiles.length
          : 0,
        rating_distribution: {
          5: reviewsWithProfiles.filter(r => r.rating_overall === 5).length,
          4: reviewsWithProfiles.filter(r => r.rating_overall === 4).length,
          3: reviewsWithProfiles.filter(r => r.rating_overall === 3).length,
          2: reviewsWithProfiles.filter(r => r.rating_overall === 2).length,
          1: reviewsWithProfiles.filter(r => r.rating_overall === 1).length,
        }
      };

      return NextResponse.json({
        success: true,
        reviews: reviewsWithProfiles,
        stats
      });
    }

    return NextResponse.json({
      success: true,
      reviews: [],
      stats: {
        total_reviews: 0,
        average_rating: 0,
        average_communication: 0,
        average_quality: 0,
        average_deadline: 0,
        rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    });

  } catch (error: any) {
    console.error('Error in GET /api/services/[id]/reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
