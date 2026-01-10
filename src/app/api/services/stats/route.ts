// src/app/api/services/stats/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profil introuvable' },
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
        { error: 'Provider introuvable' },
        { status: 404 }
      );
    }

    // Get all services for this provider
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', provider.id);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des services' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      total: services?.length || 0,
      published: services?.filter((s: any) => s.status === 'published').length || 0,
      draft: services?.filter((s: any) => s.status === 'draft').length || 0,
      archived: services?.filter((s: any) => s.status === 'archived').length || 0,
      totalViews: services?.reduce((acc: number, s: any) => acc + (s.metrics?.views || 0), 0) || 0,
      totalOrders: services?.reduce((acc: number, s: any) => acc + (s.metrics?.orders || 0), 0) || 0,
      totalRevenue: services?.reduce((acc: number, s: any) => acc + (s.metrics?.revenue_cents || 0), 0) || 0,
      averageRating: 0,
    };

    // Calculate average rating from all reviews
    let totalRatings = 0;
    let totalReviews = 0;

    services?.forEach((service: any) => {
      if (service.reviews && Array.isArray(service.reviews)) {
        service.reviews.forEach((review: any) => {
          totalRatings += review.rating || 0;
          totalReviews++;
        });
      }
    });

    stats.averageRating = totalReviews > 0 ? totalRatings / totalReviews : 0;

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in GET /api/services/stats:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}