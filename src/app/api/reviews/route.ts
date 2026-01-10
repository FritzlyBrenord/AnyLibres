import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/reviews
 * Create a new review for an order
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      order_id,
      rating_overall,
      rating_communication,
      rating_quality,
      rating_deadline,
      title,
      comment,
      reviewer_type = 'client'
    } = body;

    // Validation
    if (!order_id || !rating_overall || !comment) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes (order_id, rating_overall, comment requis)' },
        { status: 400 }
      );
    }

    if (rating_overall < 1 || rating_overall > 5) {
      return NextResponse.json(
        { success: false, error: 'La note doit être entre 1 et 5' },
        { status: 400 }
      );
    }

    // Get the order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, client_id, provider_id, status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Verify order is delivered or completed
    if (order.status !== 'delivered' && order.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez évaluer que les commandes livrées' },
        { status: 400 }
      );
    }

    // Determine reviewer and reviewee
    let reviewer_id = user.id;
    let reviewee_id: string;

    if (reviewer_type === 'client') {
      // Verify user is the client
      if (order.client_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Vous n\'êtes pas le client de cette commande' },
          { status: 403 }
        );
      }

      // Get provider's user_id from provider table
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('profile_id')
        .eq('id', order.provider_id)
        .single();

      if (providerError || !provider) {
        return NextResponse.json(
          { success: false, error: 'Provider non trouvé' },
          { status: 404 }
        );
      }

      const { data: providerProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', provider.profile_id)
        .single();

      reviewee_id = providerProfile?.user_id;

      console.log('📝 Creating review for provider:');
      console.log('  - Provider ID:', order.provider_id);
      console.log('  - Provider profile_id:', provider.profile_id);
      console.log('  - Provider user_id (reviewee):', reviewee_id);
      console.log('  - Client user_id (reviewer):', user.id);
    } else {
      // Provider reviewing client
      // Get provider profile
      const { data: providerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!providerProfile) {
        return NextResponse.json(
          { success: false, error: 'Profil provider non trouvé' },
          { status: 404 }
        );
      }

      // Verify user is the provider
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('profile_id', providerProfile.id)
        .eq('id', order.provider_id)
        .single();

      if (!provider) {
        return NextResponse.json(
          { success: false, error: 'Vous n\'êtes pas le provider de cette commande' },
          { status: 403 }
        );
      }

      reviewee_id = order.client_id;
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order_id)
      .eq('reviewer_id', user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Vous avez déjà évalué cette commande' },
        { status: 409 }
      );
    }

    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        order_id,
        reviewer_id,
        reviewee_id,
        reviewer_type,
        rating_overall,
        rating_communication: rating_communication || rating_overall,
        rating_quality: rating_quality || rating_overall,
        rating_deadline: rating_deadline || rating_overall,
        title,
        comment
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création de l\'avis' },
        { status: 500 }
      );
    }

    console.log('✅ Review created successfully:');
    console.log('  - Review ID:', review.id);
    console.log('  - Reviewer ID:', review.reviewer_id);
    console.log('  - Reviewee ID:', review.reviewee_id);
    console.log('  - Is visible:', review.is_visible);

    // Update order status to completed if both reviews are done
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order_id);

    if (allReviews && allReviews.length >= 2) {
      await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order_id);
    }

    return NextResponse.json({
      success: true,
      review,
      message: 'Avis créé avec succès'
    });

  } catch (error: any) {
    console.error('Error in POST /api/reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews?order_id=xxx or ?provider_id=xxx
 * Get reviews for an order or provider
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');
    const provider_id = searchParams.get('provider_id');

    if (order_id) {
      console.log('🔍 GET /api/reviews - Fetching reviews for order_id:', order_id);

      // Get reviews for a specific order
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('order_id', order_id)
        .order('created_at', { ascending: false });

      console.log('📊 Found reviews count:', reviews?.length || 0);
      if (reviews && reviews.length > 0) {
        console.log('📝 First review:', reviews[0]);
      }

      if (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la récupération des avis' },
          { status: 500 }
        );
      }

      // Manually fetch reviewer profiles
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

        return NextResponse.json({ success: true, reviews: reviewsWithProfiles });
      }

      return NextResponse.json({ success: true, reviews });
    }

    if (provider_id) {
      // Get provider's user_id
      const { data: provider } = await supabase
        .from('providers')
        .select('profile_id')
        .eq('id', provider_id)
        .single();

      if (!provider) {
        return NextResponse.json(
          { success: false, error: 'Provider non trouvé' },
          { status: 404 }
        );
      }

      const { data: providerProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', provider.profile_id)
        .single();

      // Get all visible reviews for this provider
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', providerProfile?.user_id)
        .eq('is_visible', true)
        .eq('reviewer_type', 'client')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching provider reviews:', error);
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la récupération des avis' },
          { status: 500 }
        );
      }

      // Manually fetch reviewer profiles
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

        return NextResponse.json({ success: true, reviews: reviewsWithProfiles });
      }

      return NextResponse.json({ success: true, reviews });
    }

    return NextResponse.json(
      { success: false, error: 'Paramètre order_id ou provider_id requis' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error in GET /api/reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
