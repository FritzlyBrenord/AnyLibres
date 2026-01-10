// src/app/api/services/serv/[id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    console.log('Fetching service with ID:', id);

    // Requête principale pour le service avec les bonnes colonnes providers
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select(`
        *,
        provider:providers(
          id,
          company_name,
          profession,
          categories,
          skills,
          location,
          portfolio,
          languages,
          rating,
          total_reviews,
          completed_orders_count,
          response_time_hours,
          hourly_rate,
          starting_price,
          about,
          tagline,
          experience_years,
          availability,
          is_verified,
          profile:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            location,
            email,
            username,
            bio
          )
        )
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (serviceError) {
      console.error('Service query error:', serviceError);
      return NextResponse.json({ 
        success: false,
        error: 'Service introuvable',
        details: serviceError.message
      }, { status: 404 });
    }

    if (!service) {
      console.error('Service not found for ID:', id);
      return NextResponse.json({ 
        success: false,
        error: 'Service introuvable' 
      }, { status: 404 });
    }

    console.log('Service found:', service.id, service.title);

    // Résoudre les IDs de catégories en noms
    let categoryNames: string[] = [];
    if (service.categories && Array.isArray(service.categories) && service.categories.length > 0) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', service.categories);

      if (categories) {
        categoryNames = categories.map(cat => cat.name);
      }
    }

    // Ajouter les noms de catégories au service
    service.category_names = categoryNames;

    // Récupérer les avis
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('service_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    // Calculer les statistiques des avis
    const totalReviews = reviews?.length || 0;
    const averageRating = reviews && reviews.length > 0 
      ? Number((reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1))
      : 0;

    const reviewStats = {
      totalReviews,
      averageRating,
      ratingDistribution: {
        5: reviews?.filter(r => r.rating === 5).length || 0,
        4: reviews?.filter(r => r.rating === 4).length || 0,
        3: reviews?.filter(r => r.rating === 3).length || 0,
        2: reviews?.filter(r => r.rating === 2).length || 0,
        1: reviews?.filter(r => r.rating === 1).length || 0
      }
    };

    // Préparer la réponse
    const responseData = {
      success: true,
      data: {
        service,
        reviews: reviews || [],
        reviewStats
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in GET /api/services/serv/[id]:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur serveur interne' 
    }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // VÉRIFICATION D'AUTHENTIFICATION pour PATCH
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé - connexion requise' 
      }, { status: 401 });
    }

    // Vérifier que le service existe
    const { data: existingService, error: checkError } = await supabase
      .from('services')
      .select('provider_id')
      .eq('id', id)
      .single();

    if (checkError || !existingService) {
      return NextResponse.json({ 
        success: false,
        error: 'Service introuvable' 
      }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire du service
    // D'abord récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false,
        error: 'Profil introuvable' 
      }, { status: 404 });
    }

    // Puis vérifier que le provider correspond au profil
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (providerError || !provider || existingService.provider_id !== provider.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé - vous n\'êtes pas le propriétaire de ce service' 
      }, { status: 403 });
    }

    const body = await req.json();
    console.log('PATCH request body:', body);

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

    console.log('Update data:', updateData);

    const { data: service, error: updateError } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service:', updateError);
      return NextResponse.json({ 
        success: false,
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
    console.error('Error in PATCH /api/services/serv/[id]:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // VÉRIFICATION D'AUTHENTIFICATION pour DELETE
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé - connexion requise' 
      }, { status: 401 });
    }

    // Vérifier que le service existe
    const { data: existingService, error: checkError } = await supabase
      .from('services')
      .select('provider_id')
      .eq('id', id)
      .single();

    if (checkError || !existingService) {
      return NextResponse.json({ 
        success: false,
        error: 'Service introuvable' 
      }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire du service
    // D'abord récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false,
        error: 'Profil introuvable' 
      }, { status: 404 });
    }

    // Puis vérifier que le provider correspond au profil
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (providerError || !provider || existingService.provider_id !== provider.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé - vous n\'êtes pas le propriétaire de ce service' 
      }, { status: 403 });
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
        success: false,
        error: 'Erreur lors de la suppression',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service supprimé avec succès'
    });
  } catch (error) {
    console.error('Error in DELETE /api/services/serv/[id]:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}