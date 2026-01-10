// ============================================================================
// API Route: /api/services
// GET - List services for a provider
// POST - Create a new service
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const targetProfileId = searchParams.get('profileId');

    let targetProfileIdToUse = '';

    if (targetProfileId) {
      // ADMIN/OVERRIDE MODE
      // Use the passed profileId directly
      targetProfileIdToUse = targetProfileId;
    } else {
      // STANDARD MODE
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 401 }
        );
      }

      // Get profile id for this user
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
      targetProfileIdToUse = profile.id;
    }

    // Get provider using the determined profile ID
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', targetProfileIdToUse)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Provider introuvable' },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const status = searchParams.get('status');
    const visibility = searchParams.get('visibility');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('services')
      .select('*')
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (visibility) {
      query = query.eq('visibility', visibility);
    }

    // Execute query
    const { data: services, error: servicesError } = await query;

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des services' },
        { status: 500 }
      );
    }

    // Apply search filter if provided (client-side for JSONB fields)
    let filteredServices = services || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredServices = filteredServices.filter(service => {
        const titleMatch = Object.values(service.title || {}).some((t: any) =>
          t?.toLowerCase().includes(searchLower)
        );
        const descMatch = Object.values(service.description || {}).some((d: any) =>
          d?.toLowerCase().includes(searchLower)
        );
        const tagMatch = service.tags?.some((tag: string) =>
          tag.toLowerCase().includes(searchLower)
        );
        return titleMatch || descMatch || tagMatch;
      });
    }

    return NextResponse.json({
      services: filteredServices,
      count: filteredServices.length,
    });
  } catch (error) {
    console.error('Error in GET /api/services:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.base_price_cents) {
      return NextResponse.json(
        { error: 'Titre et prix sont requis' },
        { status: 400 }
      );
    }

    // Prepare service data
    const serviceData = {
      provider_id: provider.id,
      title: body.title,
      short_description: body.short_description || {},
      description: body.description || {},
      base_price_cents: parseInt(body.base_price_cents) || 0,
      currency: body.currency || 'USD',
      price_min_cents: body.price_min_cents ? parseInt(body.price_min_cents) : null,
      price_max_cents: body.price_max_cents ? parseInt(body.price_max_cents) : null,
      delivery_time_days: body.delivery_time_days ? parseInt(body.delivery_time_days) : null,
      revisions_included: body.revisions_included ? parseInt(body.revisions_included) : 1,
      max_revisions: body.max_revisions ? parseInt(body.max_revisions) : null,
      extras: body.extras || [],
      cover_image: body.cover_image || null,
      images: body.images || [],
      categories: body.categories || [],
      tags: body.tags || [],
      visibility: body.visibility || 'public',
      status: body.status || 'draft',
      faq: body.faq || [],
      requirements: body.requirements || [],
      location_type: body.location_type || ['remote'],
    };

    // Insert service
    const { data: service, error: insertError } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating service:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du service', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/services:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}