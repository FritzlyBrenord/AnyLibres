// app/api/provider/become-provider/route.ts
// API pour devenir prestataire
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Vérifier l'authentification
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, email_verified')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Vérifier si l'email et le téléphone sont vérifiés
    if (!profile.email_verified ) {
      const missing = [];
      if (!profile.email_verified) missing.push('email');


      return NextResponse.json(
        {
          error: `Vous devez vérifier votre ${missing.join(' et ')} avant de devenir prestataire.`,
          unverified: missing
        },
        { status: 403 }
      );
    }

    // Vérifier si l'utilisateur est déjà un provider
    if (profile.role === 'provider') {
      return NextResponse.json(
        { error: 'User is already a provider' },
        { status: 400 }
      );
    }

    // Vérifier s'il existe déjà une entrée provider (au cas où le rôle n'aurait pas été mis à jour)
    const { data: existingProviders, error: checkError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', profile.id);

    if (!checkError && existingProviders && existingProviders.length > 0) {
      console.log('Provider already exists for profile:', profile.id);

      // Mettre à jour le rôle si nécessaire
      await supabase
        .from('profiles')
        .update({ role: 'provider' })
        .eq('id', profile.id);

      return NextResponse.json(
        { error: 'Provider profile already exists. Please go to your dashboard.' },
        { status: 400 }
      );
    }

    // Extraire les données du formulaire
    const {
      company_name,
      profession,
      tagline,
      about,
      categories,
      skills,
      languages,
      location,
      starting_price,
      hourly_rate,
      availability,
      experience_years,
      response_time_hours,
    } = body;

    // Validation des champs obligatoires
    if (!profession || !tagline || !about || !starting_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'At least one category is required' },
        { status: 400 }
      );
    }

    if (!skills || skills.length === 0) {
      return NextResponse.json(
        { error: 'At least one skill is required' },
        { status: 400 }
      );
    }

    // Log des données reçues pour debug
    console.log('Received form data:', {
      company_name,
      profession,
      tagline,
      categories,
      skills,
      languages,
      location,
      availability,
      experience_years,
    });

    // Commencer une transaction
    // 1. Créer l'entrée provider
    const providerPayload = {
      profile_id: profile.id,
      company_name: company_name || null,
      profession,
      tagline,
      about,
      categories,
      skills,
      languages: languages || [{ code: 'fr', level: 'native' }],
      location: location || {},
      availability: availability || 'available',
      starting_price: parseFloat(starting_price),
      hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
      experience_years: parseInt(experience_years) || 0,
      response_time_hours: parseInt(response_time_hours) || 24,
      verification_status: 'pending',
      is_verified: false,
      is_active: true,
    };

    console.log('Provider payload:', providerPayload);

    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .insert(providerPayload)
      .select()
      .single();

    if (providerError) {
      console.error('Error creating provider:', {
        error: providerError,
        message: providerError.message,
        details: providerError.details,
        hint: providerError.hint,
        code: providerError.code,
      });
      return NextResponse.json(
        {
          error: 'Failed to create provider profile',
          details: providerError.message,
          hint: providerError.hint,
        },
        { status: 500 }
      );
    }

    // 2. Mettre à jour le role dans profiles
    const { error: updateRoleError } = await supabase
      .from('profiles')
      .update({
        role: 'provider',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateRoleError) {
      console.error('Error updating user role:', updateRoleError);
      // Essayer de supprimer l'entrée provider créée
      await supabase.from('providers').delete().eq('id', providerData.id);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: providerData,
        profile_id: profile.id,
      },
      message: 'Successfully became a provider',
    });
  } catch (error: any) {
    console.error('Error in become-provider API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}