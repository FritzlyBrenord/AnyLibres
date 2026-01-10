import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DEBUG API - Check reviews table structure and data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Check all reviews in database
    const { data: allReviews, error } = await supabase
      .from('reviews')
      .select('*')
      .limit(10);

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Error fetching reviews',
        details: error
      });
    }

    // Get current user's profile
    let userProfile = null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      userProfile = profile;

      // Get provider info if exists
      if (profile) {
        const { data: provider } = await supabase
          .from('providers')
          .select('*')
          .eq('profile_id', profile.id)
          .single();

        userProfile = { ...userProfile, provider };
      }
    }

    return NextResponse.json({
      success: true,
      current_user: user ? {
        id: user.id,
        email: user.email
      } : null,
      user_profile: userProfile,
      total_reviews: allReviews?.length || 0,
      reviews: allReviews,
      message: 'Debug info retrieved'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Internal error',
      details: error.message
    });
  }
}
