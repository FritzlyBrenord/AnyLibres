// src/app/api/services/[id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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

    // Vérifier que l'utilisateur est le propriétaire du service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)

      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service introuvable' }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error in GET /api/services/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
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

    // Vérifier que l'utilisateur est le propriétaire du service
    const { data: existingService, error: checkError } = await supabase
      .from('services')
      .select('provider_id')
      .eq('id', id)
      .single();

    if (checkError || !existingService) {
      return NextResponse.json({ error: 'Service introuvable' }, { status: 404 });
    }

    if (existingService.provider_id !== provider.id) {
      return NextResponse.json({ error: 'Non autorisé - vous n\'êtes pas le propriétaire de ce service' }, { status: 403 });
    }

    const body = await req.json();
    console.log('PATCH request body:', body); // Debug

    // Préparer les données de mise à jour
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Mapper les champs avec conversion des types
    if (body.title !== undefined) updateData.title = body.title;
    if (body.short_description !== undefined) updateData.short_description = body.short_description;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.base_price_cents !== undefined) updateData.base_price_cents = parseInt(body.base_price_cents);
    if (body.price_min_cents !== undefined) updateData.price_min_cents = body.price_min_cents ? parseInt(body.price_min_cents) : null;
    if (body.price_max_cents !== undefined) updateData.price_max_cents = body.price_max_cents ? parseInt(body.price_max_cents) : null;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.delivery_time_days !== undefined) updateData.delivery_time_days = parseInt(body.delivery_time_days);
    if (body.revisions_included !== undefined) updateData.revisions_included = parseInt(body.revisions_included);
    if (body.max_revisions !== undefined) updateData.max_revisions = body.max_revisions ? parseInt(body.max_revisions) : null;
    if (body.extras !== undefined) updateData.extras = body.extras;
    if (body.cover_image !== undefined) updateData.cover_image = body.cover_image;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.categories !== undefined) updateData.categories = body.categories;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.faq !== undefined) updateData.faq = body.faq;
    if (body.requirements !== undefined) updateData.requirements = body.requirements;
    if (body.location_type !== undefined) updateData.location_type = body.location_type;

    console.log('Update data:', updateData); // Debug

    const { data: service, error: updateError } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service:', updateError);
      return NextResponse.json({
        error: 'Erreur lors de la mise à jour',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      service,
      message: 'Service mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error in PATCH /api/services/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Vérifier que l'utilisateur est le propriétaire du service
    const { data: existingService, error: checkError } = await supabase
      .from('services')
      .select('provider_id')
      .eq('id', id)
      .single();

    if (checkError || !existingService) {
      return NextResponse.json({ error: 'Service introuvable' }, { status: 404 });
    }

    if (existingService.provider_id !== provider.id) {
      return NextResponse.json({ error: 'Non autorisé - vous n\'êtes pas le propriétaire de ce service' }, { status: 403 });
    }

    // Supprimer le service
    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('provider_id', provider.id);

    if (deleteError) {
      console.error('Error deleting service:', deleteError);
      return NextResponse.json({
        error: 'Erreur lors de la suppression',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service supprimé avec succès'
    });
  } catch (error) {
    console.error('Error in DELETE /api/services/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}