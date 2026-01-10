import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/reviews/[id]/response
 * Provider responds to a client review
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { response } = body;

    if (!response || response.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'La réponse ne peut pas être vide' },
        { status: 400 }
      );
    }

    // Get the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, error: 'Avis non trouvé' },
        { status: 404 }
      );
    }

    // Verify that the user is the reviewee (the one receiving the review)
    if (review.reviewee_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez répondre qu\'aux avis vous concernant' },
        { status: 403 }
      );
    }

    // Verify that this is a client review (providers respond to client reviews)
    if (review.reviewer_type !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez répondre qu\'aux avis de clients' },
        { status: 400 }
      );
    }

    // Update the review with the response
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        response: response.trim(),
        response_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating review response:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour de la réponse' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Réponse ajoutée avec succès'
    });

  } catch (error: any) {
    console.error('Error in PATCH /api/reviews/[id]/response:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
