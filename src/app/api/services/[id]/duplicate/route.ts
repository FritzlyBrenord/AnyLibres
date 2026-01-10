// src/app/api/services/[id]/duplicate/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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

    // Get the original service
    const { data: originalService, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('provider_id', provider.id)
      .single();

    if (fetchError || !originalService) {
      return NextResponse.json({ error: 'Service introuvable' }, { status: 404 });
    }

    // Create a duplicate service with modified title
    const duplicatedService = {
      ...originalService,
      id: undefined, // Let Supabase generate a new ID
      title: {
        fr: `${originalService.title.fr || ''} (Copie)`,
        en: `${originalService.title.en || ''} (Copy)`,
      },
      status: 'draft', // Set to draft so the user can review before publishing
      created_at: undefined,
      updated_at: undefined,
      // Reset metrics
      metrics: {
        views: 0,
        clicks: 0,
        orders: 0,
        revenue_cents: 0,
        conversion_rate: 0,
      },
      reviews: [],
    };

    const { data: newService, error: insertError } = await supabase
      .from('services')
      .insert(duplicatedService)
      .select()
      .single();

    if (insertError) {
      console.error('Error duplicating service:', insertError);
      return NextResponse.json({
        error: 'Erreur lors de la duplication',
        details: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      service: newService,
      message: 'Service dupliqué avec succès'
    });
  } catch (error) {
    console.error('Error in POST /api/services/[id]/duplicate:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}